"use client";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { memo, ReactNode, useCallback, useEffect, useState } from "react";
import { privateKeyToAddress } from "viem/accounts";

import Card from "../_components/card";
import LoadingButton from "../_components/loadingButton";
import { useHasMounted } from "../_lib/hooks";
import { useRedirectAfterLogin } from "../_lib/loginRedirects";
import {
  addSessionKeyDeployingIfNeeded,
  createOwnerAccount,
} from "../_lib/modularAccount";
import { randomBytes32 } from "../_lib/random";
import {
  useAccountAddress,
  useSessionPrivateKey,
} from "../_lib/sessionKeyWallet";
import {
  createSubOrgAndWallet,
  getTurnkeySigner,
  login,
  useTurnkeyDetails,
} from "../_lib/turnkey";

export default memo(function AccountPage(): ReactNode {
  const [details, setDetails] = useTurnkeyDetails();
  const [, setAccountAddress] = useAccountAddress();
  const [sessionPrivateKey, setSessionPrivateKey] = useSessionPrivateKey();
  const [errorText, setErrorText] = useState("");

  function getErrorHandler(text: string): (error: unknown) => void {
    return (error) => {
      if (error instanceof DOMException) {
        // This can indicate the user canceled out of the passkey flow.
        // Unfortunately we don't get a better indication than this.
        return;
      }
      console.error(text, error);
      setErrorText(text);
    };
  }

  const { mutate: createPasskey, isPending: isCreatingPasskey } = useMutation({
    mutationFn: (_: unknown) => createSubOrgAndWallet(),
    onSuccess: (details) => {
      setDetails(details);
      setErrorText("");
    },
    onError: getErrorHandler("Failed to create passkey."),
  });
  const {
    mutate: chooseExistingPasskey,
    isPending: isChoosingExistingPasskey,
  } = useMutation({
    mutationFn: (_: unknown) => login(),
    onSuccess: (details) => {
      setDetails(details);
      setErrorText("");
    },
    onError: getErrorHandler("Failed to select passkey."),
  });
  const { mutate: createSessionKey, isPending: isCreatingSessionKey } =
    useMutation({
      mutationFn: async (_: unknown) => {
        if (!details) {
          return;
        }
        const newSessionPrivateKey = randomBytes32();
        const sessionPublicKey = privateKeyToAddress(newSessionPrivateKey);
        const owner = await getTurnkeySigner(details);
        const ownerAccount = await createOwnerAccount(owner);
        await addSessionKeyDeployingIfNeeded({
          ownerAccount,
          sessionPublicKey,
        });
        setAccountAddress(ownerAccount.address);
        setSessionPrivateKey(newSessionPrivateKey);
      },
      onSuccess: () => setErrorText(""),
      onError: getErrorHandler("Failed to create session key."),
    });
  const cancelPasskeyChoice = useCallback(() => {
    setDetails(undefined);
    setAccountAddress(undefined);
  }, [setDetails, setAccountAddress]);
  const isLoading =
    isCreatingPasskey || isChoosingExistingPasskey || isCreatingSessionKey;
  const redirectAfterLogin = useRedirectAfterLogin();
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (sessionPrivateKey) {
      redirectAfterLogin();
    }
  }, [sessionPrivateKey, redirectAfterLogin]);

  if (!hasMounted) {
    return <div />;
  }

  const contents = !details ? (
    <>
      <h3>First things first</h3>
      <p>
        Worth of Words uses passkeys so you can secure your account without a
        password. Create the passkey that will be used to access your account.{" "}
        <Link href="/about#passkeys">What is this?</Link>
      </p>
      <div className="flex justify-center">
        <LoadingButton
          className="btn btn-primary"
          isLoading={isCreatingPasskey}
          disabled={isLoading}
          onClick={createPasskey}
        >
          Create new passkey
        </LoadingButton>
      </div>
      <p>
        Or{" "}
        <button disabled={isLoading} onClick={chooseExistingPasskey}>
          <a>choose an existing passkey</a>
        </button>
        .
      </p>
    </>
  ) : (
    <>
      <h3>Authenticate with your passkey</h3>
      <p>Use your passkey to start a session.</p>
      <div className="flex justify-center">
        <LoadingButton
          className="btn btn-primary"
          isLoading={isCreatingSessionKey}
          onClick={createSessionKey}
        >
          Start new session
        </LoadingButton>
      </div>
      <p>
        <button disabled={isLoading} onClick={cancelPasskeyChoice}>
          <a>Use a different passkey</a>
        </button>
      </p>
    </>
  );

  return (
    <div className="flex flex-col items-center pt-48">
      <Card className="max-w-xl">
        <div className="prose">{contents}</div>
        {errorText && <div className="mt-2 text-error">{errorText}</div>}
      </Card>
      <div className="prose prose-lg mt-5">
        <Link href="/">Return home</Link>
      </div>
    </div>
  );
});
