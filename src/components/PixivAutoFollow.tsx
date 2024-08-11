import { usePixivAutoFollow } from "@src/contexts/PixivAutoFollowContext";
import { onMount } from "solid-js";

const PixivAutoFollowUI = () => {
  const {
    startAutoFollow,
    stopAutoFollow,
    progressState,
    interval,
    setInterval,
    notificationMessage,
  } = usePixivAutoFollow();

  const insertAutoFollowButton = () => {
    const links: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
      '.ranking-image-item a[href^="/artworks/"]'
    );

    links.forEach((link: HTMLAnchorElement) => {
      const button: HTMLButtonElement = document.createElement("button");
      button.innerText = "自動フォロー";

      button.style.padding = "4px";
      button.style.position = "absolute";
      button.style.top = "10px";
      button.style.left = "10px";
      button.style.backgroundColor = "blue";
      button.style.color = "white";
      button.style.zIndex = "1000";

      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "lightgray";
      });

      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "blue";
      });

      const overlay = document.createElement("div");
      overlay.innerText = "自動フォロー実行中";
      overlay.style.position = "absolute";
      overlay.style.top = "50%";
      overlay.style.left = "50%";
      overlay.style.transform = "translate(-50%, -50%)";
      overlay.style.backgroundColor = "black";
      overlay.style.color = "white";
      overlay.style.padding = "8px 16px";
      overlay.style.borderRadius = "4px";
      overlay.style.zIndex = "1000";
      overlay.style.display = "none"; // 初期状態では非表示
      overlay.classList.add("auto-follow-overlay");
      link.parentElement?.appendChild(overlay);

      button.addEventListener("click", () => {
        const href: string | null = link.getAttribute("href");
        if (href) {
          const match = href.match(/\/artworks\/(\d+)/);
          const artworkId: string | undefined = match ? match[1] : undefined;
          if (artworkId) {
            console.log("作品ID:", artworkId);
            startAutoFollow(artworkId, overlay); // 自動フォロー開始
            overlay.style.display = "block"; // オーバーレイを表示
          }
        }
      });

      const parent = link.parentElement;
      if (parent) {
        parent.style.position = "relative";
        parent.appendChild(button);
      }
    });
  };

  // コンポーネントのマウント時にボタンを挿入
  onMount(() => {
    insertAutoFollowButton();
  });

  return (
    <div
      class="flex flex-col items-center justify-center 
             gap-[10px] border-2 border-solid border-blue-400 bg-white p-[10px] text-black"
    >
      <p>Pixiv Auto Follow</p>
      <div>
        <label>
          フォロー間隔 (ms):
          <input
            type="number"
            value={interval()}
            onInput={(e) => setInterval(parseInt(e.currentTarget.value))}
            class="rounded border border-gray-300 p-1"
          />
        </label>
        <p>現在のカウント: {progressState().current}</p>
        <p>全体のカウント: {progressState().total}</p>
        <p>進捗率: {progressState().progress.toFixed(1)}%</p>
        <div class="h-4 w-full rounded-full bg-gray-200">
          <div
            class="h-4 rounded-full bg-blue-600"
            style={`width: ${progressState().progress}%`}
          />
        </div>
        <button
          onClick={stopAutoFollow}
          class="mt-4 rounded bg-red-500 px-4 py-2 text-white"
        >
          停止
        </button>
        <div
          class="fixed bottom-4 right-4 rounded bg-black p-3 text-white"
          style={{ display: notificationMessage() ? "block" : "none" }}
        >
          {notificationMessage()}
        </div>
      </div>
    </div>
  );
};

export default PixivAutoFollowUI;
