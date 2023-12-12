import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, ReactNode } from "react";
import { FaHouse, FaRegCircleQuestion } from "react-icons/fa6";

export default memo(function Header(): ReactNode {
  const isInLobby = usePathname() === "/app/lobby";
  return (
    <header className="flex h-20 items-center justify-end space-x-1 px-4">
      <Link
        className="btn btn-ghost btn-sm px-1"
        href="/"
        target={isInLobby ? "_blank" : undefined}
      >
        <FaHouse className="text-2xl text-slate-800" />
      </Link>
      <Link
        className="btn btn-ghost btn-sm px-1"
        href="/about"
        target={isInLobby ? "_blank" : undefined}
      >
        <FaRegCircleQuestion className="text-2xl text-slate-800" />
      </Link>
      <div />
      <div className="w-32">
        <ConnectKitButton mode="light" />
      </div>
    </header>
  );
});
