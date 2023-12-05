import { memo, ReactNode, useId } from "react";

export interface RadioGroupProps<T extends string> {
  items: RadioGroupItem<T>[];
  selectedValue: T;
  formGroupName: string;
  onSelectedValueChange(value: T): void;
}

export interface RadioGroupItem<T extends string> {
  value: T;
  label: string;
}

function RadioGroup<T extends string>({
  items,
  selectedValue,
  formGroupName,
  onSelectedValueChange,
}: RadioGroupProps<T>): ReactNode {
  const name = `${formGroupName}-${useId()}`;
  return (
    <div>
      {items.map(({ value, label }) => (
        <div key={value} className="form-control">
          <label className="label cursor-pointer justify-start">
            <input
              type="radio"
              name={name}
              className="radio-primary radio"
              checked={value === selectedValue}
              onChange={(event) => {
                if (event.currentTarget.checked) {
                  onSelectedValueChange(value);
                }
              }}
            />
            <span className="label-text ml-4">{label}</span>
          </label>
        </div>
      ))}
    </div>
  );
}

export default memo(RadioGroup) as typeof RadioGroup;
