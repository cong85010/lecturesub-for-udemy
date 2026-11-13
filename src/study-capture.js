(() => {
  const app = globalThis.CCUdemy ||= {};
  app.captureStudyLesson = async () => {
    const url = location.href, path = location.pathname;
    const selector = '[data-purpose="transcript-panel"]';
    if (!document.querySelector(selector)) {
      const toggle = document.querySelector('[data-purpose="transcript-toggle"]');
      if (!toggle) throw Error('Bài này chưa có phiên âm. Hãy mở mục Phiên âm trên Udemy rồi thử lại.');
      toggle.click();
    }
    // Wait for the complete panel, not the currently playing subtitle line.
    let panel;
    for (let i=0;i<30;i++) {
      if (location.pathname !== path) throw Error('Anh đã chuyển bài. Hãy bấm Ôn bài ở bài hiện tại.');
      panel=document.querySelector(selector);
      if (panel?.querySelector('[data-purpose="cue-text"]')) break;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    const transcript = [...(panel?.querySelectorAll('[data-purpose="cue-text"]') || [])].map(el=>el.textContent.trim()).filter(Boolean).join('\n');
    if (!transcript) throw Error('Chưa đọc được transcript. Mở Phiên âm, chờ tải xong rồi thử lại.');
    const heading = document.querySelector('[data-purpose="course-header-title"]')?.textContent.trim() || document.title;
    const region = [...document.querySelectorAll('[aria-label]')].find(el=>/Bài giảng \d+:|Lecture \d+:/i.test(el.getAttribute('aria-label')));
    const title = region?.getAttribute('aria-label')?.split(/Bài giảng \d+:|Lecture \d+:/i).pop().trim() || `Bài ${path.split('/').pop()}`;
    if (location.pathname !== path) throw Error('Anh đã chuyển bài. Hãy thử lại ở bài hiện tại.');
    return app.studyLesson({url,title,course:heading,transcript});
  };
  app.openStudy = async () => {
    const lesson = await app.captureStudyLesson();
    return app.call('study.open',{lesson});
  };
})();
