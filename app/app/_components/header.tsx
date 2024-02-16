import Link from "next/link";
import { memo, ReactNode } from "react";
import { FaHouse, FaRegCircleQuestion, FaRegCircleUser } from "react-icons/fa6";

import { useCreateSubscription } from "../_lib/subscriptions";
import AccountView from "./accountView";
import Modal from "./modal";

export default memo(function Header(): ReactNode {
  const [openAccountModal, subscribeToOpenAccountModal] =
    useCreateSubscription<void>();
  return (
    <header className="flex h-20 items-center justify-end space-x-1 px-4">
      <Link className="btn btn-ghost btn-sm px-1" href="/">
        <FaHouse className="text-2xl text-slate-800" />
      </Link>
      <Link className="btn btn-ghost btn-sm px-1" href="/about">
        <FaRegCircleQuestion className="text-2xl text-slate-800" />
      </Link>
      <button className="btn btn-ghost btn-sm px-1" onClick={openAccountModal}>
        <FaRegCircleUser className="text-2xl text-slate-800" />
      </button>
      <div />
      <Modal subscribeToOpenModal={subscribeToOpenAccountModal}>
        {({ closeModal }) => <AccountView closeModal={closeModal} />}
      </Modal>
    </header>
  );
});
