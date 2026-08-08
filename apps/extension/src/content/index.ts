// Content script running in isolated tab contexts for JINXUNLASHED
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract_text') {
    const element = document.querySelector(request.selector || 'body');
    sendResponse({ text: element?.textContent || '' });
  } else if (request.action === 'click') {
    const element = document.querySelector(request.selector) as HTMLElement;
    if (element) {
      element.click();
      sendResponse({ status: 'clicked' });
    } else {
      sendResponse({ status: 'error', message: 'Element not found' });
    }
  }
  return true;
});
