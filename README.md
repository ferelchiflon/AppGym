# GYM PRO

Registro de entrenamiento, periodización y seguimiento de progreso (PWA offline-first).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Compilación de producción (Vite → `dist/`) |
| `npm run preview` | Previsualización del build de producción |
| `npm run lint` | Linter (ESLint) sobre `src/**/*.js` |
| `npm run typecheck` | Chequeo de tipos TypeScript sin emitir (`tsc --noEmit`) |
| `npm run format` | Formateo con Prettier (`src/**/*.{js,css}`) |
| `npm test` | Suite de tests unitarios (Vitest, ejecución única) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |

## Chequeo de tipos (TypeScript)

- Configuración en `tsconfig.json`: `noEmit: true` y `include: ["src", "tests"]`.
- `src/types/gym.d.ts` contiene los contratos de datos globales del ecosistema.
- Ejecutar `npm run typecheck` valida los tipos de todos los archivos `.ts` sin generar salida.

## Linter (ESLint)

- Configuración en `eslint.config.js` (ESLint 9 flat config).
- Actualmente el linter procesa **solo** archivos `.js` (`eslint src --ext .js`).
- Los archivos `.ts` se validan exclusivamente mediante `npm run typecheck`.

### ⚠️ Por qué el linter aún no cubre `.ts`

El proyecto usa **`typescript@7.0.2`**, una versión muy reciente que aún **no es compatible** con
[`typescript-eslint`](https://typescript-eslint.io/) (la herramienta estándar para linting de
TypeScript con ESLint):

```
npm error peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.69.0
npm error Found: typescript@7.0.2
```

Si se añade `.ts` al comando `lint` sin `typescript-eslint`, ESLint falla con
`Parsing error: Unexpected token` porque su parser por defecto (`espree`) no entiende la sintaxis
TypeScript (`type`, `interface`, uniones `|`, etc.).

## Plan de migración — Linting completo de TypeScript

Para habilitar el linting de los archivos `.ts` con ESLint, es necesario **degradar TypeScript a una
versión estable** dentro del rango soportado por `typescript-eslint`:

### Pasos

1. **Degradar TypeScript a una versión estable (LTS)**:

   ```bash
   npm install --save-dev typescript@^5.7.2
   npm install --save-dev typescript-eslint
   ```

   > `typescript@5.7.x` es estable y cuenta con soporte completo de `typescript-eslint`.

2. **Actualizar `eslint.config.js`** para usar el parser y plugin de TypeScript:

   ```js
   import js from '@eslint/js';
   import globals from 'globals';
   import tseslint from 'typescript-eslint';

   export default [
     js.configs.recommended,
     ...tseslint.configs.recommended,
     {
       languageOptions: {
         ecmaVersion: 2022,
         sourceType: 'module',
         parser: tseslint.parser,
         globals: {
           ...globals.browser,
           Chart: 'readonly',
         },
       },
       files: ['**/*.ts'],
       rules: {
         // reglas específicas de TS aquí
       },
     },
     {
       languageOptions: {
         ecmaVersion: 2022,
         sourceType: 'module',
         globals: {
           ...globals.browser,
           Chart: 'readonly',
         },
       },
       files: ['**/*.js'],
       rules: {
         'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
         'no-undef': 'error',
         'no-console': 'off',
         'prefer-const': 'warn',
         'eqeqeq': ['error', 'always'],
         'no-var': 'error',
       },
     },
   ];
   ```

3. **Ampliar el script `lint`** para incluir `.ts`:

   ```json
   "lint": "eslint src --ext .js,.ts"
   ```

4. **Verificar** que todo funcione correctamente:

   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```

### Contexto

- Actualmente solo existe un archivo `.ts` en `src/`: `src/types/gym.d.ts`.
- La migración es de bajo riesgo porque el único archivo TS es de declaración de tipos.
- Una vez completada la migración, `typescript-eslint` permitirá aplicar reglas de linting
  específicas de TypeScript (p. ej. `@typescript-eslint/no-explicit-any`,
  `@typescript-eslint/consistent-type-imports`) además del chequeo de tipos de `tsc`.