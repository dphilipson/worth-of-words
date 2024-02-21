import Link from "next/link";
import { memo, ReactNode } from "react";

import MainCard from "../_components/mainCard";
import unlockedAccountImage from "../_images/unlocked-account.png";

export default memo(function MobileNoticePage(): ReactNode {
  return (
    <MainCard
      title="Please switch to desktop"
      image={unlockedAccountImage}
      imageAlt="Abstract picture indicating that you should switch to desktop"
      imageHasPriority={false}
    >
      <p className="text-secondary">
        Worth of Words is only supported on desktop as of now— sorry!
      </p>
      <Link className="btn btn-primary" href="/">
        Return home
      </Link>
      <div className="mt-6 rounded-lg bg-gray-200 p-2">
        This was dphil&apos;s hackathon project. Give him a break, please. 👉👈
      </div>
    </MainCard>
  );
});
