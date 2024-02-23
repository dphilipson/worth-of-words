"use client";
import { useMutation } from "@tanstack/react-query";
import { memo, ReactNode, useState } from "react";
import { privateKeyToAccount } from "viem/accounts";

import Card from "../_components/card";
import TextInput from "../_components/textInput";
import { useHasMounted } from "../_lib/hooks";
import { useSessionPrivateKey } from "../_lib/sessionKeyWallet";

export default memo(function SignPage(): ReactNode {
  const [message, setMessage] = useState("");
  const [sessionPrivateKey] = useSessionPrivateKey();
  const [signedMessage, setSignedMessage] = useState("");
  const hasMounted = useHasMounted();

  const { mutate } = useMutation({
    mutationFn: async () => {
      if (!sessionPrivateKey) {
        throw new Error("No private key");
      }
      const account = privateKeyToAccount(sessionPrivateKey);
      const signedMessage = await account.signMessage({ message });
      setSignedMessage(signedMessage);
    },
  });

  return (
    <Card className="space-y-4 text-center sm:mt-16 lg:p-16">
      <h3>Sign a message to prove identity</h3>
      <TextInput
        value={message}
        onValueChange={setMessage}
        onEnter={mutate}
        placeholder="Enter message…"
      />
      <button
        className="btn btn-primary"
        disabled={hasMounted && !sessionPrivateKey}
        onClick={() => mutate()}
      >
        {!hasMounted || sessionPrivateKey ? "Sign message" : "Not logged in"}
      </button>
      {signedMessage && (
        <div className="text-left">
          <h4>Your signed message</h4>
          <div className="break-words rounded-lg border-2 p-2">
            {signedMessage}
          </div>
        </div>
      )}
    </Card>
  );
});
