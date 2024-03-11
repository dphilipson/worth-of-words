import { useRouter, useSearchParams } from "next/navigation";
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

export function useRedirectTargetFromUrl(): string {
  // Look in both search params and the url hash. The hash is usually used,
  // except when following a magic link from Alchemy Signer's email
  // authentication, which uses search params intead.
  const searchParams = useFixedSearchParams();
  const urlHash = useUrlHash();
  const redirect =
    searchParams.get("redirect") ??
    new URLSearchParams(urlHash).get("redirect");
  return redirect?.startsWith("/") ? redirect : "/";
}

/**
 * Search params are currently only used by email magic links, which are
 * currently escaped incorrectly. A fix is coming, but until then clean up the
 * search params so we can use them.
 */
export function useFixedSearchParams(): URLSearchParams {
  const rawSearchParams = useSearchParams();
  const fixedSearchParams = new URLSearchParams();
  for (const [key, value] of rawSearchParams) {
    if (value !== "") {
      fixedSearchParams.set(key, value);
    } else {
      const keyParams = new URLSearchParams(key);
      for (const [subKey, subValue] of keyParams) {
        fixedSearchParams.set(subKey, subValue);
      }
    }
  }
  return fixedSearchParams;
}
