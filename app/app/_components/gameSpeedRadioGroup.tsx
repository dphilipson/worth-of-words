import { memo, ReactNode } from "react";

import { GAME_SPEED_CONSTANTS, GameSpeed } from "../_lib/lobbyPresets";
import { capitalize, pluralizeNonstandard } from "../_lib/strings";
import RadioGroup, { RadioGroupItem } from "./radioGroup";

export interface GameSpeedRadioGroupProps {
  speed: GameSpeed;
  onSpeedChange(speed: GameSpeed): void;
}

export default memo(function GameSpeedRadioGroup({
  speed,
  onSpeedChange,
}: GameSpeedRadioGroupProps): ReactNode {
  return (
    <RadioGroup<GameSpeed>
      items={ITEMS}
      selectedValue={speed}
      formGroupName="game-speed"
      onSelectedValueChange={onSpeedChange}
    />
  );
});

const ITEMS: RadioGroupItem<GameSpeed>[] = [GameSpeed.FAST, GameSpeed.FULL].map(
  (value) => {
    const { guessMinutes, numLives } = GAME_SPEED_CONSTANTS[value];
    const label = `${capitalize(value)}: ${pluralizeNonstandard(
      numLives,
      "life",
      "lives",
    )}, ${guessMinutes}-minute rounds`;
    return { value, label };
  },
);
