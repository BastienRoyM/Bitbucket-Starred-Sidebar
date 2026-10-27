// Content scripts can't open the options page themselves.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'open-options') chrome.runtime.openOptionsPage();
});
