importScripts('languages.js', 'settings.js', 'library.js', 'store.js', 'study-core.js', 'study-service.js');
const store = CCUdemy.createStore(chrome.storage.local);
const study = CCUdemy.createStudyService(chrome.storage.local);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  const trusted = sender.url?.startsWith(chrome.runtime.getURL('')) || sender.url?.startsWith('https://www.udemy.com/');
  if (!trusted) return false;
  if (message?.type?.startsWith('study.')) {
    const operation = message.type === 'study.open'
      ? (async () => {
        const id = message.lesson ? await study.handle({type:'study.draft',lesson:message.lesson}) : '';
        await chrome.tabs.create({url:chrome.runtime.getURL('src/study.html') + (id ? `?draft=${encodeURIComponent(id)}` : '')});
      })()
      : study.handle(message);
    operation.then(data=>respond({ok:true,data}),error=>respond({ok:false,error:error.message}));
    return true;
  }
  const operation = message?.type === 'options.open'
    ? message.section
      ? chrome.tabs.create({ url: chrome.runtime.getURL(`src/options.html#${message.section}`) })
      : chrome.runtime.openOptionsPage()
    : store.handle(message);
  Promise.resolve(operation).then(data => respond({ ok: true, data }), error => respond({ ok: false, error: error.message || 'Không lưu được dữ liệu. Hãy thử lại.' }));
  return true;
});
