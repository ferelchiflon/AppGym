/**
 * Script temporal de verificación visual: tarjeta de nutrición del Dashboard.
 * Captura en modo oscuro (desktop + mobile) y shot enfocado de #nutricionCard.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const APP_URL = process.env.APP_URL || 'http://localhost:4173/';
const DIR = 'screenshots';
mkdirSync(DIR, { recursive: true });

async function shoot(page, name, opts = {}) {
  await page.screenshot({ path: `${DIR}/${name}.png`, ...opts });
  console.log(`  Saved: ${DIR}/${name}.png`);
}

async function main() {
  const browser = await chromium.launch();

  // --- Desktop, modo oscuro (la app es dark-first) ---
  const ctxDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await ctxDesktop.newPage();
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // animaciones de entrada

  // Si aparece un picker de perfiles, elegir el primero para llegar al dashboard.
  const pickerBtn = page.locator('.profile-picker button, .profile-list button, #profilePicker button').first();
  if ((await pickerBtn.count()) > 0) {
    try { await pickerBtn.click({ timeout: 2000 }); await page.waitForTimeout(1000); } catch { /* sin picker */ }
  }

  // Dashboard completo (dark, desktop)
  const card = page.locator('#nutricionCard');
  await card.waitFor({ state: 'visible', timeout: 8000 });
  await shoot(page, '01-dashboard-dark-desktop', { fullPage: true });

  // Shot enfocado de la tarjeta de nutrición
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await card.screenshot({ path: `${DIR}/02-nutricion-card-dark.png` });
  console.log('  Saved: screenshots/02-nutricion-card-dark.png');

  // Interacción rápida: +1 comida y activar proteína para capturar estado activo
  const btnMas = page.locator('.stepper-chip[data-step-val="1"]').first();
  const protBtn = page.locator('#nutricionProteinaBtn');
  await btnMas.click();
  await btnMas.click();
  await protBtn.click();
  await page.waitForTimeout(300);
  await card.screenshot({ path: `${DIR}/03-nutricion-card-interaccion.png` });
  console.log('  Saved: screenshots/03-nutricion-card-interaccion.png');
  await ctxDesktop.close();

  // --- Mobile (390px, modo oscuro) ---
  const ctxMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await ctxMobile.newPage();
  await mpage.goto(APP_URL, { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(1200);
  const mcard = mpage.locator('#nutricionCard');
  await mcard.waitFor({ state: 'visible', timeout: 8000 });
  await mcard.scrollIntoViewIfNeeded();
  await mpage.waitForTimeout(400);
  await mcard.screenshot({ path: `${DIR}/04-nutricion-card-mobile-dark.png` });
  console.log('  Saved: screenshots/04-nutricion-card-mobile-dark.png');
  await ctxMobile.close();

  await browser.close();
  console.log('Done!');
}

main().catch((err) => { console.error(err); process.exit(1); });
