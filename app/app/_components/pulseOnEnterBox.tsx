import { motion } from "framer-motion";
import { ComponentProps, memo, ReactNode } from "react";

export interface PulseOnEnterBoxProps
  extends ComponentProps<typeof motion.div> {
  noPulse?: boolean;
}

export default memo(function PulseOnEnterBox({
  noPulse,
  ...divProps
}: PulseOnEnterBoxProps): ReactNode {
  return (
    <motion.div
      initial={noPulse ? undefined : { scale: 0.8, opacity: 0.5 }}
      animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
      transition={{ duration: 0.25 }}
      {...divProps}
    />
  );
});
