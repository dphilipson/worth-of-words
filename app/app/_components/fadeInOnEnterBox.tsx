import { motion } from "framer-motion";
import { ComponentProps, memo, ReactNode } from "react";

export interface FadeInOnEnterBoxProps
  extends ComponentProps<typeof motion.div> {
  fadeDuration: number;
  noFadeIn?: boolean;
}

export default memo(function FadeInOnEnterBox({
  fadeDuration,
  noFadeIn,
  ...divProps
}: FadeInOnEnterBoxProps): ReactNode {
  return (
    <motion.div
      initial={noFadeIn ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: fadeDuration }}
      {...divProps}
    />
  );
});
