import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, ReactNode } from "react";
import { FaRegCircleQuestion } from "react-icons/fa6";

export default memo(function Header(): ReactNode {
  const isInLobby = usePathname() === "/app/lobby";
  return (
    <div className="flex h-20 items-center justify-end space-x-2 px-4">
      <Link
        className="btn btn-ghost btn-sm"
        href="/about"
        target={isInLobby ? "_blank" : undefined}
      >
        <FaRegCircleQuestion className="text-2xl text-slate-800" />
      </Link>
      <div className="w-32">
        <ConnectKitButton mode="light" />
      </div>
    </div>
  );
});
