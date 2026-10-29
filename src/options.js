(() => {
  'use strict';
  const app = globalThis.CCUdemy;
  const $ = selector => document.querySelector(selector);
  let settings = app.normalizeSettings({}), words = [], filtered = [], lastDeleted;
  let activeCards = [], currentCardIndex = 0, isCardFlipped = false, gameStreak = 1, gameXP = 0;
  let gameAudioCtx = null, gameSoundEnabled = true, gameListenersBound = false;
  let confettiParticles = [];
  let pending = 0, saveRevision = 0, availabilityRevision = 0, lastPair = '';
  let settingsEvents = 0, vocabularyEvents = 0;
  const controls = [];
  const setStatus = (text, error = false) => {
    $('#save-status').textContent = text; $('#save-status').classList.toggle('error', error);
    $('.save-state').dataset.state = error ? 'error' : text === 'Đã lưu' ? 'saved' : 'idle';
  };
  const demo = app.createPreview();
  function preview(value) {
    const s = app.normalizeSettings(value), box = $('.preview-captions'), source = $('.preview-source'), target = $('.preview-target');
    source.style.fontSize = `${s.sourceFontSize}px`; target.style.fontSize = `${s.targetFontSize}px`;
    source.style.color = s.sourceColor; target.style.color = s.targetColor;
    source.style.order = s.reverseOrder ? '2' : '0'; target.style.order = s.reverseOrder ? '0' : '2';
    source.hidden = s.displayMode === 'translation'; target.hidden = s.displayMode === 'source';
    box.style.fontFamily = app.FONT_FAMILIES[s.fontFamily]; box.style.fontWeight = s.fontWeight;
    box.style.lineHeight = s.lineHeight; box.style.gap = `${s.lineGap}px`; box.style.textAlign = s.textAlign;
    box.style.width = `${s.captionWidth}%`; box.style.left = `${(100 - s.captionWidth) / 2}%`;
    demo.setOffset(s.bottomOffset);
    box.style.backgroundColor = s.backgroundColor + Math.round(s.backgroundOpacity * 255).toString(16).padStart(2, '0');
    box.style.opacity = s.enabled ? '1' : '.4';
    demo.reflow();
  }
  async function availability() {
    const pair = `${settings.sourceLanguage}|${settings.targetLanguage}`;
    if (pair === lastPair) return;
    lastPair = pair;
    const revision = ++availabilityRevision;
    const status = $('.pair-status');
    if (settings.sourceLanguage === settings.targetLanguage) { status.textContent = 'Nguồn và đích giống nhau; không cần bộ dịch.'; return; }
    if (!globalThis.Translator?.availability) { status.textContent = 'Kiểm tra và bật bộ dịch trên video trong Chrome 138+.'; return; }
    status.textContent = 'Đang kiểm tra cặp ngôn ngữ trên máy…';
    try {
      const state = await Translator.availability({ sourceLanguage: settings.sourceLanguage, targetLanguage: settings.targetLanguage });
      if (revision !== availabilityRevision) return;
      status.textContent = state === 'unavailable' ? 'Cặp ngôn ngữ này chưa dùng được trên máy. Chọn cặp khác để tiếp tục.'
        : state === 'available' ? 'Cặp ngôn ngữ này có thể dùng. Bật bộ dịch trên video để bắt đầu.'
          : 'Cặp ngôn ngữ có thể cần tải bộ ngôn ngữ. Bấm bật dịch trên video để tải.';
    } catch { if (revision === availabilityRevision) status.textContent = 'Chưa kiểm tra được. Hãy thử bật bộ dịch trên video.'; }
  }
  function renderSettings(value) {
    settings = app.normalizeSettings(value); controls.forEach(control => control.update(settings)); preview(settings); void availability();
  }
  async function mutate(type, payload = {}) {
    const revision = ++saveRevision;
    const eventsBefore = settingsEvents;
    pending++; setStatus('Đang lưu…');
    try {
      const result = await app.call(type, payload);
      if (revision === saveRevision && settingsEvents === eventsBefore) renderSettings(result);
      if (revision === saveRevision) setStatus('Đã lưu');
    } catch (error) { if (revision === saveRevision) { setStatus(error.message, true); renderSettings(settings); } }
    finally { pending--; }
  }
  const change = patch => mutate('settings.patch', { patch });
  controls.push(app.createControls($('#enable-control'), ['enabled'], { change }));
  controls.push(app.createControls($('#language-controls'), ['sourceLanguage', 'targetLanguage', 'displayMode'], { change }));
  const groupTabs = [], groupPanels = [], tabNames = ['Kiểu chữ', 'Bố cục', 'Tra từ'];
  function activateGroup(index, focus = false) {
    groupTabs.forEach((tab, current) => { tab.setAttribute('aria-selected', String(current === index)); tab.tabIndex = current === index ? 0 : -1; });
    groupPanels.forEach((panel, current) => { panel.hidden = current !== index; });
    if (focus) groupTabs[index].focus();
  }
  for (const [index, group] of app.SETTINGS_GROUPS.slice(1).entries()) {
    const section = document.createElement('section'); section.className = 'settings-section';
    section.id = `settings-panel-${index}`; section.setAttribute('role', 'tabpanel'); section.setAttribute('aria-labelledby', `settings-tab-${index}`);
    const tab = document.createElement('button'); tab.type = 'button'; tab.id = `settings-tab-${index}`;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', section.id); tab.textContent = tabNames[index];
    tab.addEventListener('click', () => activateGroup(index));
    tab.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1;
      if (target < 0) return;
      event.preventDefault(); activateGroup(target, true);
    });
    groupTabs.push(tab); groupPanels.push(section); $('#setting-tabs').append(tab);
    const title = document.createElement('h2'); title.textContent = group.title;
    const description = document.createElement('p'); description.className = 'section-description'; description.textContent = group.description;
    section.append(title, description); $('#settings-groups').append(section);
    const keys = index === 1 ? [...group.keys, 'reverseOrder'] : group.keys;
    controls.push(app.createControls(section, keys, {
      change: patch => mutate('settings.patch', { patch }), preview: patch => preview({ ...settings, ...patch }),
    }));
  }
  activateGroup(0);
  $('#reset').addEventListener('click', () => mutate('settings.reset'));
  const views = {
    settings: ['Phụ đề', 'Chọn ngôn ngữ và chỉnh cách hiển thị.'],
    vocabulary: ['Từ vựng', 'Từ đã lưu cùng ngữ cảnh trong bài học.'],
    game: ['Đấu trường Thẻ bài 3D', 'Luyện tập từ vựng bằng phương pháp Lặp lại ngắt quãng (Spaced Repetition SM-2).'],
    help: ['Hướng dẫn', 'Các thao tác chính và cách khắc phục sự cố.']
  };
  function showView() {
    const view = Object.hasOwn(views, location.hash.slice(1)) ? location.hash.slice(1) : 'settings';
    document.body.dataset.view = view;
    if (view !== 'settings') demo.stop();
    for (const key of Object.keys(views)) $(`#${key}-view`).hidden = key !== view;
    for (const button of document.querySelectorAll('nav button')) {
      if (button.dataset.view === view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    }
    $('#page-title').textContent = views[view][0]; $('#page-description').textContent = views[view][1];
    document.title = `LectureSub for Udemy — ${views[view][0]}`;
    if (view === 'game') setupGameDeck();
  }
  document.querySelectorAll('nav button').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.view; }));
  window.addEventListener('hashchange', showView); showView();
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    const target = document.body.dataset.view === 'settings' ? $('#enable-control input') : $('#page-title');
    target.focus(); target.scrollIntoView({ block: 'nearest' });
  });
  const folded = text => String(text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  function renderWords() {
    demo.setVocabulary(words);
    const query = folded($('#word-search').value);
    filtered = words.filter(item => folded(`${item.word} ${item.meaning} ${item.sentence}`).includes(query));
    $('#word-count').textContent = query ? `${filtered.length} / ${words.length} từ` : `${words.length} / 2.000 từ đã lưu`;
    $('#export').textContent = `Xuất CSV (${filtered.length})`; $('#export').disabled = !filtered.length;
    $('#empty').hidden = filtered.length > 0;
    $('#empty h2').textContent = words.length ? 'Không tìm thấy từ phù hợp.' : 'Chưa có từ nào được lưu.';
    $('#empty p').textContent = words.length ? 'Thử tìm bằng một phần của từ, nghĩa hoặc câu gốc.' : 'Bấm một từ trên phụ đề gốc, xem nghĩa rồi chọn Lưu từ.';
    $('#words').replaceChildren(...filtered.slice().reverse().map(item => {
      const entry = document.createElement('li'); entry.className = 'word-entry';
      const top = document.createElement('div'); top.className = 'word-top';
      const copy = document.createElement('div'), heading = document.createElement('h2'), meaning = document.createElement('p');
      heading.textContent = item.word; heading.dir = 'auto'; meaning.textContent = item.meaning; meaning.dir = 'auto'; meaning.className = 'word-meaning'; copy.append(heading, meaning);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-word'; remove.textContent = 'Xóa'; remove.setAttribute('aria-label', `Xóa từ ${item.word}`);
      remove.addEventListener('click', async () => {
        remove.disabled = true; $('#word-error').textContent = '';
        try {
          const result = await app.call('vocabulary.delete', { id: item.id });
          lastDeleted = item; words = app.readVocabulary(result); renderWords(); $('#undo-area').hidden = false; $('#undo').focus();
        } catch (error) { $('#word-error').textContent = error.message; remove.disabled = false; }
      });
      top.append(copy, remove); entry.append(top);
      if (item.sentence) { const context = document.createElement('p'); context.className = 'word-context'; context.textContent = item.sentence; context.dir = 'auto'; entry.append(context); }
      const meta = document.createElement('div'); meta.className = 'word-meta';
      const language = document.createElement('span'); language.textContent = `${app.languageName(item.sourceLanguage)} → ${app.languageName(item.targetLanguage)}`; meta.append(language);
      if (item.url) {
        const link = document.createElement('a'); link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Mở bài học'; meta.append(link);
        const time = document.createElement('span'), seconds = Math.floor(item.time); time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; meta.append(time);
      }
      entry.append(meta); return entry;
    }));
  }
  $('#word-search').addEventListener('input', renderWords);
  $('#export').addEventListener('click', () => app.downloadFile('lecturesub-tu-vung.csv', app.vocabularyCsv(filtered), 'text/csv;charset=utf-8'));
  $('#undo').addEventListener('click', async () => {
    if (!lastDeleted) return;
    const item = lastDeleted; $('#undo').disabled = true;
    try { await app.call('vocabulary.add', { item }); lastDeleted = undefined; $('#undo-area').hidden = true; $('#word-error').textContent = ''; }
    catch (error) { $('#word-error').textContent = error.message; }
    finally { $('#undo').disabled = false; }
  });
  chrome?.storage?.onChanged?.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.ccUdemySettings) { settingsEvents++; renderSettings(changes.ccUdemySettings.newValue); if (!pending) setStatus('Đã lưu'); }
    if (changes.ccUdemyVocabulary) {
      vocabularyEvents++;
      words = app.readVocabulary(changes.ccUdemyVocabulary.newValue);
      renderWords();
      if (document.body.dataset.view === 'game') setupGameDeck(false);
    }
  });
  renderSettings(settings); renderWords();
  const initialSettingsEvents = settingsEvents, initialVocabularyEvents = vocabularyEvents, initialSaveRevision = saveRevision;
  Promise.all([app.call('settings.get'), app.call('vocabulary.list')]).then(([value, items]) => {
    if (initialSettingsEvents === settingsEvents && initialSaveRevision === saveRevision) renderSettings(value);
    if (initialVocabularyEvents === vocabularyEvents) { words = app.readVocabulary(items); renderWords(); }
    if (!pending && initialSaveRevision === saveRevision) setStatus('Tự lưu thay đổi');
  }).catch(error => setStatus(error.message, true));

  // ================= 3D Game Flashcards Deck =================
  function initAudio() {
    if (!gameAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
      try { gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    if (gameAudioCtx?.state === 'suspended') gameAudioCtx.resume();
  }

  function playTone(freq, type = 'sine', duration = 0.1, gainLevel = 0.1) {
    if (!gameSoundEnabled) return;
    try {
      initAudio();
      if (!gameAudioCtx) return;
      const osc = gameAudioCtx.createOscillator();
      const gain = gameAudioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, gameAudioCtx.currentTime);
      gain.gain.setValueAtTime(gainLevel, gameAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, gameAudioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(gameAudioCtx.destination);
      osc.start();
      osc.stop(gameAudioCtx.currentTime + duration);
    } catch {}
  }

  function playVictorySound() {
    if (!gameSoundEnabled) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'triangle', 0.28, 0.12), idx * 75);
    });
  }

  function playAgainSound() {
    playTone(220, 'sawtooth', 0.22, 0.09);
  }

  function playFlipSound() {
    playTone(480, 'sine', 0.08, 0.05);
  }

  function playShuffleSound() {
    if (!gameSoundEnabled) return;
    try {
      initAudio();
      if (!gameAudioCtx) return;
      const osc = gameAudioCtx.createOscillator();
      const gain = gameAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, gameAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, gameAudioCtx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.08, gameAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, gameAudioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(gameAudioCtx.destination);
      osc.start();
      osc.stop(gameAudioCtx.currentTime + 0.22);
    } catch {}
  }

  function spawnRecycleToast(originX, originY) {
    const toast = document.createElement('div');
    toast.className = 'game-recycle-toast';
    toast.innerHTML = '<span>🔄 Đã xếp vào cuối cọc bài</span>';
    document.body.appendChild(toast);
    toast.style.left = `${originX}px`;
    toast.style.top = `${originY - 30}px`;

    const anim = toast.animate([
      { transform: 'translate(-50%, 0) scale(0.85)', opacity: 0 },
      { transform: 'translate(-50%, -24px) scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'translate(-50%, -46px) scale(0.96)', opacity: 0 }
    ], { duration: 900, easing: 'ease-out' });

    anim.onfinish = () => toast.remove();
  }

  function setupConfettiCanvas() {
    const canvas = $('#game-confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiParticles = confettiParticles.filter(p => p.alpha > 0.02);
      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.rotation += p.rotSpeed;
        p.alpha *= 0.96;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      requestAnimationFrame(loop);
    }
    loop();
  }

  function spawnConfetti(originX, originY) {
    const colors = ['#c6ed61', '#fae08a', '#9ee6ca', '#d4af37', '#ffffff'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 4 + Math.random() * 8;
      confettiParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1
      });
    }
  }

  function spawnCoinBurst(originX, originY) {
    const hudXP = $('.hud-xp');
    const hudRect = hudXP ? hudXP.getBoundingClientRect() : { left: window.innerWidth / 2, top: 40 };
    const targetX = hudRect.left + 50;
    const targetY = hudRect.top + 15;

    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'gold-coin-3d';
        coin.textContent = '🪙';
        document.body.appendChild(coin);

        const spreadX = (Math.random() - 0.5) * 120;
        const spreadY = (Math.random() - 0.5) * 60;
        const startX = originX + spreadX;
        const startY = originY + spreadY;

        coin.style.left = `${startX}px`;
        coin.style.top = `${startY}px`;

        const anim = coin.animate([
          { transform: 'translate(0, 0) scale(0.6) rotate(0deg)', opacity: 0 },
          { transform: 'translate(0, -30px) scale(1.25) rotate(180deg)', opacity: 1, offset: 0.25 },
          { transform: `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.7) rotate(720deg)`, opacity: 0.95 }
        ], {
          duration: 750,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        });

        anim.onfinish = () => {
          coin.remove();
          playTone(880 + i * 45, 'triangle', 0.08, 0.05);
        };
      }, i * 50);
    }
  }

  function setupGameDeck(forceReload = true) {
    if (forceReload || !activeCards.length) {
      const now = Date.now();
      const userDue = words.filter(w => !w.srsDueDate || w.srsDueDate <= now);
      if (userDue.length > 0) {
        activeCards = [...userDue];
      } else if (words.length > 0) {
        activeCards = [...words];
      } else {
        activeCards = [...(app.SAMPLE_TECH_CARDS || [])];
      }
      currentCardIndex = 0;
    }

    if (!gameListenersBound) {
      bindGameEvents();
      setupConfettiCanvas();
      gameListenersBound = true;
    }

    try {
      chrome.storage?.local?.get(['ccUdemyGameSRS'], result => {
        const data = result?.ccUdemyGameSRS || {};
        gameStreak = typeof data.streak === 'number' ? data.streak : 1;
        gameXP = typeof data.xp === 'number' ? data.xp : 25;
        updateGameHUD();
      });
    } catch {}

    renderCurrentGameCard();
  }

  function updateGameHUD() {
    const streakLabel = $('#game-streak-label');
    if (streakLabel) streakLabel.textContent = `${gameStreak} ngày`;
    const xpMod = gameXP % 100;
    const xpFill = $('#game-xp-fill');
    if (xpFill) xpFill.style.width = `${xpMod}%`;
    const xpLabel = $('#game-xp-label');
    if (xpLabel) xpLabel.textContent = `${xpMod} / 100 XP (Cấp ${Math.floor(gameXP / 100) + 1})`;
    const counter = $('#game-card-counter');
    if (counter) counter.textContent = `${Math.min(currentCardIndex + 1, activeCards.length)} / ${activeCards.length}`;
  }

  function renderCurrentGameCard() {
    const cardStage = $('#card-stage');
    const finishedView = $('#deck-finished-view');
    if (!cardStage || !finishedView) return;

    if (currentCardIndex >= activeCards.length) {
      cardStage.hidden = true;
      finishedView.hidden = false;
      const counter = $('#game-card-counter');
      if (counter) counter.textContent = `${activeCards.length} / ${activeCards.length}`;
      return;
    }

    cardStage.hidden = false;
    finishedView.hidden = true;

    const data = activeCards[currentCardIndex];
    const isSample = !words.some(w => w.word.toLowerCase() === data.word.toLowerCase());

    const rarity = $('#card-rarity');
    if (rarity) rarity.textContent = isSample ? 'CORE TECH' : 'UDEMY CARD';
    const frontWord = $('#front-word');
    if (frontWord) frontWord.textContent = data.word;
    const frontIpa = $('#front-ipa');
    if (frontIpa) frontIpa.textContent = data.sourceLanguage ? `${app.languageName(data.sourceLanguage).toUpperCase()} VOCABULARY` : 'TECHNICAL TERM';

    let sentence = data.sentence || '';
    const challengeText = $('#front-challenge-sentence');
    if (challengeText) {
      if (sentence) {
        const regex = new RegExp(`\\b${data.word.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
        const blanked = sentence.replace(regex, '<span class="blank-placeholder">[ ????? ]</span>');
        challengeText.innerHTML = blanked !== sentence ? blanked : `Trong ngữ cảnh: "${sentence}"`;
      } else {
        challengeText.innerHTML = `Hãy giải nghĩa và ghi nhớ thuật ngữ <span class="blank-placeholder">[ ????? ]</span> trong ngữ cảnh chuyên ngành.`;
      }
    }

    const backOrigin = $('#back-origin');
    if (backOrigin) backOrigin.textContent = data.title || (data.url ? 'Bài học Udemy' : 'Kiến thức cốt lõi');
    const backPair = $('#back-pair');
    if (backPair) backPair.textContent = `${app.languageName(data.sourceLanguage || 'en')} → ${app.languageName(data.targetLanguage || 'vi')}`;
    const backWord = $('#back-word-title');
    if (backWord) backWord.textContent = data.word;
    const backMeaning = $('#back-meaning');
    if (backMeaning) backMeaning.textContent = data.meaning;
    const backContext = $('#back-context-sentence');
    if (backContext) backContext.textContent = sentence ? `"${sentence}"` : `Được sử dụng phổ biến trong các tài liệu & khóa học công nghệ.`;

    isCardFlipped = false;
    const card = $('#active-card');
    if (card) {
      card.classList.remove('is-flipped');
      card.style.transform = 'perspective(1200px) rotateY(0deg)';
    }
    updateGameHUD();
  }

  function toggleCardFlip() {
    isCardFlipped = !isCardFlipped;
    const card = $('#active-card');
    if (card) {
      card.classList.toggle('is-flipped', isCardFlipped);
      card.style.transform = isCardFlipped ? 'perspective(1200px) rotateY(180deg)' : 'perspective(1200px) rotateY(0deg)';
      playFlipSound();
    }
  }

  async function handleCardDecision(rating) {
    if (currentCardIndex >= activeCards.length) return;
    const current = activeCards[currentCardIndex];
    const card = $('#active-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const updated = app.calculateSrs(current, rating);

    if (words.some(w => w.id === current.id)) {
      try { await app.call('vocabulary.add', { item: updated }); } catch {}
    }

    if (rating === 3) {
      playVictorySound();
      spawnCoinBurst(originX, originY);
      spawnConfetti(originX, originY);
      gameXP += 25;
      saveGameSRSState();
      card.animate([
        { transform: 'perspective(1200px) rotateY(180deg) translateX(0) scale(1)', opacity: 1 },
        { transform: 'perspective(1200px) rotateY(180deg) translateX(300px) rotateZ(12deg) scale(0.8)', opacity: 0 }
      ], { duration: 320, easing: 'ease-in' }).onfinish = () => {
        currentCardIndex++;
        renderCurrentGameCard();
      };
    } else if (rating === 2) {
      playTone(587.33, 'triangle', 0.18, 0.08);
      gameXP += 15;
      saveGameSRSState();
      card.animate([
        { transform: 'perspective(1200px) rotateY(180deg) translateX(0) scale(1)', opacity: 1 },
        { transform: 'perspective(1200px) rotateY(180deg) translateX(260px) scale(0.85)', opacity: 0 }
      ], { duration: 280, easing: 'ease-in' }).onfinish = () => {
        currentCardIndex++;
        renderCurrentGameCard();
      };
    } else {
      playShuffleSound();
      gameXP += 5;
      saveGameSRSState();
      activeCards.push(current);
      spawnRecycleToast(originX, originY);

      const baseRotate = isCardFlipped ? 180 : 0;
      card.animate([
        { transform: `perspective(1200px) rotateY(${baseRotate}deg) translateY(0) scale(1)`, opacity: 1 },
        { transform: `perspective(1200px) rotateY(${baseRotate}deg) translateY(190px) rotateZ(-7deg) scale(0.72)`, opacity: 0 }
      ], { duration: 280, easing: 'cubic-bezier(0.32, 0, 0.67, 0)' }).onfinish = () => {
        currentCardIndex++;
        renderCurrentGameCard();
        card.animate([
          { transform: 'perspective(1200px) rotateY(0deg) translateY(-50px) scale(0.92)', opacity: 0 },
          { transform: 'perspective(1200px) rotateY(0deg) translateY(0) scale(1)', opacity: 1 }
        ], { duration: 260, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' });
      };
    }
  }

  function saveGameSRSState() {
    try {
      chrome.storage?.local?.set({ ccUdemyGameSRS: { streak: gameStreak, xp: gameXP, lastDate: new Date().toDateString() } });
    } catch {}
    updateGameHUD();
  }

  function bindGameEvents() {
    const card = $('#active-card');
    const stage = $('#card-stage');
    const sheenFront = $('#sheen-front');
    const sheenBack = $('#sheen-back');

    if (stage && card) {
      stage.addEventListener('mousemove', e => {
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotY = (x / (rect.width / 2)) * 14;
        const rotX = -(y / (rect.height / 2)) * 14;

        const baseRotate = isCardFlipped ? 180 : 0;
        card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${baseRotate + (isCardFlipped ? -rotY : rotY)}deg)`;

        const pctX = ((e.clientX - rect.left) / rect.width) * 100;
        const pctY = ((e.clientY - rect.top) / rect.height) * 100;
        const sheenBg = `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(255,255,255,0.7) 0%, rgba(254,240,138,0.3) 30%, rgba(134,239,172,0.15) 55%, transparent 80%)`;
        if (sheenFront) sheenFront.style.background = sheenBg;
        if (sheenBack) sheenBack.style.background = sheenBg;
      });

      stage.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1200px) rotateY(${isCardFlipped ? 180 : 0}deg)`;
      });

      card.addEventListener('click', e => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        toggleCardFlip();
      });
    }

    const audioBtn = $('#btn-audio-pronounce');
    if (audioBtn) {
      audioBtn.addEventListener('click', e => {
        e.stopPropagation();
        const current = activeCards[currentCardIndex];
        if (!current?.word) return;
        try {
          const u = new SpeechSynthesisUtterance(current.word);
          u.lang = current.sourceLanguage || 'en-US';
          speechSynthesis.speak(u);
        } catch {}
      });
    }

    $('#btn-srs-again')?.addEventListener('click', e => { e.stopPropagation(); handleCardDecision(1); });
    $('#btn-srs-good')?.addEventListener('click', e => { e.stopPropagation(); handleCardDecision(2); });
    $('#btn-srs-easy')?.addEventListener('click', e => { e.stopPropagation(); handleCardDecision(3); });

    $('#game-sound-btn')?.addEventListener('click', () => {
      gameSoundEnabled = !gameSoundEnabled;
      $('#game-sound-btn').textContent = gameSoundEnabled ? '🔊' : '🔇';
    });

    $('#btn-restart-deck')?.addEventListener('click', () => setupGameDeck(true));
    $('#btn-practice-samples')?.addEventListener('click', () => {
      activeCards = [...(app.SAMPLE_TECH_CARDS || [])];
      currentCardIndex = 0;
      renderCurrentGameCard();
    });

    window.addEventListener('keydown', e => {
      if (document.body.dataset.view !== 'game') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleCardFlip();
      } else if (e.key === '1') {
        handleCardDecision(1);
      } else if (e.key === '2') {
        handleCardDecision(2);
      } else if (e.key === '3') {
        handleCardDecision(3);
      }
    });
  }
})();
