import { useAnimate } from "framer-motion";
import { memo, ReactNode } from "react";

import { SubscribeFunction, useSubscribe } from "../_lib/subscriptions";

export interface PulseOnDemandBoxProps {
  className?: string;
  subscribeToPulses: SubscribeFunction<void> | undefined;
  children: ReactNode;
}

export default memo(function PulseOnDemandBox({
  className,
  subscribeToPulses,
  children,
}: PulseOnDemandBoxProps): ReactNode {
  const [scope, animate] = useAnimate();
  useSubscribe(subscribeToPulses, () =>
    animate(scope.current, { scale: [1, 1.1, 1] }, { duration: 0.25 }),
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
});
