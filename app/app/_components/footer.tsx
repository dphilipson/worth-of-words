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

export default memo(function Footer(): ReactNode {
  const { footerHiddenCount } = useContext(FooterContext);
  if (footerHiddenCount > 0) {
    return undefined;
  }
  // First div is a spacer so page content doesn't overlap the footer when
  // scrolled to the bottom.
  return (
    <>
      <div className="h-20 w-full" />
      <div className="fixed bottom-0 left-0 right-0 flex h-16 items-center bg-white bg-opacity-80 pl-24">
        <a href="https://accountkit.alchemy.com/">
          <Image src={poweredByAccountKit} alt="Powered by AccountKit" />
        </a>
      </div>
    </>
  );
});

// Use context to allow child components to hide the footer no matter where they
// are in the tree.

interface FooterContext {
  footerHiddenCount: number;
  addToFooterHiddenCount(n: number): void;
}

const FooterContext = createContext<FooterContext>(undefined!);

export interface FooterProviderProps {
  children: ReactNode;
}

export function FooterProvider({ children }: FooterProviderProps): ReactNode {
  const [footerHiddenCount, setFooterHiddenCount] = useState(0);
  const addToFooterHiddenCount = useCallback(
    (n: number) => setFooterHiddenCount((current) => current + n),
    [setFooterHiddenCount],
  );
  const context = useMemo(
    () => ({ footerHiddenCount, addToFooterHiddenCount }),
    [footerHiddenCount, addToFooterHiddenCount],
  );

  return (
    <FooterContext.Provider value={context}>{children}</FooterContext.Provider>
  );
}

export function useHideFooter(): void {
  const { addToFooterHiddenCount } = useContext(FooterContext);

  useEffect(() => {
    addToFooterHiddenCount(1);
    return () => {
      addToFooterHiddenCount(-1);
    };
  });
}
