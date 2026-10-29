// Tests launch a separate, disposable Chrome profile, never the user's browsing session.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const scripts = ['languages.js', 'settings.js', 'library.js', 'store.js', 'client.js', 'captions.js', 'translator.js', 'playback.js', 'udemy-adapter.js', 'overlay.js', 'content.js'];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.route('https://www.udemy.com/**', route => route.fulfill({
      contentType: 'text/html', body: fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf8'),
    }));
    await page.goto('https://www.udemy.com/course/fixture/learn/lecture/1');
    await page.evaluate(() => {
      // External browser translation boundary: deterministic success, delay and errors.
      // These phrases are fixtures, not claims about the real language-pack model.
      window.Translator = {
        availability: async () => 'available',
        create: async options => ({ translate: async text => {
          await new Promise(r => setTimeout(r, text === 'Old sentence.' ? 300 : 15));
          if (options.targetLanguage === 'fr') return text === 'model' ? 'modèle' : 'Un modèle apprend à partir des données.';
          return ({ 'A model learns patterns from data.': 'Một mô hình học các mẫu từ dữ liệu.',
            'model': 'mô hình', 'Old sentence.': 'Câu cũ.', 'New sentence.': 'Câu mới.',
            'The model uses all of the training data to learn patterns and make predictions about examples it has not seen before.': 'Đây là câu phụ đề tiếng Việt có độ dài bình thường để giải thích cách một mô hình học từ dữ liệu.' })[text] || `Nghĩa: ${text}`;
        } }),
      };
      const listeners = [];
      window.__storage = {};
      window.chrome = { runtime: { getURL: () => '/overlay.css', sendMessage: async message => {
        if (message.type === 'options.open') return { ok: true };
        window.__store ||= CCUdemy.createStore(chrome.storage.local);
        try { return { ok: true, data: await window.__store.handle(message) }; }
        catch (error) { return { ok: false, error: error.message }; }
      } }, storage: { local: { get: async () => structuredClone(window.__storage), set: async value => {
        const changes = {};
        for (const [key, newValue] of Object.entries(value)) changes[key] = { oldValue: window.__storage[key], newValue };
        Object.assign(window.__storage, structuredClone(value));
        queueMicrotask(() => listeners.forEach(fn => fn(changes, 'local')));
      } }, onChanged: { addListener(fn) { listeners.push(fn); } } } };
    });
    await page.route('https://www.udemy.com/overlay.css', r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(root, 'src/overlay.css'), 'utf8') }));
    for (const script of scripts) await page.addScriptTag({ path: path.join(root, 'src', script) });
    const overlay = page.locator('#cc-udemy-overlay');
    await overlay.waitFor();
    await page.getByRole('button', { name: 'Bật dịch miễn phí', exact: true }).click();
    await page.getByText('Một mô hình học các mẫu từ dữ liệu.', { exact: true }).waitFor();
    await page.locator('video').evaluate(async video => {
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
      canvas.getContext('2d').fillRect(0, 0, 640, 360);
      video.srcObject = canvas.captureStream(1); video.muted = true; await video.play();
    });
    assert.equal(await page.locator('video').evaluate(v => v.paused), false);
    await page.getByRole('button', { name: 'Tra nghĩa: model', exact: true }).click();
    await page.getByText('mô hình', { exact: true }).waitFor();

    // Verify double-clicking inside lookup dialog does NOT bubble dblclick to Udemy video player
    await page.evaluate(() => {
      window.__udemyDblClicked = false;
      document.querySelector('[data-purpose="video-player"]').addEventListener('dblclick', () => {
        window.__udemyDblClicked = true;
      });
    });
    const lookupWord = overlay.locator('.lookup-word');
    await lookupWord.dblclick();
    const bubbled = await page.evaluate(() => window.__udemyDblClicked);
    assert.equal(bubbled, false, 'double clicking inside lookup dialog must not bubble to Udemy video player');

    // Verify copy button in lookup popup
    const copyButton = overlay.locator('.copy-word');
    await copyButton.click();
    await page.waitForFunction(() => {
      const host = document.querySelector('#cc-udemy-overlay');
      return host.shadowRoot.querySelector('.copy-word').classList.contains('copied');
    });

    // Verify speaker pronounce button
    const speakBtn = overlay.locator('.speak-word');
    assert.equal(await speakBtn.count(), 1, 'lookup popup must contain pronunciation speak button');
    await speakBtn.click();

    await page.getByRole('button', { name: 'Lưu từ', exact: true }).click();
    await page.getByRole('button', { name: 'Đã lưu từ', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__storage.ccUdemyVocabulary[0].sentence), 'A model learns patterns from data.');
    assert.equal(await page.locator('video').evaluate(v => v.paused), true);

    // Verify replay video button plays the cue
    const replayBtn = overlay.locator('.replay-cue');
    assert.equal(await replayBtn.count(), 1, 'lookup popup must contain replay video button');
    await replayBtn.click();
    assert.equal(await page.locator('video').evaluate(v => !v.paused), true, 'replay button must play video');
    await page.locator('video').evaluate(v => v.pause());
    await page.getByRole('button', { name: 'Đóng tra từ', exact: true }).press('Escape');
    assert.equal(await page.locator('video').evaluate(v => v.paused), false, 'dismiss resumes actual playable video');
    assert.equal(await page.getByRole('button', { name: 'Tra nghĩa: model', exact: true }).evaluate(e => e.matches(':focus')), true);
    await page.getByRole('button', { name: 'Tra nghĩa: model', exact: true }).press('Alt+Shift+C');
    await page.getByRole('button', { name: 'Bật phụ đề song ngữ', exact: true }).waitFor({ timeout: 3000 });
    await page.getByRole('button', { name: 'Bật phụ đề song ngữ', exact: true }).press('Alt+Shift+C');
    await page.getByRole('button', { name: 'Tra nghĩa: model', exact: true }).waitFor();
    await page.evaluate(() => CCUdemy.call('settings.patch', { patch: { pauseOnLookup: false } }));
    await page.getByRole('button', { name: 'Tra nghĩa: model', exact: true }).click();
    assert.equal(await page.locator('video').evaluate(v => v.paused), false);
    await page.getByRole('button', { name: 'Đóng tra từ', exact: true }).click();
    await page.evaluate(() => CCUdemy.call('settings.patch', { patch: { pauseOnLookup: true, resumeOnClose: false } }));
    await page.getByRole('button', { name: 'Tra nghĩa: model', exact: true }).click();
    assert.equal(await page.locator('video').evaluate(v => v.paused), true);
    await page.getByRole('button', { name: 'Đóng tra từ', exact: true }).click();
    assert.equal(await page.locator('video').evaluate(v => v.paused), true);
    await page.evaluate(() => CCUdemy.call('settings.patch', { patch: { resumeOnClose: true } }));

    await page.getByLabel('Chế độ phụ đề').selectOption('source');
    await page.waitForFunction(() => document.querySelector('#cc-udemy-overlay').shadowRoot.querySelector('.vietnamese').hidden);
    await page.getByLabel('Chế độ phụ đề').selectOption('translation');
    await page.waitForFunction(() => document.querySelector('#cc-udemy-overlay').shadowRoot.querySelector('.english').hidden);
    await page.getByLabel('Chế độ phụ đề').selectOption('bilingual');
    await page.evaluate(() => CCUdemy.call('settings.patch', { patch: { targetLanguage: 'fr' } }));
    await page.getByText('EN → FR', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Bật dịch miễn phí', exact: true }).click();
    await page.getByText('Un modèle apprend à partir des données.', { exact: true }).waitFor();
    assert.equal(await page.getByText('Một mô hình học các mẫu từ dữ liệu.', { exact: true }).count(), 0);
    await page.evaluate(() => CCUdemy.call('settings.patch', { patch: { targetLanguage: 'vi' } }));
    await page.getByRole('button', { name: 'Bật dịch miễn phí', exact: true }).click();

    // A late translation must not overwrite a newer cue.
    await page.locator('[data-test-cue]').evaluate(e => { e.textContent = 'Old sentence.'; });
    await page.getByRole('button', { name: 'Tra nghĩa: Old', exact: true }).waitFor();
    await page.locator('[data-test-cue]').evaluate(e => { e.textContent = 'New sentence.'; });
    await page.getByText('Câu mới.', { exact: true }).waitFor();
    await page.waitForTimeout(350);
    assert.equal(await page.getByText('Câu cũ.', { exact: true }).count(), 0);

    await page.getByRole('button', { name: 'Tắt phụ đề song ngữ', exact: true }).click();
    assert.equal(await page.locator('[data-test-cue]').evaluate(e => getComputedStyle(e).visibility), 'visible');
    assert.equal(await page.getByRole('button', { name: 'Tra nghĩa: New', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Bật phụ đề song ngữ', exact: true }).click();

    // Replacing video/lesson cleans old state and attaches once to the new player.
    await page.evaluate(() => {
      const player = document.querySelector('[data-purpose="video-player"]');
      const illustration = player.querySelector('.lesson').outerHTML;
      player.innerHTML = '<video id="lesson-two"></video>' + illustration + '<div class="captions-display-module--captions-container--fixture"><div class="captions-display-module--captions-cue-text--fixture" data-test-cue>A model learns patterns from data.</div></div>';
      history.pushState({}, '', '/course/fixture/learn/lecture/2');
    });
    await page.getByText('Một mô hình học các mẫu từ dữ liệu.', { exact: true }).waitFor();
    assert.equal(await overlay.count(), 1);
    await page.getByRole('button', { name: 'Tra nghĩa: model', exact: true }).click();
    await page.getByText('mô hình', { exact: true }).waitFor();
    fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
    await page.screenshot({ animations: 'disabled', path: path.join(root, 'test-results/desktop.png') });
    await page.setViewportSize({ width: 460, height: 700 });
    await page.waitForFunction(() => {
      const host = document.querySelector('#cc-udemy-overlay');
      const player = host.getBoundingClientRect();
      const popup = host.shadowRoot.querySelector('.lookup').getBoundingClientRect();
      return popup.top >= player.top && popup.bottom <= player.bottom;
    }, null, { timeout: 3000 });
    const contained = await overlay.evaluate(host => {
      const player = host.getBoundingClientRect();
      const popup = host.shadowRoot.querySelector('.lookup').getBoundingClientRect();
      return popup.top >= player.top && popup.bottom <= player.bottom && popup.left >= player.left && popup.right <= player.right;
    });
    assert.equal(contained, true, 'lookup must remain inside a short, narrow player');
    await page.screenshot({ animations: 'disabled', path: path.join(root, 'test-results/narrow.png') });
    assert.equal(await overlay.evaluate(e => e.scrollWidth <= e.clientWidth), true);

    await page.getByRole('button', { name: 'Đóng tra từ', exact: true }).click();
    await page.locator('[data-test-cue]').evaluate(e => { e.textContent = 'The model uses all of the training data to learn patterns and make predictions about examples it has not seen before.'; });
    await page.getByText('Đây là câu phụ đề tiếng Việt có độ dài bình thường để giải thích cách một mô hình học từ dữ liệu.', { exact: true }).waitFor();
    assert.equal(await overlay.evaluate(host => {
      const bounds = host.getBoundingClientRect();
      return ['.english', '.vietnamese'].every(selector => {
        const row = host.shadowRoot.querySelector(selector).getBoundingClientRect();
        return row.height > 0 && row.top >= bounds.top && row.bottom <= bounds.bottom - 40;
      });
    }), true, 'both language rows must remain visible inside a short player for longer cues');
    assert.equal(await overlay.evaluate(host => ['.english', '.vietnamese'].every(selector => {
      const row = host.shadowRoot.querySelector(selector);
      return row.scrollHeight <= row.clientHeight + 1;
    })), true, 'normal longer cues should fit both rows, not require scrolling');
    await page.screenshot({ animations: 'disabled', path: path.join(root, 'test-results/narrow-long.png') });

    // Native tracks can arrive after mounting; both languages must keep their timestamps.
    await page.locator('video').evaluate(video => {
      const en = video.addTextTrack('captions', 'English', 'en');
      en.addCue(new VTTCue(0, 2, 'Native caption.'));
      en.mode = 'showing';
      const vi = video.addTextTrack('captions', 'Tiếng Việt', 'vi');
      vi.addCue(new VTTCue(0, 2, 'Phụ đề có sẵn.'));
      vi.mode = 'disabled';
    });
    await page.getByText('Phụ đề có sẵn.', { exact: true }).waitFor();
    await page.locator('video').evaluate(video => {
      video.textTracks[0].mode = 'disabled';
      video.textTracks[1].mode = 'showing';
    });
    await page.waitForFunction(() => [...document.querySelector('video').textTracks].every(t => t.mode === 'hidden'));
    await page.getByRole('button', { name: 'Tắt phụ đề song ngữ', exact: true }).click();
    assert.deepEqual(await page.locator('video').evaluate(v => [...v.textTracks].map(t => t.mode)), ['disabled', 'showing'], 'restore the latest host selection as a consistent set');
    await page.getByRole('button', { name: 'Bật phụ đề song ngữ', exact: true }).click();
    await page.locator('video').evaluate(v => { v.currentTime = 3; });
    await page.getByText('Bật phụ đề tiếng Anh trong menu CC của Udemy.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Tra nghĩa: Native', exact: true }).count(), 0);

    await page.locator('[data-purpose="video-player"]').evaluate(e => e.requestFullscreen());
    assert.equal(await overlay.evaluate(e => Boolean(document.fullscreenElement?.contains(e))), true);
    await page.evaluate(() => document.exitFullscreen());
    assert.deepEqual(errors, []);
    console.log('PASS: DOM/native captions, translation, lookup, stale responses, toggle, lesson replacement, keyboard focus, fullscreen, desktop/narrow layout.');
  } finally { await browser.close(); }

  // Verify the exact distributed manifest loads and scripts run in an isolated world.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-udemy-test-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
  });
  try {
    const extensionPage = await context.newPage();
    await extensionPage.route('https://www.udemy.com/**', route => route.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf8') }));
    await extensionPage.goto('https://www.udemy.com/course/fixture/learn/lecture/1');
    await extensionPage.locator('#cc-udemy-overlay').waitFor();
    console.log('PASS: unpacked extension loaded its content scripts from manifest.');
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const extensionOrigin = worker.url().split('/').slice(0, 3).join('/');
    const options = await context.newPage();
    await options.goto(`${extensionOrigin}/src/options.html`);
    await options.getByRole('link', { name: 'Đến nội dung chính', exact: true }).focus();
    await options.getByRole('link', { name: 'Đến nội dung chính', exact: true }).press('Enter');
    assert.equal(await options.getByLabel('Bật phụ đề', { exact: true }).evaluate(e => e === document.activeElement), true, 'settings skip link focuses a visible main control');
    await options.getByRole('button', { name: 'Phát ví dụ', exact: true }).click();
    await options.waitForFunction(() => Number(document.querySelector('#preview-progress').value) > .2);
    await options.getByRole('button', { name: 'Tạm dừng ví dụ', exact: true }).click();
    await options.getByLabel('Tiến độ ví dụ', { exact: true }).press('End');
    await options.getByText('Mô hình cải thiện khi có thêm ví dụ.', { exact: true }).waitFor();
    await options.getByLabel('Tiến độ ví dụ', { exact: true }).press('Home');
    await options.getByRole('button', { name: 'Lưu từ mẫu', exact: true }).click();
    await options.getByRole('button', { name: 'Đã lưu từ mẫu', exact: true }).waitFor();
    const sampleId = await options.evaluate(async () => (await CCUdemy.call('vocabulary.list')).find(word => word.word === 'patterns').id);
    await options.evaluate(id => CCUdemy.call('vocabulary.delete', { id }), sampleId);
    await options.getByRole('button', { name: 'Lưu từ mẫu', exact: true }).waitFor({ timeout: 3000 });
    assert.equal(await options.getByRole('button', { name: 'Lưu từ mẫu', exact: true }).isEnabled(), true);
    await options.getByLabel('Ngôn ngữ dịch', { exact: true }).selectOption('fr');
    await options.getByText('Đã lưu', { exact: true }).waitFor();
    await extensionPage.getByText('EN → FR', { exact: true }).waitFor();
    await options.getByRole('tab', { name: 'Kiểu chữ', exact: true }).click();
    assert.equal(await options.getByRole('tab', { name: 'Kiểu chữ', exact: true }).getAttribute('aria-selected'), 'true');
    await options.getByRole('tab', { name: 'Kiểu chữ', exact: true }).press('ArrowRight');
    assert.equal(await options.getByRole('tab', { name: 'Bố cục', exact: true }).getAttribute('aria-selected'), 'true');
    await options.getByRole('tab', { name: 'Bố cục', exact: true }).press('ArrowLeft');
    await options.getByLabel('Cỡ chữ bản gốc', { exact: true }).fill('30');
    await options.getByLabel('Cỡ chữ bản gốc', { exact: true }).dispatchEvent('change');
    assert.equal(await options.locator('.preview-source').evaluate(e => getComputedStyle(e).fontSize), '30px');
    await options.getByRole('button', { name: 'Khôi phục mặc định', exact: true }).click();
    await extensionPage.getByText('EN → VI', { exact: true }).waitFor();
    const popup = await context.newPage();
    await popup.goto(`${extensionOrigin}/src/popup.html`);
    await popup.getByLabel('Ngôn ngữ dịch', { exact: true }).selectOption('ja');
    await extensionPage.getByText('EN → JA', { exact: true }).waitFor();
    await popup.getByRole('radio', { name: 'Bản gốc', exact: true }).click();
    await extensionPage.waitForFunction(() => document.querySelector('#cc-udemy-overlay').shadowRoot.querySelector('.vietnamese').hidden);
    await popup.getByRole('radio', { name: 'Bản gốc', exact: true }).press('ArrowLeft');
    await extensionPage.waitForFunction(() => !document.querySelector('#cc-udemy-overlay').shadowRoot.querySelector('.vietnamese').hidden);
    assert.equal(await options.getByLabel('Ngôn ngữ dịch', { exact: true }).inputValue(), 'ja');
    await popup.setViewportSize({ width: 360, height: 580 });
    await popup.screenshot({ animations: 'disabled', path: path.join(root, 'test-results/popup.png') });
    await popup.close();
    await options.getByRole('button', { name: 'Khôi phục mặc định', exact: true }).click();
    await extensionPage.getByText('EN → VI', { exact: true }).waitFor();
    await options.evaluate(async () => CCUdemy.call('vocabulary.add', { item: {
      word: 'model', meaning: 'mô hình', sourceLanguage: 'en', targetLanguage: 'vi', sentence: 'A model learns.',
      url: 'https://www.udemy.com/course/fixture/learn/lecture/1', time: 14,
    } }));
    await options.getByRole('button', { name: 'Từ vựng', exact: true }).click();
    await options.getByText('mô hình', { exact: true }).waitFor();
    await options.getByRole('link', { name: 'Đến nội dung chính', exact: true }).focus();
    await options.getByRole('link', { name: 'Đến nội dung chính', exact: true }).press('Enter');
    assert.equal(await options.locator('#vocabulary-view').isVisible(), true, 'skip link must preserve the active notebook view');
    assert.equal(await options.locator('#page-title').evaluate(e => e === document.activeElement), true);
    await options.getByLabel('Tìm từ vựng', { exact: true }).fill('nonexistent');
    await options.getByText('Không tìm thấy từ phù hợp.', { exact: true }).waitFor();
    await options.getByLabel('Tìm từ vựng', { exact: true }).fill('model');
    const csvDownload = options.waitForEvent('download');
    await options.getByRole('button', { name: /Xuất CSV/ }).click();
    const csvPath = await (await csvDownload).path();
    assert.match(fs.readFileSync(csvPath, 'utf8'), /mô hình/);
    await options.getByRole('button', { name: 'Xóa từ model', exact: true }).click();
    await options.getByText('Chưa có từ nào được lưu.', { exact: true }).waitFor();
    await options.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
    await options.getByText('mô hình', { exact: true }).waitFor();
    await options.getByRole('button', { name: 'Phụ đề', exact: true }).click();
    await options.getByRole('tab', { name: 'Kiểu chữ', exact: true }).click();
    await options.screenshot({ animations: 'disabled', path: path.join(root, 'test-results/settings-viewport.png') });
    await options.screenshot({ animations: 'disabled', path: path.join(root, 'test-results/settings.png'), fullPage: true });
    for (const width of [375, 768, 1024, 1440]) {
      await options.setViewportSize({ width, height: 900 });
      assert.equal(await options.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `settings must fit ${width}px`);
      await options.getByRole('tab', { name: 'Kiểu chữ', exact: true }).click();
      assert.equal(await options.getByLabel('Cỡ chữ bản gốc', { exact: true }).isVisible(), true);
      await options.getByRole('tab', { name: 'Bố cục', exact: true }).click();
      await options.getByLabel('Khoảng cách tới đáy', { exact: true }).fill('240');
      await options.getByLabel('Khoảng cách tới đáy', { exact: true }).dispatchEvent('change');
      assert.equal(await options.locator('.preview-frame').evaluate(frame => {
        const bounds = frame.getBoundingClientRect(), captions = frame.querySelector('.preview-captions').getBoundingClientRect();
        return captions.top >= bounds.top && captions.bottom <= bounds.bottom;
      }), true, 'preview captions stay contained at maximum offset');
      await options.getByRole('button', { name: 'Khôi phục mặc định', exact: true }).click();
      await options.getByRole('tab', { name: 'Kiểu chữ', exact: true }).click();
      if (width === 375 || width === 1440) await options.screenshot({ animations: 'disabled', path: path.join(root, `test-results/settings-${width}.png`), fullPage: true });
    }
    await options.emulateMedia({ reducedMotion: 'reduce' });
    await options.getByRole('tab', { name: 'Tra từ', exact: true }).click();
    await options.getByRole('tab', { name: 'Tra từ', exact: true }).press('Tab');
    assert.equal(await options.getByLabel('Tạm dừng khi tra từ', { exact: true }).evaluate(e => e.matches(':focus-visible')), true);
    await options.getByRole('tab', { name: 'Kiểu chữ', exact: true }).click();
    await options.setViewportSize({ width: 460, height: 800 });
    assert.equal(await options.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await options.screenshot({ animations: 'disabled', path: path.join(root, 'test-results/settings-narrow.png'), fullPage: true });
    await options.close();
    console.log('PASS: options persistence, cross-tab languages, preview/reset, notebook search/delete/undo and CSV export.');
    await extensionPage.getByRole('button', { name: 'Bật dịch miễn phí', exact: true }).click();
    await extensionPage.waitForFunction(() => !document.querySelector('#cc-udemy-overlay').shadowRoot.querySelector('.enable').disabled, null, { timeout: 12000 }).catch(() => {});
    const probe = await extensionPage.locator('#cc-udemy-overlay').evaluate(host => ({
      status: host.shadowRoot.querySelector('.status').textContent,
      translation: host.shadowRoot.querySelector('.vietnamese').textContent,
      state: host.shadowRoot.querySelector('.enable').dataset.ready,
      downloading: host.shadowRoot.querySelector('.enable').disabled,
    }));
    const cdp = await context.newCDPSession(extensionPage);
    const worlds = [];
    cdp.on('Runtime.executionContextCreated', event => worlds.push(event.context));
    await cdp.send('Runtime.enable');
    const extensionWorld = worlds.find(world => world.name.includes('chrome-extension://'));
    if (extensionWorld) {
      const result = await cdp.send('Runtime.evaluate', { contextId: extensionWorld.id, expression: 'JSON.stringify({translator:typeof Translator,content:typeof CCUdemy,secure:isSecureContext})', returnByValue: true });
      probe.world = result.result.value;
    }
    fs.writeFileSync(path.join(root, 'test-results/translator-probe.json'), JSON.stringify(probe, null, 2));
    console.log('Real Translator probe:', probe);
  } finally {
    await context.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
