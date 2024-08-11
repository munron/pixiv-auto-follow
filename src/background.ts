//export {};
import { ChromeRuntimeMessage } from "@src/types/extension";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // うまく動作しない
  if (request.type === ChromeRuntimeMessage.SHOW_NOTIFICATION) {
    console.log(request);
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: chrome.runtime.getURL("src/assets/icon128.png"), // 拡張機能のアイコンを指定
        title: request.title,
        message: `${request.message}`,
        priority: 2,
      },
      (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Notification error: ",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("Notification displayed with ID:", notificationId);
        }
      }
    );
    sendResponse();
    return;
  }
});
