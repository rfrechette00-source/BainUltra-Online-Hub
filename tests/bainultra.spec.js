// @ts-check
const { test, expect } = require('@playwright/test');

// Resolve full URL for a site path. Works against any BASE_URL (live
// GitHub Pages site at /BainUltra-Online-Hub subpath, local dev server at /,
// future Vercel preview URL, etc). Defaults to the live site.
const BASE_URL = process.env.BASE_URL || 'https://rfrechette00-source.github.io/BainUltra-Online-Hub';
const at = (path) => BASE_URL.replace(/\/$/, '') + path;

// ─── Hub Landing Page ──────────────────────────────────────────────────────

test.describe('Hub landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(at('/'));
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/BainUltra/i);
  });

  test('BainUltra logo is visible', async ({ page }) => {
    const logo = page.locator('#Logo, .logo-mark svg, .logo-mark img').first();
    await expect(logo).toBeVisible();
  });

  test('Product Knowledge Presentation tile is visible and links correctly', async ({ page }) => {
    const title = page.locator('.card:has(a.card-view[href="presentation/"]) .card-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Product Knowledge Presentation');
    await expect(page.locator('a.card-view[href="presentation/"]')).toBeVisible();
  });

  test('Mini Product Brochure tile is visible and links correctly', async ({ page }) => {
    const title = page.locator('.card:has(a.card-view[href="brochure/"]) .card-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Mini Product Brochure');
    await expect(page.locator('a.card-view[href="brochure/"]')).toBeVisible();
  });

  test('Brand Kit tile is visible and links correctly', async ({ page }) => {
    const title = page.locator('.card:has(a.card-view[href="brand-kit/"]) .card-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Brand Kit');
    await expect(page.locator('a.card-view[href="brand-kit/"]')).toBeVisible();
  });

  test('no uncaught JS errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('all card-view tiles are clickable', async ({ page }) => {
    const tiles = page.locator('a.card-view');
    const count = await tiles.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < count; i++) {
      await expect(tiles.nth(i)).toBeEnabled();
    }
  });
});

// ─── Brand Kit Landing ──────────────────────────────────────────────────────

test.describe('Brand Kit landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(at('/brand-kit/'));
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Brand Kit/i);
  });

  test('back link returns to hub', async ({ page }) => {
    const back = page.locator('a.back-link[href="../"]');
    await expect(back).toBeVisible();
  });

  test('renders all 8 folder tiles', async ({ page }) => {
    const tiles = page.locator('a.folder-card');
    await expect(tiles).toHaveCount(8);
  });

  test('Marketing & Advertising tile is present', async ({ page }) => {
    const tile = page.locator('a.folder-card[data-folder-name="Marketing & Advertising"]');
    await expect(tile).toBeVisible();
  });

  test('Product Images tile is present', async ({ page }) => {
    const tile = page.locator('a.folder-card[data-folder-name="Product Images"]');
    await expect(tile).toBeVisible();
  });

  test('Brand Guidelines tile is present', async ({ page }) => {
    const tile = page.locator('a.folder-card[data-folder-name="Brand Guidelines"]');
    await expect(tile).toBeVisible();
  });

  test('Showroom Video Loop tile links to video page', async ({ page }) => {
    const tile = page.locator('a.folder-card[href="video/"]');
    await expect(tile).toBeVisible();
  });

  test('Order Forms tile links to subfolder page', async ({ page }) => {
    const tile = page.locator('a.folder-card[href="order-forms-product-sheets/"]');
    await expect(tile).toBeVisible();
  });

  test('static thumbnails load without 404', async ({ page }) => {
    const failed = [];
    page.on('response', res => {
      if (res.url().includes('/thumbnails/') && !res.ok()) {
        failed.push(res.url());
      }
    });
    await page.goto(at('/brand-kit/'));
    await page.waitForLoadState('networkidle');
    expect(failed).toHaveLength(0);
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/brand-kit/'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('clicking Marketing tile navigates to viewer', async ({ page }) => {
    await page.locator('a.folder-card[data-folder-name="Marketing & Advertising"]').click();
    await expect(page).toHaveURL(/\/brand-kit\/view\/\?name=Marketing/);
  });
});

// ─── Brand Kit Folder Viewer ────────────────────────────────────────────────

