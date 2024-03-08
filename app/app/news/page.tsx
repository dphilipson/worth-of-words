"use client";
import { useRouter } from "next/navigation";
import { memo, ReactNode, useCallback } from "react";

import MainCard from "../_components/mainCard";
import unlockedAccountImage from "../_images/unlocked-account.png";
import { useTurnkeyDetails } from "../_lib/turnkeyRemnant";

export default memo(function NewsPage(): ReactNode {
  const router = useRouter();
  const [, setTurnkeyDetails] = useTurnkeyDetails();

  const handleClick = useCallback(() => {
    setTurnkeyDetails(undefined);
    router.push("/");
  }, [router, setTurnkeyDetails]);

  return (
    <MainCard
      title="Worth of Words has upgraded! 🎉"
      image={unlockedAccountImage}
      imageAlt="Picture of an unlocked account"
      imageHasPriority={true}
    >
      <p>
        Worth of Words can now be played on mobile, and it now supports
        email-based login as well as passkeys.
      </p>
      <p>
        Unfortunately, <b>previously created passkeys will no longer work</b>.
        If you wish to keep using passkey login, you will need to create a new
        one. Sorry about that!
      </p>
      <button className="btn btn-primary" onClick={handleClick}>
        Got it!
      </button>
    </MainCard>
  );
});
