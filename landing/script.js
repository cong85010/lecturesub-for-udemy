// LectureSub for Udemy — Interactive Landing Page Script (with EN/VI Multilingual Support)

document.addEventListener('DOMContentLoaded', () => {
  // ================= 1. I18N Translations Dictionary =================
  const translations = {
    vi: {
      nav_demo: 'Demo tương tác',
      nav_features: 'Tính năng',
      nav_guide: 'Hướng dẫn',
      nav_donate: 'Ủng hộ ☕',
      cta_header: 'Cài đặt miễn phí',
      hero_badge: 'Bản 0.3.0 · 100% Miễn phí · Mã nguồn mở MIT',
      hero_title: 'Biến mọi bài giảng Udemy thành <span class="highlight">lớp học ngoại ngữ</span> tương tác.',
      hero_lead: 'Phụ đề song ngữ thông minh, bấm từ tra nghĩa tức thì ngay trên video và sổ từ vựng cá nhân giúp bạn làm chủ mọi khóa học tiếng Anh chuyên ngành trên Udemy mà không bao giờ bị ngắt mạch học.',
      cta_hero: 'Thêm vào Chrome — Miễn phí',
      cta_github: 'Mã nguồn trên GitHub',
      demo_badge: 'Trải nghiệm tương tác trực tiếp',
      demo_hint: '💡 Bấm thử vào bất kỳ từ tiếng Anh nào dưới đây để xem tra nghĩa trực tiếp:',
      demo_target: 'Các thuật toán học máy nhận diện các khuôn mẫu trong dữ liệu phức tạp.',
      demo_save_btn: 'Lưu từ',
      demo_close_btn: 'Đóng (Esc)',
      features_title: 'Thiết kế riêng cho trải nghiệm học tập',
      features_sub: 'Không chỉ là phụ đề, LectureSub là trợ thủ đắc lực giúp bạn hấp thụ kiến thức bài giảng trọn vẹn nhất.',
      f1_title: 'Phụ đề song ngữ thông minh',
      f1_desc: 'Hiển thị đồng bộ phụ đề bản gốc và bản dịch tiếng Việt mượt mà. Hỗ trợ đảo vị trí trên/dưới hoặc chọn chế độ chỉ hiện bản dịch.',
      f2_title: 'Tra nghĩa từ theo ngữ cảnh',
      f2_desc: 'Bấm trực tiếp vào từ khó trong câu để xem nghĩa. Video tự động dừng khi tra từ và tự phát tiếp khi bạn sẵn sàng.',
      f3_title: 'Sổ từ vựng & Xuất CSV',
      f3_desc: 'Lưu lại thuật ngữ chuyên ngành kèm câu ví dụ gốc chỉ với 1 click. Tìm kiếm không dấu thông minh và xuất CSV chuẩn hóa cho Anki.',
      f4_title: 'Giao diện "Reading Room"',
      f4_desc: 'Thẩm mỹ tối giản, tone giấy sáng với điểm nhấn xanh chanh chartreuse giúp dịu mắt và duy trì độ tập trung tối đa suốt bài học.',
      f5_title: '100% Cục bộ & Bảo mật',
      f5_desc: 'Dữ liệu và từ vựng lưu trữ hoàn toàn trên trình duyệt của bạn (Local Storage). Không có tracker, không thu thập tài khoản hay cookie.',
      f6_title: 'Mã nguồn mở MIT',
      f6_desc: 'Dự án mở hoàn toàn cho cộng đồng, minh bạch từng dòng lệnh, cam kết phát triển phi lợi nhuận phục vụ người học.',
      guide_title: '3 bước bắt đầu trong 1 phút',
      guide_sub: 'Không cần đăng ký tài khoản, không cần cấu hình API key phức tạp.',
      step1_title: 'Cài đặt tiện ích',
      step1_desc: 'Thêm LectureSub từ Chrome Web Store hoặc nạp bản giải nén trong chrome://extensions (Bật Developer Mode → Load unpacked).',
      step2_title: 'Chọn phụ đề trên Udemy',
      step2_desc: 'Mở video bài giảng bất kỳ trên Udemy và bật phụ đề nguồn trong menu CC của trình phát (ví dụ: English).',
      step3_title: 'Bật dịch & Học tập',
      step3_desc: 'Bấm nút Bật dịch miễn phí trên thanh công cụ của video. Phụ đề song ngữ sẽ xuất hiện ngay lập tức!',
      footer_author: 'Phát triển với sự tận tâm bởi <strong>Cong Phan</strong> (<a href="https://congphan.dev" target="_blank" rel="noopener">congphan.dev</a>).',
      footer_disclaimer: 'LectureSub là dự án độc lập, không liên kết hay tài trợ bởi Udemy, Inc.',
      footer_privacy: 'Chính sách quyền riêng tư',
      footer_repo: 'Mã nguồn GitHub',
      footer_feedback: 'Báo lỗi & Góp ý'
    },
    en: {
      nav_demo: 'Interactive Demo',
      nav_features: 'Features',
      nav_guide: 'Guide',
      nav_donate: 'Donate ☕',
      cta_header: 'Install Free',
      hero_badge: 'v0.3.0 · 100% Free · No API Key · MIT Open Source',
      hero_title: 'Turn every Udemy lecture into an <span class="highlight">interactive language classroom</span>.',
      hero_lead: 'Smart bilingual captions, instant contextual word lookup, and a personal vocabulary notebook to master any technical course on Udemy without losing focus.',
      cta_hero: 'Add to Chrome — Free',
      cta_github: 'Source Code on GitHub',
      demo_badge: 'Live Interactive Sandbox',
      demo_hint: '💡 Click any highlighted English word below to test instant dictionary lookup:',
      demo_target: 'Machine learning algorithms identify patterns in complex data.',
      demo_save_btn: 'Save word',
      demo_close_btn: 'Close (Esc)',
      features_title: 'Crafted for Seamless Course Learning',
      features_sub: 'More than subtitles — LectureSub is your quiet study companion to understand and retain technical course knowledge.',
      f1_title: 'Smart Bilingual Subtitles',
      f1_desc: 'Simultaneous bilingual captions running smoothly with Udemy video. Toggle source-only, translation-only, or swap caption order.',
      f2_title: 'Contextual Word Lookup',
      f2_desc: 'Click any word to inspect its definition. The lecture pauses automatically and resumes playback right where you left off.',
      f3_title: 'Vocabulary Notebook & CSV',
      f3_desc: 'Save challenging technical terms with original sentence context in 1 click. Full diacritic-free search and Anki-ready CSV export.',
      f4_title: 'Reading Room Aesthetics',
      f4_desc: 'Minimalist warm-paper palette with electric chartreuse accents designed for late-night study sessions without eye strain.',
      f5_title: '100% Local & Privacy-First',
      f5_desc: 'Your preferences and saved words remain strictly in your browser (Local Storage). Zero trackers, zero analytics, zero account required.',
      f6_title: 'MIT Open Source',
      f6_desc: 'Fully transparent code, community-driven, and committed to remaining free and independent for learners worldwide.',
      guide_title: 'Get started in 1 minute',
      guide_sub: 'No account registration, no complicated API key setup required.',
      step1_title: 'Install Extension',
      step1_desc: 'Add LectureSub from Chrome Web Store or load the unpacked directory in chrome://extensions with Developer Mode enabled.',
      step2_title: 'Enable Udemy Captions',
      step2_desc: 'Open any Udemy course lecture and select your source subtitles in Udemy’s CC player menu (e.g. English).',
      step3_title: 'Turn on & Learn',
      step3_desc: 'Click "Enable Free Translation" on the video overlay. Your interactive bilingual captions will appear immediately!',
      footer_author: 'Crafted with care by <strong>Cong Phan</strong> (<a href="https://congphan.dev" target="_blank" rel="noopener">congphan.dev</a>).',
      footer_disclaimer: 'LectureSub is an independent project and is not affiliated with or endorsed by Udemy, Inc.',
      footer_privacy: 'Privacy Policy',
      footer_repo: 'GitHub Repository',
      footer_feedback: 'Feedback & Issues'
    }
  };

  // Word definitions in VI and EN
  const wordDictionary = {
    vi: {
      'algorithms': { meaning: 'các thuật toán: tập hợp các quy tắc hoặc bước logic dùng để giải quyết một bài toán cụ thể.', tag: 'Thuật ngữ cốt lõi' },
      'identify': { meaning: 'nhận diện, phát hiện hoặc xác định các đặc trưng/khuôn mẫu trong dữ liệu.', tag: 'Động từ chuyên ngành' },
      'patterns': { meaning: 'các khuôn mẫu, quy luật hoặc xu hướng lặp lại được phát hiện từ tập dữ liệu mẫu.', tag: 'Machine Learning' },
      'complex': { meaning: 'phức tạp: có nhiều chiều, phi tuyến tính hoặc dữ liệu kích thước lớn.', tag: 'Tính từ' },
      'learning': { meaning: 'học máy (machine learning): quá trình mô hình tự tối ưu hóa trọng số qua dữ liệu huấn luyện.', tag: 'Khái niệm nền tảng' }
    },
    en: {
      'algorithms': { meaning: 'algorithms: a step-by-step procedure or mathematical rules for solving a computational problem.', tag: 'Core Concept' },
      'identify': { meaning: 'identify: to recognize, establish, or detect specific features within sample data.', tag: 'Technical Verb' },
      'patterns': { meaning: 'patterns: recurring regularities, correlations, or mathematical structures discovered in datasets.', tag: 'Machine Learning' },
      'complex': { meaning: 'complex: having many interconnected features, non-linear dependencies, or high dimensionality.', tag: 'Adjective' },
      'learning': { meaning: 'learning: the process whereby a statistical model iteratively improves performance from data.', tag: 'Fundamental' }
    }
  };

  let currentLang = localStorage.getItem('lecturesub_lang') || 'vi';

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lecturesub_lang', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const dict = translations[lang] || translations.vi;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    // Update active word in demo
    const activeToken = document.querySelector('.word-token.selected') || document.querySelector('.word-token[data-word="algorithms"]');
    if (activeToken) selectWord(activeToken);
  }

  // Language Switcher Events
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.dataset.lang);
    });
  });

  // ================= 2. Interactive Demo Sandbox =================
  const wordTokens = document.querySelectorAll('.word-token');
  const lookupCard = document.getElementById('demo-lookup-card');
  const cardWord = document.getElementById('card-word');
  const cardTag = document.getElementById('card-tag');
  const cardMeaning = document.getElementById('card-meaning');
  const cardSaveBtn = document.getElementById('card-save-btn');
  const cardCloseBtn = document.getElementById('card-close-btn');

  function selectWord(token) {
    wordTokens.forEach(t => t.classList.remove('selected'));
    token.classList.add('selected');
    const wordKey = token.dataset.word;
    const wordsForLang = wordDictionary[currentLang] || wordDictionary.vi;
    const info = wordsForLang[wordKey] || {
      meaning: currentLang === 'en' ? 'Contextual definition from LectureSub dictionary.' : 'Tra nghĩa trực tiếp từ bộ từ điển ngữ cảnh.',
      tag: currentLang === 'en' ? 'Term' : 'Từ vựng'
    };

    cardWord.textContent = token.textContent.replace(/[.,]/g, '').trim();
    cardTag.textContent = info.tag;
    cardMeaning.textContent = info.meaning;
    cardSaveBtn.textContent = currentLang === 'en' ? 'Save word' : 'Lưu từ';
    cardSaveBtn.disabled = false;
    cardSaveBtn.classList.remove('saved');
    lookupCard.style.display = 'block';
  }

  wordTokens.forEach(token => {
    token.addEventListener('click', () => selectWord(token));
  });

  if (cardSaveBtn) {
    cardSaveBtn.addEventListener('click', () => {
      cardSaveBtn.textContent = currentLang === 'en' ? '✓ Saved to Notebook' : '✓ Đã lưu vào sổ';
      cardSaveBtn.disabled = true;
      cardSaveBtn.classList.add('saved');
    });
  }

  if (cardCloseBtn) {
    cardCloseBtn.addEventListener('click', () => {
      lookupCard.style.display = 'none';
      wordTokens.forEach(t => t.classList.remove('selected'));
    });
  }

  // Initialize language
  applyLanguage(currentLang);

  // ================= 3. React Bits Background Effects =================
  // Mouse Spotlight Follower
  let hasMouse = false;
  window.addEventListener('pointermove', (e) => {
    if (!hasMouse) {
      document.body.classList.add('has-mouse');
      hasMouse = true;
    }
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  }, { passive: true });

  // SpotlightCard Effect for Feature Cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--card-y', `${e.clientY - rect.top}px`);
    }, { passive: true });
  });

  // Floating Ambient Particles Canvas (React Bits Particles style)
  const canvas = document.getElementById('bg-particles-canvas');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let animationFrameId = null;
    let mouse = { x: -1000, y: -1000 };

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    }, { passive: true });

    // Particle pool: responsive count to guarantee 60fps on mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 12 : Math.min(Math.floor(window.innerWidth / 30), 40);
    const colors = [
      'rgba(198, 237, 97, 0.45)',  // Lime
      'rgba(248, 218, 120, 0.40)', // Amber
      'rgba(158, 230, 202, 0.35)', // Sage
      'rgba(122, 161, 25, 0.30)'   // Olive
    ];

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.35 + 0.15),
        oscillationSpeed: Math.random() * 0.02 + 0.01,
        oscillationDist: Math.random() * 20 + 10,
        initialX: Math.random() * width,
        angle: Math.random() * Math.PI * 2
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drift upward & sway
        p.angle += p.oscillationSpeed;
        p.x = p.initialX + Math.sin(p.angle) * p.oscillationDist;
        p.y += p.vy;

        // Wrap boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.initialX = Math.random() * width;
          p.x = p.initialX;
        }
        if (p.x < -20) p.initialX = width + 20;
        if (p.x > width + 20) p.initialX = -20;

        // Gentle reaction to cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Delicate connecting lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 65) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(180, 210, 110, ${0.15 * (1 - dist2 / 65)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    // Start loop
    render();

    // Pause when tab hidden to save CPU/battery
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        render();
      }
    });
  }
});
