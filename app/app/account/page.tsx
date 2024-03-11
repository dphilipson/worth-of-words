"use client";
import { MultiOwnerModularAccount } from "@alchemy/aa-accounts";
import { AuthParams } from "@alchemy/aa-alchemy";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FaAngleRight, FaFingerprint } from "react-icons/fa6";
import { privateKeyToAddress } from "viem/accounts";

import LoadingButton from "../_components/loadingButton";
import MainCard from "../_components/mainCard";
import OrDivider from "../_components/orDivider";
import TextInput from "../_components/textInput";
import titleImage from "../_images/title.png";
import unlockedAccountImage from "../_images/unlocked-account.png";
import { ABOUT_MODULAR_ACCOUNTS_URL } from "../_lib/constants";
import { useHasMounted, useIsLargeWindow } from "../_lib/hooks";
import { generatePasskeyName, useHideWelcomeBack } from "../_lib/login";
import {
  useFixedSearchParams,
  useRedirectTargetFromUrl,
} from "../_lib/loginRedirects";
import {
  addSessionKeyDeployingIfNeeded,
  createOwnerAccount,
  getAlchemySigner,
} from "../_lib/modularAccount";
import { randomBytes32 } from "../_lib/random";
import {
  useAccountAddress,
  useOwnerAddress,
  useSessionPrivateKey,
} from "../_lib/sessionKeyWallet";

enum AuthType {
  NONE,
  EMAIL,
  EMAIL_REDUX,
  NEW_PASSKEY,
  EXISTING_PASSKEY,
}

