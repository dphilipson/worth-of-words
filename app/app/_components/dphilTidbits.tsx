import clsx from "clsx";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import dphilImage from "../_images/dphil.png";
import {
  ABOUT_EMBEDDED_ACCOUNTS_URL,
  ABOUT_GAS_MANAGER_URL,
  ABOUT_MODULAR_ACCOUNTS_URL,
} from "../_lib/constants";
import { useNow } from "../_lib/hooks";
import { useStorage } from "../_lib/localStorage";
import { shuffledCopy } from "../_lib/random";
import FadeInOnEnterBox from "./fadeInOnEnterBox";
import ProgressBar from "./progressBar";

const TIDBIT_DURATION = 15000;
const TIDBITS_CLOSED_KEY = "worth-of-words:tidbits-closed";

export interface DphilTidbitsProps {
  initialTidbit?: Tidbit;
  tidbits: Tidbit[];
  positionForNoFooter?: boolean;
}

export interface Tidbit {
  title: string;
  body: ReactNode;
  learnMoreUrl?: string;
}

export const INITIAL_TIDBIT: Tidbit = {
  title: "While you're waiting…",
  body: "Hey, I'm dphil— the creator behind this game! I'll be giving you some fun facts while you wait.",
};

export const TIDBITS: Tidbit[] = [
  {
    title: "Alchemy launches Modular Accounts",
    body: "That's what you're playing on right now! Each action you're taking is happening onchain.",
    learnMoreUrl: ABOUT_MODULAR_ACCOUNTS_URL,
  },
  {
    title: "Build your own app with Embedded Accounts",
    body: "You can create a game like this by using Embedded Accounts, your out-of-the-box smart accounts solution.",
    learnMoreUrl: ABOUT_EMBEDDED_ACCOUNTS_URL,
  },
  {
    title: "This started as my hackathon project",
    body: "Worth of Words was my hackathon project at Alchemy. The people loved it. So here we are.",
  },
  {
    title: "Zero-knowledge proofs let you keep your secrets",
    body: "Blockchain transactions are public, but your secret words are hidden and safe!",
    learnMoreUrl: "/about#zero-knowledge-proofs",
  },
  {
    title: "We'll cover the gas",
    body: "Normally you would need to pay to send transactions, but we're using Alchemy's Gas Manager API so you don't have to!",
    learnMoreUrl: ABOUT_GAS_MANAGER_URL,
  },
  {
    title: "Have a lot of friends?",
    body: "Any number of players can join the same game!",
  },
  {
    title: "We're fully decentralized",
    body: "All game actions are written on the blockchain. No central server needed!",
  },
];

