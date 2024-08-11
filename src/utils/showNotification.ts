import { ChromeRuntimeMessage } from "@src/types/extension";

export const showNotification = (title: string, message: string) => {
  return new Promise<string>((resolve) => {
    const msg = {
      type: ChromeRuntimeMessage.SHOW_NOTIFICATION,
      message: message,
      title: title,
    };
    chrome.runtime.sendMessage(msg, (response) => {
      resolve(response);
    });
  });
};
