import { memo, ReactNode } from "react";
import { FaHeart, FaHeartCrack } from "react-icons/fa6";
import { chainFrom, range } from "transducist";

export interface LivesIndicatorProps {
  maxLives: number;
  livesLeft: number;
  isEliminated: boolean;
}

export default memo(function LivesIndicator({
  maxLives,
  livesLeft,
  isEliminated,
}: LivesIndicatorProps): ReactNode {
  const LifeIcon = isEliminated ? FaHeartCrack : FaHeart;
  return (
    <div className="flex space-x-0.5">
      {chainFrom(range(maxLives - livesLeft))
        .map((i) => <FaHeartCrack key={i} className="text-slate-500" />)
        .toArray()}
      {chainFrom(range(livesLeft))
        .map((i) => <LifeIcon key={livesLeft - i} className="text-red-600" />)
        .toArray()}
    </div>
  );
});
