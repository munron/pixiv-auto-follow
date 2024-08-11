import { sleep } from "@src/utils/sleep";
import {
  createContext,
  useContext,
  createSignal,
  JSX,
  Accessor,
  Setter,
} from "solid-js";

// 型定義
interface User {
  userName: string;
  userId: string;
}

interface ProgressState {
  current: number;
  total: number;
  progress: number;
}

interface PixivAutoFollowContextProps {
  targetUser: Accessor<User>;
  setTargetUser: Setter<User>;
  progressState: Accessor<ProgressState>;
  setProgressState: Setter<ProgressState>;
  interval: Accessor<number>;
  setInterval: Setter<number>;
  isRunning: Accessor<boolean>;
  setIsRunning: Setter<boolean>;
  notificationMessage: Accessor<string>;
  setNotificationMessage: Setter<string>;
  startAutoFollow: (illustId: string, overlay: HTMLElement) => void;
  stopAutoFollow: () => void;
  followUserOnUI: () => void;
}

// コンテキストの作成
const PixivAutoFollowContext = createContext<PixivAutoFollowContextProps>();

export const PixivAutoFollowProvider = (props: { children: JSX.Element }) => {
  const [targetUser, setTargetUser] = createSignal<User>({
    userName: "",
    userId: "",
  });
  const [progressState, setProgressState] = createSignal<ProgressState>({
    current: 0,
    total: 0,
    progress: 0,
  });
  const [interval, setInterval] = createSignal(4000);
  const [isRunning, setIsRunning] = createSignal(false);
  const [notificationMessage, setNotificationMessage] = createSignal("");
  let activeOverlay: HTMLElement | null = null;

  const getToken = () => {
    const token = document
      .querySelector("input[name='tt']")
      ?.getAttribute("value");
    return token || "";
  };

  const getBookMarkUserInfosByIllustId = async (illustId: string, page = 0) => {
    const link = `https://www.pixiv.net/bookmark_detail.php?illust_id=${illustId}${
      page == 0 ? "" : `&p=${page}`
    }`;
    const response = await fetch(link);
    const htmlString = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const metaData = Array.from(doc.querySelectorAll(".user.ui-profile-popup"));
    return metaData
      .map((x) => ({
        userId: x.getAttribute("data-user_id") || "",
        userName: x.getAttribute("data-user_name") || "",
      }))
      .filter((info) => info.userId && info.userName);
  };

  const getBookMarkUserCount = async (illustId: string) => {
    const link = `https://www.pixiv.net/bookmark_detail.php?illust_id=${illustId}`;
    const response = await fetch(link);
    const htmlString = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const countStr =
      doc.querySelector(".count-badge")?.textContent?.replace("人", "") || "0";
    return parseInt(countStr, 10);
  };

  const isUserFollowed = async (userId: string): Promise<boolean> => {
    const url = `https://www.pixiv.net/rpc/get_profile.php?user_ids=${userId}&illust_num=3&novel_num=3`;
    const headers = new Headers({
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/json; charset=utf-8",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://www.pixiv.net/",
      "User-Agent": navigator.userAgent,
      Cookie: document.cookie,
    });

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data.body && data.body.length > 0 && data.body[0].is_follow;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return false;
  };

  const followUser = async (
    illustId: string,
    userId: string,
    token: string
  ): Promise<boolean> => {
    const url = "https://www.pixiv.net/bookmark_add.php";
    const headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json, text/javascript, */*; q=0.01",
      Referer: `https://www.pixiv.net/bookmark_detail.php?illust_id=${illustId}`,
      "X-Requested-With": "XMLHttpRequest",
    });

    const body = new URLSearchParams({
      mode: "add",
      type: "user",
      user_id: userId,
      restrict: "0",
      format: "json",
      tt: token,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`User ${userId} followed successfully:`, result);
        return true;
      } else {
        console.error("Failed to follow user:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  };

  const startAutoFollow = async (illustId: string, overlay: HTMLElement) => {
    activeOverlay = overlay;
    const userCount = await getBookMarkUserCount(illustId);
    const pageCount = Math.ceil(userCount / 50);

    setProgressState({ current: 0, total: userCount, progress: 0 });
    setIsRunning(true);

    const token = getToken();
    if (!token) {
      console.error("Token not found");
      return;
    }

    for (let page = 0; page < pageCount; page++) {
      if (!isRunning()) break;

      const userInfos = await getBookMarkUserInfosByIllustId(illustId, page);

      for (let i = 0; i < userInfos.length; i++) {
        if (!isRunning()) break;

        const userName = userInfos[i].userName;
        const userId = userInfos[i].userId;
        const isFollowed = await isUserFollowed(userId);

        setTargetUser(userInfos[i]);

        const currentProgress = page * 50 + i + 1;
        const progressPercentage = (currentProgress / userCount) * 100;

        setProgressState({
          current: currentProgress,
          total: userCount,
          progress: progressPercentage,
        });

        if (!isFollowed) {
          window.open(`https://www.pixiv.net/users/${userId}#follow`);
          await sleep(interval());
        }

        await sleep(30);
      }
    }

    setIsRunning(false);
    if (activeOverlay) {
      activeOverlay.style.display = "none"; // フォロー処理が完了したらオーバーレイを非表示
    }
  };

  const stopAutoFollow = () => {
    setIsRunning(false);
    if (activeOverlay) {
      activeOverlay.style.display = "none"; // 停止時にオーバーレイを非表示
    }
  };

  const followUserOnUI = async () => {
    console.log(`address = ${location.href}}`);
    if (/#follow/.test(location.href)) {
      console.log("follow");
      (
        document.querySelector(
          "button[data-click-label*='follow']"
        ) as HTMLElement
      )?.click();
    }
    await sleep(1000);
    window.close();
  };

  return (
    <PixivAutoFollowContext.Provider
      value={{
        targetUser,
        setTargetUser,
        progressState,
        setProgressState,
        interval,
        setInterval,
        isRunning,
        setIsRunning,
        notificationMessage,
        setNotificationMessage,
        startAutoFollow,
        stopAutoFollow,
        followUserOnUI,
      }}
    >
      {props.children}
    </PixivAutoFollowContext.Provider>
  );
};

export const usePixivAutoFollow = () => {
  const context = useContext(PixivAutoFollowContext);
  if (!context) {
    throw new Error(
      "usePixivAutoFollow must be used within a PixivAutoFollowProvider"
    );
  }
  return context;
};
