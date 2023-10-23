import { motion } from "framer-motion";
import { memo, ReactNode } from "react";

export interface PulseOnEnterBoxProps {
  className?: string;
  children: ReactNode;
  noPulse?: boolean;
}

export default memo(function PulseOnEnterBox({
  className,
  children,
  noPulse,
}: PulseOnEnterBoxProps): ReactNode {
  return (
    <motion.div
      className={className}
      initial={noPulse ? undefined : { scale: 0.8, opacity: 0.5 }}
      animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
});
