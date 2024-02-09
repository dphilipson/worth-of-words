import Link from "next/link";
import { memo, ReactNode } from "react";
import { Address } from "viem";

import { CHAIN } from "../_lib/constants";

export interface EtherscanishLinkProps {
  address: Address;
}

const DOMAIN = CHAIN.blockExplorers?.default.apiUrl ?? "unknown-chain";

export default memo(function BlockExplorerLink({
  address,
}: EtherscanishLinkProps): ReactNode {
  const href = `https://${DOMAIN}/address/${address}`;
  return <Link href={href}>{address}</Link>;
});
