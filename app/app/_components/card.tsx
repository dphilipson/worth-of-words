import clsx from "clsx";
import { memo, ReactNode } from "react";

export interface CardProps {
  className?: string;
  isFullWidth?: boolean;
  noDefaultBackground?: boolean;
  children: ReactNode;
}

export default memo(function Card({
  className,
  isFullWidth,
  noDefaultBackground,
  children,
}: CardProps): ReactNode {
  return (
    <div
      className={clsx(
        "prose card mx-4 p-8 shadow-2xl",
        isFullWidth && "max-w-[48rem] lg:w-[48rem]",
        !noDefaultBackground && "bg-base-100",
        className,
      )}
    >
      {children}
    </div>
  );
});
