import { ExtensionMessage, ExtensionResponse } from '@jinxunlashed/protocol';

// Manage active port connections across content scripts and extension popups
const activePorts = new Map<string, chrome.runtime.Port>();

chrome.runtime.onConnect.addListener((port) => {
  const portId = `${port.name}_${port.sender?.tab?.id ?? 'popup'}`;
  activePorts.set(portId, port);

  port.onMessage.addListener(async (message: ExtensionMessage) => {
    try {
      const response = await handleExtensionMessage(message, port.sender);
      const res: ExtensionResponse = { status: 'success', correlationId: message.id, payload: response };
      port.postMessage(res);
    } catch (err: any) {
      const res: ExtensionResponse = { status: 'error', correlationId: message.id, error: err.message };
      port.postMessage(res);
    }
  });

  port.onDisconnect.addListener(() => {
    activePorts.delete(portId);
  });
});

async function handleExtensionMessage(msg: ExtensionMessage, sender?: chrome.runtime.MessageSender) {
  switch (msg.type) {
    case 'EXECUTE_DOM_ACTION':
      if (!sender?.tab?.id) throw new Error('Action must originate from an active tab context');
      return await chrome.tabs.sendMessage(sender.tab.id, msg.payload);

    case 'SYNC_WORKFLOW_STATE':
      const res = await fetch('http://localhost:4000/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();

    default:
      throw new Error(`Unhandled extension message type: ${msg.type}`);
  }
}
