(() => {
  'use strict';
  const app = globalThis.CCUdemy ||= {};
  const gear = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.6 3-2 .9-2.7-1-2 3.5 2.2 2v2.2l-2.2 2 2 3.5 2.7-1 2 .9.6 3h4l.6-3 2-.9 2.7 1 2-3.5-2.2-2v-2.2l2.2-2-2-3.5-2.7 1-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/></svg>';
  const speaker = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  app.createOverlay = (container, handlers) => {
    const host = document.createElement('div'); host.id = 'cc-udemy-overlay';
    host.style.cssText = 'position:absolute;inset:0;z-index:40;pointer-events:none;';
    const shadow = host.attachShadow({ mode: 'open' });
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = chrome.runtime.getURL('src/overlay.css'); shadow.append(css);
    const shell = document.createElement('div'); shell.className = 'shell';
    // Constant extension markup. All course text/definitions are inserted as text nodes.
    shell.innerHTML = `
      <div class="toolbar" role="group" aria-label="Cài đặt LectureSub">
        <span class="brand">EN → VI</span>
        <button class="enable primary" type="button">Bật dịch miễn phí</button>
        <select class="mode" aria-label="Chế độ phụ đề"><option value="bilingual">Song ngữ</option><option value="source">Chỉ bản gốc</option><option value="translation">Chỉ bản dịch</option></select>
        <button class="settings icon-button" type="button" aria-label="Mở cài đặt đầy đủ" title="Cài đặt">${gear}</button>
        <button class="toggle" type="button" aria-pressed="true" aria-label="Tắt phụ đề song ngữ">Tắt</button>
      </div>
      <div class="caption-area" role="group" aria-label="Phụ đề đa ngôn ngữ">
        <div class="captions" hidden><div class="english" dir="auto"></div><div class="vietnamese" dir="auto"></div></div>
        <div class="status-line"><span class="status" role="status"></span><button class="retry" type="button" hidden>Thử lại</button></div>
      </div>
      <div class="lookup" id="cc-word-lookup" role="dialog" aria-modal="false" aria-label="Tra nghĩa" hidden>
        <div class="lookup-top"><span class="lookup-label"></span><button type="button" class="close icon-button" aria-label="Đóng tra từ"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
        <div class="lookup-word-row">
          <h2 class="lookup-word" dir="auto"></h2>
          <button type="button" class="speak-word icon-button" aria-label="Phát âm từ vựng" title="Phát âm">${speaker}</button>
        </div>
        <p class="meaning" role="status" dir="auto"></p>
        <div class="lookup-actions">
          <button class="save-word" type="button" disabled>Lưu từ</button>
          <button class="notebook" type="button">Sổ từ vựng</button>
          <button class="copy-word" type="button">Sao chép</button>
          <button class="replay-cue" type="button" title="Nghe lại đoạn video này">↺ Nghe trong video</button>
          <button class="retry-word" type="button" hidden>Thử tra lại</button>
        </div>
        <span class="save-status" role="status"></span><span class="lookup-note">Nghĩa của từ đơn · Esc để đóng</span>
      </div>`;
    shadow.append(shell); container.append(host);
    const $ = selector => shadow.querySelector(selector);
    const source = $('.english'), target = $('.vietnamese'), popup = $('.lookup');
    let settings = app.normalizeSettings({}), origin, activeWord = '', lastSource = '', enabled = true;
    function positionLookup() {
      if (popup.hidden) return;
      const bounds = host.getBoundingClientRect();
      popup.style.maxHeight = `${Math.max(60, bounds.height - 70)}px`;
      const top = $('.caption-area').getBoundingClientRect().top - bounds.top;
      const anchor = origin?.isConnected ? origin.getBoundingClientRect() : undefined;
      const left = anchor ? anchor.left - bounds.left + anchor.width / 2 - popup.offsetWidth / 2 : bounds.width * .05;
      popup.style.left = `${Math.max(8, Math.min(left, bounds.width - popup.offsetWidth - 8))}px`;
      popup.style.top = `${Math.max(58, Math.min(top - popup.offsetHeight - 10, bounds.height - popup.offsetHeight - 8))}px`;
    }
    function fitCaptions() {
      const compact = host.clientWidth < 600;
      shell.classList.toggle('compact', compact);
      const bottom = Math.min(settings.bottomOffset, Math.max(32, host.clientHeight * (compact ? .23 : .32)));
      $('.caption-area').style.bottom = `${bottom}px`;
      $('.caption-area').style.maxHeight = `${Math.max(48, host.clientHeight - bottom - $('.toolbar').offsetHeight - 28)}px`;
      const overflow = () => [source, target].some(row => !row.hidden && row.scrollHeight > row.clientHeight + 1);
      function scale(value) {
        shell.style.setProperty('--source-size', `${Math.max(14, settings.sourceFontSize * value)}px`);
        shell.style.setProperty('--target-size', `${Math.max(12, settings.targetFontSize * value)}px`);
      }
      shell.style.setProperty('--caption-line-height', settings.lineHeight);
      scale(1);
      for (let ratio = .92; overflow() && ratio >= .25; ratio -= .07) scale(ratio);
      if (overflow()) shell.style.setProperty('--caption-line-height', '1.25');
      positionLookup();
    }
    const resize = new ResizeObserver(fitCaptions); resize.observe(host); css.addEventListener('load', fitCaptions);
    $('.enable').addEventListener('click', () => handlers.enable());
    $('.toggle').addEventListener('click', () => handlers.toggle(!enabled));
    $('.mode').addEventListener('change', event => handlers.patch({ displayMode: event.target.value }));
    $('.settings').addEventListener('click', () => handlers.settings());
    $('.notebook').addEventListener('click', () => handlers.notebook());
    $('.save-word').addEventListener('click', () => handlers.saveWord());
    $('.retry').addEventListener('click', () => handlers.retry());
    $('.retry-word').addEventListener('click', () => handlers.word(activeWord, true));
    $('.close').addEventListener('click', () => handlers.dismiss());
    $('.copy-word')?.addEventListener('click', async () => {
      const selection = shadow.getSelection ? shadow.getSelection()?.toString() : window.getSelection()?.toString();
      const word = $('.lookup-word').textContent.trim();
      const meaning = $('.meaning').textContent.trim();
      const textToCopy = selection && selection.trim().length > 0
        ? selection.trim()
        : (meaning ? `${word} - ${meaning}` : word);
      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch {
        const area = document.createElement('textarea');
        area.value = textToCopy;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      const copyBtn = $('.copy-word');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Đã sao chép! ✓';
      setTimeout(() => { if (copyBtn.isConnected) copyBtn.textContent = originalText; }, 1500);
    });
    function speakCurrentWord() {
      if (!activeWord) return;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(activeWord);
          utterance.lang = settings.sourceLanguage || 'en-US';
          utterance.rate = 0.92;
          const btn = $('.speak-word');
          if (btn) {
            btn.classList.add('is-speaking');
            utterance.onend = () => btn.classList.remove('is-speaking');
            utterance.onerror = () => btn.classList.remove('is-speaking');
          }
          window.speechSynthesis.speak(utterance);
        } catch {}
      }
    }
    $('.speak-word')?.addEventListener('click', e => {
      e.stopPropagation();
      speakCurrentWord();
    });
    $('.replay-cue')?.addEventListener('click', e => {
      e.stopPropagation();
      handlers.replay?.();
    });
    source.addEventListener('click', event => {
      const button = event.target.closest('button[data-word]');
      if (button) {
        source.querySelectorAll('[data-selected]').forEach(item => { item.removeAttribute('data-selected'); item.setAttribute('aria-expanded', 'false'); });
        button.dataset.selected = 'true'; button.setAttribute('aria-expanded', 'true');
        origin = button; activeWord = button.dataset.word; handlers.word(activeWord);
      }
    });
    for (const name of ['click', 'dblclick', 'pointerdown', 'mousedown']) {
      host.addEventListener(name, event => event.stopPropagation());
      popup.addEventListener(name, event => event.stopPropagation());
    }
    host.addEventListener('keydown', event => {
      if (event.code === 'KeyC' && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) return;
      event.stopPropagation();
      if (event.key === 'Escape' && !popup.hidden) { event.preventDefault(); handlers.dismiss(); }
    });
    return {
      host,
      settings(value) {
        settings = app.normalizeSettings(value);
        $('.brand').textContent = `${settings.sourceLanguage.toUpperCase()} → ${settings.targetLanguage.toUpperCase()}`;
        $('.brand').title = `${app.languageName(settings.sourceLanguage)} → ${app.languageName(settings.targetLanguage)}`;
        $('.lookup-label').textContent = $('.brand').title;
        $('.mode').value = settings.displayMode;
        source.lang = settings.sourceLanguage; target.lang = settings.targetLanguage;
        source.hidden = settings.displayMode === 'translation'; target.hidden = settings.displayMode === 'source';
        source.style.order = settings.reverseOrder ? '2' : '0'; target.style.order = settings.reverseOrder ? '0' : '2';
        shell.style.setProperty('--caption-font', app.FONT_FAMILIES[settings.fontFamily]);
        shell.style.setProperty('--caption-weight', settings.fontWeight);
        shell.style.setProperty('--source-color', settings.sourceColor); shell.style.setProperty('--target-color', settings.targetColor);
        shell.style.setProperty('--caption-bg', settings.backgroundColor + Math.round(settings.backgroundOpacity * 255).toString(16).padStart(2, '0'));
        shell.style.setProperty('--line-gap', `${settings.lineGap}px`);
        $('.caption-area').style.width = `${settings.captionWidth}%`;
        $('.caption-area').style.left = `${(100 - settings.captionWidth) / 2}%`;
        $('.captions').style.textAlign = settings.textAlign;
        fitCaptions();
      },
      enabled(value) {
        enabled = value; $('.toggle').textContent = value ? 'Tắt' : 'Bật';
        $('.toggle').setAttribute('aria-label', value ? 'Tắt phụ đề song ngữ' : 'Bật phụ đề song ngữ');
        $('.toggle').setAttribute('aria-pressed', String(value)); $('.caption-area').hidden = !value;
        $('.enable').hidden = !value || $('.enable').dataset.ready === 'true'; $('.mode').disabled = !value;
        if (!value) { source.replaceChildren(); lastSource = ''; }
      },
      english(text) {
        $('.captions').hidden = !text;
        const key = `${settings.sourceLanguage}:${text}`;
        if (key === lastSource) return;
        lastSource = key;
        source.replaceChildren(...app.tokenize(text, settings.sourceLanguage).map(token => {
          if (!token.word) return document.createTextNode(token.text);
          const button = document.createElement('button'); button.type = 'button'; button.dataset.word = token.text;
          button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'cc-word-lookup');
          button.textContent = token.text; button.setAttribute('aria-label', `Tra nghĩa: ${token.text}`); return button;
        })); fitCaptions();
      },
      vietnamese(text, pending = false) { target.textContent = text; target.classList.toggle('pending', pending); fitCaptions(); },
      status(text, retry = false) {
        if ($('.status').textContent !== text) $('.status').textContent = text;
        $('.status-line').hidden = !text && !retry; $('.retry').hidden = !retry; fitCaptions();
      },
      translatorState(state) {
        const button = $('.enable'); button.disabled = state === 'loading'; button.dataset.ready = String(state === 'ready');
        button.hidden = !enabled || state === 'ready'; button.textContent = state === 'loading' ? 'Đang tải bộ dịch…' : 'Bật dịch miễn phí';
        fitCaptions();
      },
      lookup(word, text, failed = false) {
        const first = popup.hidden; activeWord = word; popup.hidden = false;
        $('.lookup-word').textContent = word; $('.meaning').textContent = text; $('.retry-word').hidden = !failed;
        positionLookup(); if (first) $('.close').focus({ preventScroll: true });
      },
      saveState(state, message = '') {
        const button = $('.save-word'); button.disabled = !['ready', 'error'].includes(state);
        button.textContent = state === 'saved' ? 'Đã lưu từ' : state === 'saving' ? 'Đang lưu…' : 'Lưu từ';
        $('.save-status').textContent = message; positionLookup();
      },
      closeLookup() {
        popup.hidden = true;
        source.querySelectorAll('[data-selected]').forEach(item => { item.removeAttribute('data-selected'); item.setAttribute('aria-expanded', 'false'); });
        if (origin?.isConnected) origin.focus({ preventScroll: true }); origin = null;
      },
      destroy() { resize.disconnect(); host.remove(); },
    };
  };
})();
