import clsx from "clsx";
import { memo, ReactNode } from "react";

export interface OrDividerProps {
  className?: string;
}

export default memo(function OrDivider({
  className,
}: OrDividerProps): ReactNode {
  return (
    <div className={clsx("my-4 flex w-full items-center", className)}>
      <div className="h-[1px] flex-1 bg-gray-300" />
      <div className="mx-2 flex-initial  text-gray-500">or</div>
      <div className="h-[1px] flex-1 bg-gray-300" />
    </div>
  );
});
