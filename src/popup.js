(() => {
  const app = globalThis.CCUdemy, status = document.querySelector('#status');
  let settings = app.normalizeSettings({}), revision = 0, settingsEvents = 0;
  const forms = [];
  const controls = { update(value) { forms.forEach(form => form.update(value)); } };
  const change = async patch => {
    const current = ++revision, eventsBefore = settingsEvents; status.textContent = 'Đang lưu…';
    try {
      const value = await app.call('settings.patch', { patch });
      if (current === revision) { if (eventsBefore === settingsEvents) { settings = value; controls.update(settings); } status.textContent = 'Đã lưu'; }
    } catch (error) { if (current === revision) { controls.update(settings); status.textContent = error.message; } }
  };
  forms.push(app.createControls(document.querySelector('#popup-enabled'), ['enabled'], { change }));
  forms.push(app.createControls(document.querySelector('#quick-settings'), ['sourceLanguage', 'targetLanguage', 'displayMode'], { change }));
  controls.update(settings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.ccUdemySettings) {
      settingsEvents++; settings = app.normalizeSettings(changes.ccUdemySettings.newValue); controls.update(settings);
      if (revision === 0) status.textContent = 'Thay đổi áp dụng ngay trên các tab Udemy.';
    }
  });
  const initialEvents = settingsEvents;
  app.call('settings.get').then(value => {
    if (initialEvents === settingsEvents && revision === 0) { settings = value; controls.update(settings); status.textContent = 'Thay đổi áp dụng ngay trên các tab Udemy.'; }
  }).catch(error => { if (initialEvents === settingsEvents && revision === 0) status.textContent = error.message; });
  async function open(section) {
    try { await app.call('options.open', { section }); window.close(); }
    catch (error) { status.textContent = error.message; }
  }
  document.querySelector('#options').addEventListener('click', () => open());
  document.querySelector('#notebook').addEventListener('click', () => open('vocabulary'));
})();
