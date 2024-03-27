import Link from "next/link";
import { memo, ReactNode } from "react";
import { FaXmark } from "react-icons/fa6";
import { Address } from "viem";

import { ABOUT_MODULAR_ACCOUNTS_URL, CHAIN } from "../_lib/constants";
import { useHasMounted } from "../_lib/hooks";
import {
  useAccountAddress,
  useLogOut,
  useOwnerAddress,
} from "../_lib/sessionKeyWallet";
import BlockExplorerLink from "./blockExplorerLink";

export interface AccountViewProps {
  closeModal(): void;
}

export default memo(function AccountView({
  closeModal,
}: AccountViewProps): ReactNode {
  const [ownerAddress] = useOwnerAddress();
  const [accountAddress] = useAccountAddress();
  const hasMounted = useHasMounted();
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

  function getPartiallyLoggedInView(): ReactNode {
    return (
      <>
        <p>
          You are in the middle of logging in.
          <br />
          <br />
          If you would like to restart the login process, you can:
        </p>
        <button className="btn btn-neutral mt-4" onClick={logOut}>
          Log out
        </button>
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
        <div>Your address:</div>
        <div className="w-[200px] overflow-hidden overflow-ellipsis sm:w-auto">
          <BlockExplorerLink
            className="!font-semibold"
            address={accountAddress}
            newTab={true}
          />
        </div>
        <button className="btn btn-neutral mt-4" onClick={logOut}>
          Log out
        </button>
      </>
    );
  }
  const contents = (() => {
    if (!hasMounted) {
      return getLoggedOutView();
    }
    if (accountAddress) {
      return getLoggedInView(accountAddress);
    }
    if (ownerAddress) {
      return getPartiallyLoggedInView();
    }
    return getLoggedOutView();
  })();

  return (
    <div className="prose relative flex flex-col items-center text-center">
      <h2>Your Account</h2>
      {contents}
      <button
        className="absolute -right-3 -top-3 text-xl text-secondary hover:text-black"
        onClick={closeModal}
      >
        <FaXmark />
      </button>
    </div>
  );
});
