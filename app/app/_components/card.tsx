import clsx from "clsx";
import { memo, ReactNode } from "react";

export interface CardProps {
  className?: string;
  isFullWidth?: boolean;
  noDefaultBackground?: boolean;
  noDefaultPadding?: boolean;
  children: ReactNode;
}

export default memo(function Card({
  className,
  isFullWidth,
  noDefaultBackground,
  noDefaultPadding,
  children,
}: CardProps): ReactNode {
  return (
    <div
      className={clsx(
        "prose card mx-4 shadow-2xl",
        isFullWidth && "max-w-[48rem] lg:w-[48rem]",
        !noDefaultBackground && "bg-base-100",
        !noDefaultPadding && "p-8",
        className,
      )}
    >
      {children}
    </div>
  );
});
