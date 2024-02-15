import Link from "next/link";
import { memo, ReactNode } from "react";
import { Address } from "viem";

import { ABOUT_MODULAR_ACCOUNTS_URL, CHAIN } from "../_lib/constants";
import { useAccountAddress } from "../_lib/sessionKeyWallet";
import { useLogOut } from "../_lib/turnkey";
import BlockExplorerLink from "./blockExplorerLink";

export interface AccountViewProps {
  isOpen: boolean;
  closeModal(): void;
}

export default memo(function AccountView({
  isOpen,
  closeModal,
}: AccountViewProps): ReactNode {
  const [accountAddress] = useAccountAddress();
  const logOut = useLogOut();

  function getLoggedOutView(): ReactNode {
    return (
      <>
        <p>You are not logged in.</p>
        <Link className="btn btn-primary" href="/account" onClick={closeModal}>
          Log in
        </Link>
      </>
    );
  }

  function getLoggedInView(accountAddress: Address): ReactNode {
    return (
      <>
        <p>
          You are logged in with an{" "}
          <a href={ABOUT_MODULAR_ACCOUNTS_URL} target="_blank" rel="noopener">
            ERC-6900 Modular Account
          </a>{" "}
          on {CHAIN.name}!
        </p>
        <p className="mt-0">
          Your address:{" "}
          <BlockExplorerLink
            className="!font-semibold"
            address={accountAddress}
            newTab={true}
          />
        </p>
        <button className="btn btn-neutral" onClick={logOut}>
          Log out
        </button>
      </>
    );
  }

  const contents = accountAddress
    ? getLoggedInView(accountAddress)
    : getLoggedOutView();

  return (
    <div className="prose flex flex-col items-center text-center">
      <h2>Your Account</h2>
      {contents}
    </div>
  );
});
