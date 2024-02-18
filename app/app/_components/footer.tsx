import Image from "next/image";
import {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import poweredByAccountKit from "../_images/powered-by-account-kit.svg";
import { ABOUT_ACCOUNT_KIT_URL } from "../_lib/constants";

export default memo(function Footer(): ReactNode {
  const { hideFooterCount: footerHiddenCount } = useContext(FooterContext);
  if (footerHiddenCount > 0) {
    return undefined;
  }
  // First div is a spacer so page content doesn't overlap the footer when
  // scrolled to the bottom.
  return (
    <>
      <div className="h-20 w-full" />
      <div className="fixed bottom-0 left-0 right-0 flex h-16 items-center bg-white bg-opacity-80 pl-24">
        <a href={ABOUT_ACCOUNT_KIT_URL}>
          <Image
            src={poweredByAccountKit}
            alt="Powered by AccountKit"
            priority={true}
          />
        </a>
      </div>
    </>
  );
});

// Use context to allow child components to hide the footer no matter where they
// are in the tree.

interface FooterContext {
  hideFooterCount: number;
  addToHideFooterCount(n: number): void;
}

const FooterContext = createContext<FooterContext>(undefined!);

export interface FooterProviderProps {
  children: ReactNode;
}

export function FooterProvider({ children }: FooterProviderProps): ReactNode {
  const [hideFooterCount, setHideFooterCount] = useState(0);
  const addToHideFooterCount = useCallback(
    (n: number) => setHideFooterCount((current) => current + n),
    [setHideFooterCount],
  );
  const context = useMemo(
    () => ({ hideFooterCount, addToHideFooterCount }),
    [hideFooterCount, addToHideFooterCount],
  );

  return (
    <FooterContext.Provider value={context}>{children}</FooterContext.Provider>
  );
}

export function useHideFooter(): void {
  const { addToHideFooterCount: addToFooterHiddenCount } =
    useContext(FooterContext);

  useEffect(() => {
    addToFooterHiddenCount(1);
    return () => {
      addToFooterHiddenCount(-1);
    };
  });
}