export default memo(function AccountPage(): ReactNode {
  const [email, setEmail] = useState("");
  const [inProgressAuthType, setInProgressAuthType] = useState(AuthType.NONE);
  const [errorText, setErrorText] = useState("");
  const [ownerAccount, setOwnerAccount] = useState<MultiOwnerModularAccount>();
  const [, setOwnerAddress] = useOwnerAddress();
  const [, setAccountAddress] = useAccountAddress();
  const [sessionPrivateKey, setSessionPrivateKey] = useSessionPrivateKey();
  const [, setHideWelcomeBack] = useHideWelcomeBack();
  const redirectTarget = useRedirectTargetFromUrl();
  const router = useRouter();
  const hasMounted = useHasMounted();
  const isLargeWindow = useIsLargeWindow();
  const searchParams = useFixedSearchParams();
  const cancelAuthRef = useRef(() => {});

  const authenticate = useMutation({
    mutationFn: async ({
      params,
      type,
    }: {
      params: AuthParams;
      type: AuthType;
    }) => {
      setErrorText("");
      let isCancelled = false;
      cancelAuthRef.current = () => (isCancelled = true);
      const signer = getAlchemySigner();
      setInProgressAuthType(type);
      await signer.authenticate(params);
      const ownerAccount = await createOwnerAccount(signer);
      if (isCancelled) {
        return;
      }
      setOwnerAddress(ownerAccount.address);
      setOwnerAccount(ownerAccount);
    },
    onError: (error) => {
      setInProgressAuthType(AuthType.NONE);
      if (error instanceof DOMException) {
        // This can indicate the user canceled out of the passkey flow.
        // Unfortunately we don't get a better indication than this.
        return;
      }
      if (
        typeof error === "string" &&
        (error as string).includes("decryption failed")
      ) {
        const platformGuess = isLargeWindow ? "in Safari" : "on iOS";
        setErrorText(
          `Login failed. Are you using private browsing ${platformGuess}? Email login isn't supported there yet, sorry!`,
        );
        return;
      }
      setErrorText(error.toString());
    },
  });

  // Extremely lazy, but the complexity related to local storage changing from
  // a different tab in the email magic link flow is not worth dealing with.
  const cancelEmailAuth = useCallback(() => window.location.reload(), []);

  const createSessionKey = useMutation({
    mutationFn: async () => {
      if (!ownerAccount) {
        throw new Error(
          "Cannot create session key before owner account is initialized.",
        );
      }
      const newSessionPrivateKey = randomBytes32();
      const sessionPublicKey = privateKeyToAddress(newSessionPrivateKey);
      await addSessionKeyDeployingIfNeeded({ ownerAccount, sessionPublicKey });
      setAccountAddress(ownerAccount.address);
      setSessionPrivateKey(newSessionPrivateKey);
      setHideWelcomeBack(true);
    },
  });

  const authenticateWithEmail = useCallback(() => {
    const redirectParams = new URLSearchParams({ redirect: redirectTarget });
    return authenticate.mutate({
      params: { type: "email", email, redirectParams },
      type: AuthType.EMAIL,
    });
  }, [authenticate, email, redirectTarget]);

  const authenticateWithNewPasskey = useCallback(
    () =>
      authenticate.mutate({
        params: {
          type: "passkey",
          createNew: true,
          username: generatePasskeyName(),
        },
        type: AuthType.NEW_PASSKEY,
      }),
    [authenticate],
  );

  const authenticateWithExistingPasskey = useCallback(
    () =>
      authenticate.mutate({
        params: {
          type: "passkey",
          createNew: false,
        },
        type: AuthType.EXISTING_PASSKEY,
      }),
    [authenticate],
  );

  const handleCreateSessionKeyClick = useCallback(
    () => createSessionKey.mutate(),
    [createSessionKey],
  );

  const bundle = searchParams.get("bundle");
  const orgId = searchParams.get("orgId");

  useEffect(() => {
    if (sessionPrivateKey && inProgressAuthType !== AuthType.EMAIL_REDUX) {
      router.replace(redirectTarget);
    } else if (bundle && orgId) {
      authenticate.mutate({
        params: { type: "email", bundle, orgId },
        type: AuthType.EMAIL_REDUX,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPrivateKey, bundle, inProgressAuthType]);

  const ownerAccountIsLoaded = !!ownerAccount;

  useEffect(() => {
    if (ownerAccountIsLoaded && inProgressAuthType === AuthType.EMAIL_REDUX) {
      createSessionKey.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerAccountIsLoaded, inProgressAuthType]);

  const canSubmitEmail = isValidEmail(email);

  if (!hasMounted) {
    return undefined;
  }

  switch (inProgressAuthType) {
    case AuthType.EMAIL:
      return (
        <MainCard
          title="Just one thing…"
          image={titleImage}
          imageAlt="Picture of creating a session key"
          imageHasPriority={true}
        >
          <p>Check your email and click the link to complete login.</p>
          <a className="cursor-pointer" onClick={cancelEmailAuth}>
            Go back
          </a>
        </MainCard>
      );
    case AuthType.EMAIL_REDUX:
      if (!sessionPrivateKey) {
        return (
          <MainCard
            title="Almost there…"
            image={unlockedAccountImage}
            imageAlt="Picture of an unlocked account"
            imageHasPriority={true}
          >
            <p>Completing login.</p>
          </MainCard>
        );
      }
      return (
        <MainCard
          title="You've unlocked your own modular account!"
          image={unlockedAccountImage}
          imageAlt="Picture of an unlocked account"
          imageHasPriority={true}
        >
          <p>
            Just like that, you&apos;re all set up with your own modular
            account, powered by ERC-6900. Have fun playing Worth of Words!
          </p>
          <Link className="btn btn-primary" href={redirectTarget}>
            Let&apos;s go!
          </Link>
          <p>
            <a href={ABOUT_MODULAR_ACCOUNTS_URL} target="_blank" rel="noopener">
              What&apos;s a modular account?
            </a>
          </p>
        </MainCard>
      );
    default:
      if (ownerAccount) {
        return (
          <MainCard
            title="You've unlocked your own modular account!"
            image={unlockedAccountImage}
            imageAlt="Picture of an unlocked account"
            imageHasPriority={true}
          >
            <p>
              Just like that, you&apos;re all set up with your own modular
              account, powered by ERC-6900. Have fun playing Worth of Words!
            </p>
            <LoadingButton
              className="btn btn-primary"
              isLoading={createSessionKey.isPending}
              onClick={handleCreateSessionKeyClick}
            >
              <FaFingerprint /> Start a new session
            </LoadingButton>
            <p>
              <a
                href={ABOUT_MODULAR_ACCOUNTS_URL}
                target="_blank"
                rel="noopener"
              >
                What&apos;s a modular account?
              </a>
            </p>
          </MainCard>
        );
      }
      return (
        <MainCard
          title="Just one thing…"
          image={titleImage}
          imageAlt="Picture of creating a session key"
          imageHasPriority={true}
        >
          <p>Log in with your email or a passkey.</p>
          <div className="flex w-full max-w-md space-x-1">
            <TextInput
              className="flex-1"
              type="email"
              placeholder="Enter email…"
              disabled={authenticate.isPending}
              disablePressEnter={!canSubmitEmail}
              value={email}
              onValueChange={setEmail}
              onPressEnter={authenticateWithEmail}
            />
            <button
              className="btn btn-primary flex-initial"
              disabled={!canSubmitEmail || authenticate.isPending}
              onClick={authenticateWithEmail}
            >
              Submit
            </button>
          </div>
          <OrDivider className="max-w-md" />
          <div className="flex flex-col justify-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <LoadingButton
              className="btn btn-primary btn-sm"
              disabled={authenticate.isPending}
              isLoading={inProgressAuthType === AuthType.NEW_PASSKEY}
              onClick={authenticateWithNewPasskey}
            >
              <FaFingerprint /> Create new passkey
            </LoadingButton>
            <LoadingButton
              className="btn btn-ghost btn-sm"
              onClick={authenticateWithExistingPasskey}
              disabled={authenticate.isPending}
              isLoading={inProgressAuthType === AuthType.EXISTING_PASSKEY}
            >
              Choose existing passkey <FaAngleRight />
            </LoadingButton>
          </div>
          {errorText && <p className="text-red-500">{errorText}</p>}
        </MainCard>
      );
  }
});

function isValidEmail(s: string): boolean {
  return !!s.match(/.+@.+\..+/);
}
