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

export function useRedirectTargetFromUrl(): string {
  const urlHash = useUrlHash();
  const params = new URLSearchParams(urlHash);
  const redirect = params.get("redirect");
  return redirect?.startsWith("/") ? redirect : "/";
}
