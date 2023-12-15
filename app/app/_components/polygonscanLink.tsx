import Link from "next/link";
import { memo, ReactNode } from "react";
import { Address } from "viem";

export interface PolygonscanLinkProps {
  address: Address;
}

export default memo(function PolygonscanLink({
  address,
}: PolygonscanLinkProps): ReactNode {
  const href = `https://mumbai.polygonscan.com/address/${address}`;
  return <Link href={href}>{address}</Link>;
});
