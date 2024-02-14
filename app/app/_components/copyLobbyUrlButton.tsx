import clsx from "clsx";
import { memo, ReactNode, useCallback, useState } from "react";

import { copyToClipboard } from "../_lib/clipboard";
import Card from "./card";

export interface CopyLobbyUrlButtonProps {
  className?: string;
}

export default memo(function CopyLobbyUrlButton({
  className,
}: CopyLobbyUrlButtonProps): ReactNode {
  const [copiedInvite, setCopiedInvite] = useState(false);

  const copyInviteLink = useCallback(() => {
    copyToClipboard(location.href);
    setCopiedInvite(true);
  }, []);

  return (
    <Card
      className={clsx(
        "shadow-flareDown relative border-2 border-[#CCA4FF] px-2 py-2",
        className,
      )}
    >
      <div className="shadow-flareUp pointer-events-none absolute bottom-0 left-0 right-0 top-0 rounded-2xl" />
      <button className="btn btn-ghost" onClick={copyInviteLink}>
        {gradientDownloadIcon}
        <span className="bg-primary bg-clip-text text-transparent">
          {" "}
          {copiedInvite ? "Copied link!" : "Copy lobby link"}
        </span>
      </button>
    </Card>
  );
});

const gradientDownloadIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
  >
    <path
      d="M5.66556 12.8L3.53222 12.8C2.94312 12.8 2.46556 12.3224 2.46556 11.7333L2.46556 3.91106C2.46556 2.92922 3.2615 2.13329 4.24334 2.13329L12.0656 2.13329C12.6547 2.13329 13.1322 2.61085 13.1322 3.19995L13.1322 5.33329M10.9989 19.2L17.3989 19.2C18.5771 19.2 19.5322 18.2448 19.5322 17.0666L19.5322 10.6666C19.5322 9.48841 18.5771 8.53329 17.3989 8.53329L10.9989 8.53328C9.82068 8.53328 8.86556 9.48841 8.86556 10.6666L8.86556 17.0666C8.86556 18.2448 9.82068 19.2 10.9989 19.2Z"
      stroke="url(#paint0_linear_11_2892)"
      strokeWidth="1.77778"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_11_2892"
        x1="19.5322"
        y1="19.2"
        x2="-2.47087"
        y2="6.3886"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.24238" stopColor="#5498FF" />
        <stop offset="1" stopColor="#A131F9" />
      </linearGradient>
    </defs>
  </svg>
);
