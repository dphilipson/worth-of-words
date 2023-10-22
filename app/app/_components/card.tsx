import clsx from "clsx";
import { memo, ReactNode } from "react";

export interface CardProps {
  className?: string;
  children: ReactNode;
}

export default memo(function Card({
  className,
  children,
}: CardProps): ReactNode {
  return (
    <div
      className={clsx(
        "card bg-base-100 bg-opacity-80 px-8 py-4 shadow-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
});
