const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../src');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const name of ['options', 'popup']) {
      const page = await browser.newPage();
      const html = fs.readFileSync(path.join(source, `${name}.html`), 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      await page.setContent(html);
      for (const file of ['languages', 'settings', 'library', 'controls', 'preview']) await page.addScriptTag({ path: path.join(source, `${file}.js`) });
      await page.evaluate(() => {
        window.__listeners = [];
        window.chrome = { storage: { onChanged: { addListener(fn) { window.__listeners.push(fn); } } } };
        CCUdemy.call = type => type === 'settings.get' ? new Promise(resolve => { window.__resolveInitial = resolve; }) : Promise.resolve([]);
      });
      await page.addScriptTag({ path: path.join(source, `${name}.js`) });
      await page.evaluate(() => window.__listeners.forEach(fn => fn({ ccUdemySettings: { newValue: CCUdemy.normalizeSettings({ targetLanguage: 'ja' }) } }, 'local')));
      assert.equal(await page.getByLabel('Ngôn ngữ dịch', { exact: true }).inputValue(), 'ja');
      await page.evaluate(async () => { window.__resolveInitial(CCUdemy.normalizeSettings({})); await new Promise(requestAnimationFrame); });
      assert.equal(await page.getByLabel('Ngôn ngữ dịch', { exact: true }).inputValue(), 'ja', `${name}: delayed initial response must not overwrite newer settings`);
      if (name === 'popup') assert.doesNotMatch(await page.locator('#status').textContent(), /Đang tải/);
      await page.close();
    }
    console.log('PASS: options and popup retain newer settings events over delayed initial replies.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
