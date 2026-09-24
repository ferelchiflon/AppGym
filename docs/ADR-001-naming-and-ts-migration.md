# ADR-001 — Convención de nombres y migración a TypeScript

**Estado**: Aceptado · **Fecha**: 2026-09-23 · **Alcance**: `src/`, `tests/`, `scripts/`

## Contexto

La auditoría de estructura (v6.0.0) detectó dos convenciones de nombres
conviviendo en `src/components/` (PascalCase: `Button.js`, `Modal.js`,
`Timer.js` vs kebab-case dominante: `cardio-form.js`, `dashboard-widgets.js`),
además de una mezcla de `.js`/`.ts` heredada de la "Fase 1" de migración a
TypeScript, sin decisión registrada.

## Decisión

1. **kebab-case** es la convención canónica para TODO archivo y carpeta de
   `src/`, `tests/` y `scripts/` (ya dominante: controladores `*.controller.js`,
   gestores `gestor-*.js`, renderers, helpers).
2. Los 3 componentes legados en PascalCase (`Button.js`, `Modal.js`,
   `Timer.js`) se renombrarán en un PR mecánico posterior (solo cambiar el
   nombre + imports; sin cambios de contenido). No se aceptan NUEVOS archivos
   en PascalCase.
3. **Migración TS — Fase 2**: cada archivo `.js` que pase a verificarse lo hace
   con el pragma `// @ts-check` (empezando por `src/store.js`, el módulo de
   mayor riesgo), anotando JSDoc donde el inference no alcance. No se activa
   `checkJs` global hasta que la deuda por archivo sea cero.
4. `src/utils.ts` (módulo) y `src/helpers/` (carpeta, renombrada desde
   `src/utils/`) resuelven la colisión de nombres que impedía imports sin
   extensión. Los imports usan extensión explícita (`./utils.ts`) gracias a
   `allowImportingTsExtension`.

## Consecuencias

- Los renames futuros son triviales y sin ambigüedad de resolución.
- El `typecheck` crece en cobertura de forma incremental y verificable.
- El PR de renames de componentes debe ejecutarse solo con `git mv` +
   actualización de imports para preservar el historial (`git log --follow`).
