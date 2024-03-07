import { memo, ReactNode } from "react";
import { Address } from "viem";

import { CHAIN } from "../_lib/constants";

export interface EtherscanishLinkProps {
  className?: string;
  address: Address;
  text?: string;
  newTab?: boolean;
}

const EXPLORER_URL = CHAIN.blockExplorers?.default.url ?? "unknown-chain";

export default memo(function BlockExplorerLink({
  className,
  address,
  text,
  newTab,
}: EtherscanishLinkProps): ReactNode {
  const href = `${EXPLORER_URL}/address/${address}`;
  return (
    <a
      className={className}
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener" : undefined}
    >
      {text ?? address}
    </a>
  );
});
