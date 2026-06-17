import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3002';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function takeScreenshot(page, name) {
  await page.screenshot({ path: `/tmp/tmanina-${name}.png`, fullPage: true });
  console.log(`  ✓ Screenshot saved: tmanina-${name}.png`);
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/adminsec/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('\n=== Testing Dark Mode on All Pages ===\n');

  // 1. MAIN PAGE - Light mode
  console.log('1. Main page (light mode)...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(3000);
  await takeScreenshot(page, '01-home-light');
  
  // Check for text visibility
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log(`   Body text length: ${bodyText.length} chars`);

  // 2. TOGGLE DARK MODE
  console.log('\n2. Toggling dark mode...');
  // Try to find the theme toggle by aria-label first
  let toggled = false;
  const toggleBtn = await page.$('button[aria-label*="الوضع"]');
  
  if (toggleBtn) {
    await toggleBtn.click();
    await wait(1500);
    toggled = true;
    console.log('   Dark mode toggled via aria-label');
  } else {
    // Fallback: click the theme button in header (first button in the right section)
    const headerButtons = await page.$$('header button');
    for (const btn of headerButtons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.includes('الوضع')) {
        await btn.click();
        await wait(1500);
        toggled = true;
        console.log('   Dark mode toggled via header button');
        break;
      }
    }
  }

  // 3. MAIN PAGE - Dark mode
  console.log('\n3. Main page (dark mode)...');
  await takeScreenshot(page, '02-home-dark');
  
  const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`   Dark class applied: ${hasDark}`);

  // Check rendered colors
  const colorInfo = await page.evaluate(() => {
    const body = document.body;
    const bg = getComputedStyle(body).backgroundColor;
    const color = getComputedStyle(body).color;
    return { bodyBg: bg, bodyText: color };
  });
  console.log(`   Body bg color: ${colorInfo.bodyBg}`);
  console.log(`   Body text color: ${colorInfo.bodyText}`);

  // Check a few elements for contrast issues
  const contrastIssues = await page.evaluate(() => {
    const issues = [];
    const sampleElements = document.querySelectorAll('.home-action-card, h1, h2, h3, p, span, button, .gradient-bg');
    let count = 0;
    for (const el of sampleElements) {
      if (count > 10) break;
      const style = getComputedStyle(el);
      const color = style.color;
      const bg = style.backgroundColor;
      if (color && bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        issues.push({
          tag: el.tagName,
          class: el.className.substring(0, 40),
          text: (el.textContent || '').substring(0, 20),
          color,
          bg
        });
        count++;
      }
    }
    return issues;
  });
  console.log(`   Sampled ${contrastIssues.length} elements for color check`);

  // 4. TASBIH / DHIKR PAGE
  console.log('\n4. Tasbih/Dhikr page...');
  await page.goto(`${BASE_URL}/?view=tasbih`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await takeScreenshot(page, '03-tasbih-dark');
  
  // Check tasbih page element visibility
  const tasbihInfo = await page.evaluate(() => {
    const selects = document.querySelectorAll('select');
    const circles = document.querySelectorAll('[class*="rounded-full"]');
    const texts = document.querySelectorAll('h3, .text-\\[\\#f7eddd\\]');
    return {
      selectCount: selects.length,
      circleCount: circles.length,
      textSample: Array.from(texts).slice(0, 3).map(t => ({
        text: (t.textContent || '').substring(0, 30),
        color: getComputedStyle(t).color
      }))
    };
  });
  console.log(`   Select elements: ${tasbihInfo.selectCount}`);
  console.log(`   Text colors: ${JSON.stringify(tasbihInfo.textSample)}`);

  // 5. PRAYER TIMES PAGE
  console.log('\n5. Prayer times page...');
  await page.goto(`${BASE_URL}/?view=prayer-times`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await takeScreenshot(page, '04-prayer-dark');

  // 6. MEDIA PAGE
  console.log('\n6. Media page...');
  await page.goto(`${BASE_URL}/?view=media`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await takeScreenshot(page, '05-media-dark');

  // 7. ABOUT PAGE
  console.log('\n7. About page...');
  await page.goto(`${BASE_URL}/?view=about`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await takeScreenshot(page, '06-about-dark');

  // 8. DASHBOARD PAGE
  console.log('\n8. Dashboard page...');
  await page.goto(`${BASE_URL}/?view=dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await takeScreenshot(page, '07-dashboard-dark');

  // 9. ADHKAR PAGE
  console.log('\n9. Adhkar page...');
  await page.goto(`${BASE_URL}/?view=adhkar-list`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await takeScreenshot(page, '08-adhkar-dark');

  // Summary
  console.log('\n=== Results ===');
  console.log(`Console errors: ${errors.length > 0 ? errors.slice(0, 5).join(' | ') : 'None'}`);
  console.log(`Dark mode toggle works: ${toggled ? 'Yes' : 'No'}`);
  console.log(`Dark class applied on page: ${hasDark ? 'Yes' : 'No'}`);
  console.log(`Body background (dark): ${colorInfo.bodyBg}`);
  console.log(`Body text color (dark): ${colorInfo.bodyText}`);
  console.log('\nScreenshots saved to /tmp/tmanina-*.png');

  await browser.close();
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
