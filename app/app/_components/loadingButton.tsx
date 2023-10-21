import { ComponentProps, memo, ReactElement } from "react";

export interface LoadingButtonProps extends ComponentProps<"button"> {
  isLoading: boolean;
}

export default memo(function LoadingButton({
  isLoading,
  disabled,
  children,
  ...otherProps
}: LoadingButtonProps): ReactElement {
  return (
    <button disabled={disabled || isLoading} {...otherProps}>
      {children}
      {isLoading && (
        <span className="loading loading-spinner loading-sm ml-2" />
      )}
    </button>
  );
});
