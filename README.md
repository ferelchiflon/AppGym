# GYM PRO

Registro de entrenamiento, periodización y seguimiento de progreso (PWA offline-first).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Compilación de producción (Vite → `dist/`) |
| `npm run preview` | Previsualización del build de producción |
| `npm run lint` | Linter (ESLint) sobre `src/**/*.{js,ts}` |
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
- El linter procesa archivos `.js` **y** `.ts` (`eslint src --ext .js,.ts`).
- Usa el parser y las reglas de [`typescript-eslint`](https://typescript-eslint.io/)
  para los archivos `.ts` (`@typescript-eslint/no-explicit-any`,
  `@typescript-eslint/consistent-type-imports`, etc.), además de `tsc` como chequeo de tipos.

```bash
npm run lint      # Lint sobre src/**/*.{js,ts}
npm run typecheck # Chequeo de tipos (tsc --noEmit)
```

### Compatibilidad TypeScript ↔ typescript-eslint

- `typescript@^5.7` (estable) + `typescript-eslint@^8` son plenamente compatibles.
- Antes de esta migración el proyecto usaba `typescript@7.x` (experimental), que **no** era
  compatible con `typescript-eslint` (rango de peer `>=4.8.4 <6.1.0`), por lo que el linter
  solo podía procesar `.js` con su parser por defecto (`espree`), que falla ante la sintaxis
  TypeScript (`type`, `interface`, uniones `|`, etc.).
- Se degradó a una versión estable y se añadió `typescript-eslint` para habilitar el linting
  completo de `.ts`.
- `src/types/gym.d.ts` es, actualmente, el único archivo `.ts` de `src/`.