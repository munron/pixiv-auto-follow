import { Component } from "solid-js";

import { PixivAutoFollowProvider } from "@src/contexts/PixivAutoFollowContext";
import PixivAutoFollowUI from "@src/components/PixivAutoFollow";

const Contents: Component = () => {
  return (
    <div class="fixed bottom-[100px] right-[10px] z-[2000] w-[200px] rounded-2xl bg-white">
      <PixivAutoFollowProvider>
        <PixivAutoFollowUI />
      </PixivAutoFollowProvider>
    </div>
  );
};

export default Contents;
