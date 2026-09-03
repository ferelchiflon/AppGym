/**
 * src/views/index.js
 * Punto de entrada único que decide el orden de inserción de las vistas.
 * Se concatena SÍNCRONAMENTE desde src/main.js ANTES de instanciar AppGymPro
 * para que todo el binding centralizado por ID en app.js funcione.
 */
import drawer from './drawer.js';
import header from './header.js';
import dashboard from './dashboard.js';
import workout from './workout.js';
import history from './history.js';
import progress from './progress.js';
import profile from './profile.js';
import chrome from './chrome.js';

/** Orden exacto de inserción dentro de <div class="app" id="app">. */
export const appLayout = [
  drawer,
  header,
  dashboard,
  workout,
  history,
  progress,
  profile,
  chrome,
];

export default appLayout;
