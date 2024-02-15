import { memo, ReactNode, useEffect, useState } from "react";

export interface DelayedMountProps {
  delay: number;
  children: ReactNode;
}

export default memo(function DelayedMount({
  delay,
  children,
}: DelayedMountProps): ReactNode {
  const [childIsMounted, setChildIsMounted] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setChildIsMounted(true), delay);
    return () => clearTimeout(timeoutId);
  }, [delay]);

  return childIsMounted ? children : undefined;
});
