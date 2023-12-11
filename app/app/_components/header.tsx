import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, ReactNode } from "react";

export default memo(function Header(): ReactNode {
  const isInLobby = usePathname() === "/app/lobby";
  return (
    <div className="flex h-20 items-center justify-end space-x-4 px-4">
      <Link href="/app" target={isInLobby ? "_blank" : undefined}>
        About
      </Link>
      <div className="w-32">
        <ConnectKitButton />
      </div>
    </div>
  );
});
