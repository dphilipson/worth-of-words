"use client";
import Link from "next/link";
import { memo, ReactNode } from "react";
import { useAccount } from "wagmi";

import Card from "../_components/card";
import { useHasMounted } from "../_lib/hooks";
import AccountSetupWhenConnected from "./_components/accountSetupWhenConnected";

export default memo(function AccountPage(): ReactNode {
  const { address } = useAccount();
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return <div />;
  }

  const contents = address ? (
    <AccountSetupWhenConnected key={address} address={address} />
  ) : (
    <>
      <h3>First things first</h3>
      <p>Connect your wallet using the button in the upper-right.</p>
    </>
  );

  return (
    <div className="flex flex-col items-center pt-48">
      {!address && <div className="absolute right-20 top-20 text-9xl">↗</div>}
      <Card className="max-w-xl">
        <div className="prose">{contents}</div>
      </Card>
      <div className="prose prose-lg mt-5">
        <Link href="/">Return home</Link>
      </div>
    </div>
  );
});