export default memo(function DPhilTidbits({
  initialTidbit,
  tidbits,
  positionForNoFooter,
}: DphilTidbitsProps): ReactNode {
  const [tidbitsClosed, setTidbitsClosed] = useStorage<boolean>({
    key: TIDBITS_CLOSED_KEY,
  });
  const shuffledTidbits = useMemo(() => shuffledCopy(tidbits), [tidbits]);
  const [currentTidbitStartTime, setCurrentTidbitStartTime] = useState(
    Date.now(),
  );
  const [tidbitIndex, setTidbitIndex] = useState(initialTidbit ? -1 : 0);
  const advanceTidbit = useCallback(() => {
    setCurrentTidbitStartTime(Date.now());
    setTidbitIndex((i) => i + 1);
  }, []);
  const closeTidbits = useCallback(
    () => setTidbitsClosed(true),
    [setTidbitsClosed],
  );
  const openTidbits = useCallback(() => {
    advanceTidbit();
    setTidbitsClosed(false);
  }, [advanceTidbit, setTidbitsClosed]);
  const now = useNow(!tidbitsClosed);
  const timeSinceStart = now - currentTidbitStartTime;
  const progressFraction = Math.max(
    0,
    Math.min(1, timeSinceStart / TIDBIT_DURATION),
  );
  const isTimeToAdvance = progressFraction === 1;

  useEffect(() => {
    if (isTimeToAdvance) {
      advanceTidbit();
    }
  }, [isTimeToAdvance, advanceTidbit]);

  const tidbit =
    tidbitIndex === -1
      ? initialTidbit!
      : shuffledTidbits[tidbitIndex % tidbits.length];

  function getClosedComponent(): ReactNode {
    return (
      <FadeInOnEnterBox
        className="cursor-pointer rounded-2xl bg-gray-800 p-2 shadow-xl transition-transform hover:scale-105 active:scale-95 sm:p-6"
        fadeDuration={0.25}
        onClick={openTidbits}
      >
        <DPhilIcon />
      </FadeInOnEnterBox>
    );
  }

  function getOpenComponent(): ReactNode {
    return (
      <div className="ml-2 max-w-[32rem] space-y-4 rounded-2xl bg-gray-800 p-3 shadow-xl sm:p-6">
        <div className="sm:flex sm:space-x-4">
          <DPhilIcon className="hidden sm:block" onClick={closeTidbits} />
          <div className="space-y-2">
            <div className="flex items-center space-x-3 sm:space-x-0">
              <DPhilIcon className="sm:hidden" onClick={closeTidbits} />
              <FadeInOnEnterBox
                key={tidbitIndex}
                className="prose -mt-1"
                fadeDuration={0.75}
                noFadeIn={tidbitIndex === -1}
              >
                <h4 className="mt-0 text-white">{tidbit.title}</h4>
              </FadeInOnEnterBox>
            </div>
            <FadeInOnEnterBox
              key={tidbitIndex}
              className="prose -mt-1"
              fadeDuration={0.75}
              noFadeIn={tidbitIndex === -1}
            >
              <p className="mb-2 text-sm leading-6 text-gray-400 sm:text-base">
                {tidbit.body}
              </p>
              <div className="flex space-x-2">
                {tidbitIndex === -1 && (
                  <TextButton onClick={advanceTidbit}>
                    Cool, thanks dphil!
                  </TextButton>
                )}
                {tidbit.learnMoreUrl && (
                  <a href={tidbit.learnMoreUrl} target="_blank" rel="noopener">
                    <TextButton>Tell me more</TextButton>
                  </a>
                )}
                <TextButton isSecondary={true} onClick={closeTidbits}>
                  Not now, dphil!
                </TextButton>
              </div>
            </FadeInOnEnterBox>
          </div>
        </div>
        <ProgressBar fillFraction={progressFraction} />
      </div>
    );
  }

  const contents = tidbitsClosed ? getClosedComponent() : getOpenComponent();

  return (
    <motion.div
      className={clsx(
        "fixed bottom-2 right-2 sm:right-12",
        positionForNoFooter ? "sm:bottom-12" : "sm:bottom-28",
      )}
      initial={{ opacity: 0.5, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3 }}
    >
      {contents}
    </motion.div>
  );
});

interface DPhilIconProps {
  className?: string;
  onClick?(): void;
}

const DPhilIcon = memo(function DPhilIcon({
  className,
  onClick,
}: DPhilIconProps): ReactNode {
  return (
    <Image
      className={clsx(
        "h-12 w-12 rounded sm:h-16 sm:w-16",
        onClick && "cursor-pointer",
        className,
      )}
      width={64}
      height={64}
      src={dphilImage}
      alt="Icon of dphil's portrait"
    />
  );
});

interface TextButtonProps {
  children: ReactNode;
  isSecondary?: boolean;
  onClick?(): void;
}

const noop = () => {};

const TextButton = memo(function TextButton({
  children,
  isSecondary,
  onClick = noop,
}: TextButtonProps): ReactNode {
  return (
    <button
      className={clsx(
        "text-sm font-semibold hover:underline",
        isSecondary ? "text-gray-400" : "text-purple-300",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
});
