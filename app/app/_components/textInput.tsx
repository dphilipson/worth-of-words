import clsx from "clsx";
import {
  ChangeEvent,
  ComponentProps,
  KeyboardEvent,
  memo,
  ReactNode,
  useCallback,
} from "react";

export interface TextInputProps extends ComponentProps<"input"> {
  value: string;
  label?: string;
  button?: ReactNode;
  disablePressEnter?: boolean;
  onValueChange(value: string): void;
  onPressEnter?(): void;
}

export default memo(function TextInput({
  className,
  onValueChange,
  onPressEnter,
  label,
  button,
  disablePressEnter,
  ...otherProps
}: TextInputProps): ReactNode {
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onValueChange(event.currentTarget.value),
    [onValueChange],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!disablePressEnter && event.key === "Enter") {
        onPressEnter?.();
      }
    },
    [disablePressEnter, onPressEnter],
  );

  const input = (
    <input
      className={clsx(
        "input input-bordered w-full",
        button && "h-16",
        className,
      )}
      type="text"
      onChange={onChange}
      onKeyDown={onKeyDown}
      {...otherProps}
    />
  );
  const inputWithButton = button ? (
    <div className="align-center relative flex w-full">
      {input}
      <div className="absolute bottom-0 right-2 top-0 flex items-center">
        {button}
      </div>
    </div>
  ) : (
    input
  );
  if (!label) {
    return inputWithButton;
  }
  return (
    <label className="form-control">
      <div className="label pb-1 pl-0">
        <span className="label-text font-medium text-secondary">{label}</span>
      </div>
      {inputWithButton}
    </label>
  );
});
