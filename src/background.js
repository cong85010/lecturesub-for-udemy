importScripts('languages.js', 'settings.js', 'library.js', 'store.js');
const store = CCUdemy.createStore(chrome.storage.local);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  const trusted = sender.url?.startsWith(chrome.runtime.getURL('')) || sender.url?.startsWith('https://www.udemy.com/');
  if (!trusted) return false;
  const operation = message?.type === 'options.open'
    ? message.section
      ? chrome.tabs.create({ url: chrome.runtime.getURL(`src/options.html#${message.section}`) })
      : chrome.runtime.openOptionsPage()
    : store.handle(message);
  Promise.resolve(operation).then(data => respond({ ok: true, data }), error => respond({ ok: false, error: error.message || 'Không lưu được dữ liệu. Hãy thử lại.' }));
  return true;
});
