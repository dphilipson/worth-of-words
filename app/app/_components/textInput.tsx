import {
  ChangeEvent,
  ComponentProps,
  memo,
  ReactNode,
  useCallback,
} from "react";

export interface TextInputProps extends ComponentProps<"input"> {
  value: string;
  onValueChange(value: string): void;
}

export default memo(function TextInput({
  onValueChange,
  ...otherProps
}: TextInputProps): ReactNode {
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onValueChange(event.currentTarget.value),
    [onValueChange],
  );

  return <input type="text" onChange={onChange} {...otherProps} />;
});
