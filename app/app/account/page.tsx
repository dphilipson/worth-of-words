"use client";
import { useMutation } from "@tanstack/react-query";
import { memo, ReactNode, useCallback, useEffect, useState } from "react";
import { FaAngleRight, FaFingerprint } from "react-icons/fa6";
import { privateKeyToAddress } from "viem/accounts";

import LoadingButton from "../_components/loadingButton";
import MainCard from "../_components/mainCard";
import createPasskeyImage from "../_images/unlocked-account.png";
import unlockedAccountImage from "../_images/unlocked-account.png";
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
  useHideWelcomeBack,
  useTurnkeyDetails,
} from "../_lib/turnkey";

export default memo(function AccountPage(): ReactNode {
  const [details, setDetails] = useTurnkeyDetails();
  const [, setAccountAddress] = useAccountAddress();
  const [sessionPrivateKey, setSessionPrivateKey] = useSessionPrivateKey();
  const [errorText, setErrorText] = useState("");
  const [, setHideWelcomeBack] = useHideWelcomeBack();

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
        setHideWelcomeBack(true);
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

  return !details ? (
    <MainCard
      title="Just one thing…"
      image={createPasskeyImage}
      imageAlt="Picture of creating a session key"
      imageHasPriority={true}
    >
      <p>
        Worth of Words uses passkeys so you can secure your account without a
        password or any other additional information.
      </p>
      <div className="flex flex-col justify-center space-x-2 sm:flex-row">
        <button
          className="btn btn-primary"
          onClick={createPasskey}
          disabled={isLoading}
        >
          <FaFingerprint /> Create new passkey
        </button>
        <button
          className="btn btn-ghost"
          onClick={chooseExistingPasskey}
          disabled={isLoading}
        >
          Choose existing passkey <FaAngleRight />
        </button>
      </div>
    </MainCard>
  ) : (
    <MainCard
      title="You've unlocked your own modular account!"
      image={unlockedAccountImage}
      imageAlt="Picture of an unlocked account"
      imageHasPriority={false}
    >
      <p>
        Just like that, you&apos;re all set up with your own modular account,
        powered by ERC-6900. Have fun playing Worth of Words!
      </p>
      <LoadingButton
        className="btn btn-primary"
        isLoading={isCreatingSessionKey}
        onClick={createSessionKey}
      >
        <FaFingerprint /> Start a new session
      </LoadingButton>
      <p>
        <a>What&apos;s a modular account?</a>
      </p>
    </MainCard>
  );
});
