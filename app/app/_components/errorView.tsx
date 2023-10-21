import Link from "next/link";
import { memo, ReactNode } from "react";

export interface ErrorViewProps {
  children: ReactNode;
}

export default memo(function ErrorView({
  children,
}: ErrorViewProps): ReactNode {
  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="prose card-body">
        {children}
        <div className="h-4" />
        <Link href="/">Return to main page</Link>
      </div>
    </div>
  );
});