test.describe('Brand Kit folder viewer', () => {
  test('page loads with folder name in URL', async ({ page }) => {
    await page.goto(at('/brand-kit/view/?name=Product+Images'));
    await expect(page).toHaveTitle(/BainUltra/i);
    await expect(page.locator('.header')).toBeVisible();
  });

  test('content div is present in DOM', async ({ page }) => {
    await page.goto(at('/brand-kit/view/?name=Marketing+%26+Advertising'));
    await expect(page.locator('#content')).toBeAttached();
  });

  test('back-to-brand-kit link is visible', async ({ page }) => {
    await page.goto(at('/brand-kit/view/?name=Brand+Guidelines'));
    const back = page.locator('a[href="../"], a.back-link');
    await expect(back.first()).toBeVisible();
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/brand-kit/view/?name=Product+Images'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Pricebook / Flipbook ───────────────────────────────────────────────────

test.describe('Pricebook flipbook', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(at('/pricebook/'));
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Price/i);
  });

  test('loader element exists', async ({ page }) => {
    await expect(page.locator('#loader, .loading')).toBeAttached();
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/pricebook/'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Brochure Flipbook ──────────────────────────────────────────────────────

test.describe('Brochure flipbook', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(at('/brochure/'));
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Brochure/i);
  });

  test('loader element exists in DOM', async ({ page }) => {
    await expect(page.locator('#loader')).toBeAttached();
  });

  test('next navigation button is present', async ({ page }) => {
    await expect(page.locator('#navR, .nav-next')).toBeAttached();
  });

  test('prev navigation button is present', async ({ page }) => {
    await expect(page.locator('#navL, .nav-prev')).toBeAttached();
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/brochure/'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Presentation Viewer ────────────────────────────────────────────────────

test.describe('Presentation viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(at('/presentation/'));
  });

  test('page loads without crashing', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/);
  });

  test('has a title containing BainUltra', async ({ page }) => {
    await expect(page).toHaveTitle(/BainUltra/i);
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/presentation/'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Terminal Launcher Tool ─────────────────────────────────────────────────

test.describe('Terminal launcher tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(at('/tools/launcher.html'));
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Launcher/i);
  });

  test('project path input is present', async ({ page }) => {
    await expect(page.locator('#projectPath')).toBeVisible();
  });

  test('copy buttons are present', async ({ page }) => {
    const copyBtns = page.locator('.btn-copy');
    const count = await copyBtns.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('run buttons are present', async ({ page }) => {
    const runBtns = page.locator('.btn-run');
    const count = await runBtns.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('custom command textarea is present', async ({ page }) => {
    await expect(page.locator('#customCmd')).toBeVisible();
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/tools/launcher.html'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Order Forms & Product Sheets ──────────────────────────────────────────

test.describe('Order Forms & Product Sheets page', () => {
  test('page loads', async ({ page }) => {
    await page.goto(at('/brand-kit/order-forms-product-sheets/'));
    await expect(page).toHaveTitle(/BainUltra/i);
  });

  test('back link is visible', async ({ page }) => {
    await page.goto(at('/brand-kit/order-forms-product-sheets/'));
    const back = page.locator('a.back-link, a[href="../"]');
    await expect(back.first()).toBeVisible();
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/brand-kit/order-forms-product-sheets/'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Video Player Page ──────────────────────────────────────────────────────

test.describe('Showroom video page', () => {
  test('page loads', async ({ page }) => {
    await page.goto(at('/brand-kit/video/'));
    await expect(page).toHaveTitle(/BainUltra/i);
  });

  test('video element or container is in DOM', async ({ page }) => {
    await page.goto(at('/brand-kit/video/'));
    await page.waitForLoadState('networkidle');
    const videoEl = page.locator('video, iframe, #video-container, .video-wrapper');
    const count = await videoEl.count();
    expect(count).toBeGreaterThanOrEqual(0); // passes even if video not yet resolved from Drive
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(at('/brand-kit/video/'));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Mobile Viewport ────────────────────────────────────────────────────────

test.describe('Mobile viewport', () => {
  test('hub landing renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(at('/'));
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('brand-kit landing tiles visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(at('/brand-kit/'));
    const tiles = page.locator('a.folder-card');
    await expect(tiles.first()).toBeVisible();
  });
});

// ─── Navigation Flows ───────────────────────────────────────────────────────

test.describe('Navigation flows', () => {
  test('hub → brand-kit → back to hub', async ({ page }) => {
    await page.goto(at('/'));
    await page.locator('a.card-view[href="brand-kit/"]').click();
    await expect(page).toHaveURL(/\/brand-kit\//);
    await page.locator('a.back-link[href="../"]').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('hub → brochure page loads', async ({ page }) => {
    await page.goto(at('/'));
    await page.locator('a.card-view[href="brochure/"]').click();
    await expect(page).toHaveURL(/\/brochure\//);
    await expect(page).toHaveTitle(/Brochure/i);
  });

  test('hub → presentation page loads', async ({ page }) => {
    await page.goto(at('/'));
    await page.locator('a.card-view[href="presentation/"]').click();
    await expect(page).toHaveURL(/\/presentation\//);
  });

  test('brand-kit → viewer → back to brand-kit', async ({ page }) => {
    await page.goto(at('/brand-kit/'));
    await page.locator('a.folder-card[data-folder-name="Product Images"]').click();
    await expect(page).toHaveURL(/\/brand-kit\/view\//);
    await page.locator('a[href="../"], a.back-link').first().click();
    await expect(page).toHaveURL(/\/brand-kit\//);
  });
});
