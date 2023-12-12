import { memo, ReactNode, useCallback, useState } from "react";
import { FaRegCopy } from "react-icons/fa6";

import { copyToClipboard } from "../_lib/clipboard";
import Card from "./card";

export default memo(function CopyLobbyUrlButton(): ReactNode {
  const [copiedInvite, setCopiedInvite] = useState(false);

  const copyInviteLink = useCallback(() => {
    copyToClipboard(location.href);
    setCopiedInvite(true);
  }, []);

  return (
    <Card className="w-full max-w-xl px-2 py-2">
      <button
        className="btn btn-ghost relative text-primary"
        onClick={copyInviteLink}
      >
        {copiedInvite ? "Copied invite!" : "Copy lobby invite link"}
        <FaRegCopy className="absolute right-8" />
      </button>
    </Card>
  );
});
