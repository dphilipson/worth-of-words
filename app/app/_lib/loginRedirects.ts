import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useUrlHash } from "./hooks";

export function useRedirectToLogin(): () => void {
  const router = useRouter();
  return useCallback(() => {
    const redirect = location.href.replace(location.origin, "");
    const params = new URLSearchParams([["redirect", redirect]]);
    const target = "/account#?" + params;
    router.replace(target);
  }, [router]);
}

export function useRedirectAfterLogin(): () => void {
  const router = useRouter();
  const urlHash = useUrlHash();

  return useCallback(() => {
    if (!urlHash) {
      router.replace("/");
      return;
    }
    const params = new URLSearchParams(urlHash);
    const redirect = params.get("redirect");
    if (redirect?.startsWith("/")) {
      router.replace(redirect);
    } else {
      router.replace("/");
    }
  }, [urlHash, router]);
}
