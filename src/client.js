(() => {
  const app = globalThis.CCUdemy ||= {};
  app.call = async (type, payload = {}) => {
    const response = await chrome.runtime.sendMessage({ ...payload, type });
    if (!response?.ok) throw Error(response?.error || 'Không kết nối được tiện ích. Tải lại tab rồi thử lại.');
    return response.data;
  };
})();
