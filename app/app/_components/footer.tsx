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

import poweredByEmbeddedAccounts from "../_images/powered-by-embedded-accounts.svg";
import { ABOUT_EMBEDDED_ACCOUNTS_URL } from "../_lib/constants";

export default memo(function Footer(): ReactNode {
  const { hideFooterCount: footerHiddenCount } = useContext(FooterContext);
  if (footerHiddenCount > 0) {
    return undefined;
  }
  return (
    <footer className="mt-8 flex h-16 items-center bg-white bg-opacity-80 px-4 sm:mt-16 sm:px-24">
      <a href={ABOUT_EMBEDDED_ACCOUNTS_URL}>
        <Image
          className="h-7 w-auto sm:h-8"
          src={poweredByEmbeddedAccounts}
          alt="Powered by Embedded Accounts"
          priority={true}
        />
      </a>
    </footer>
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
