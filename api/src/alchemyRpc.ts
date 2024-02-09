import axios from "axios";

import { ALCHEMY_URL, GAS_MANAGER_POLICY_ID } from "./constants";
import { JsonRpcRequest } from "./jsonRpc";

interface RequestGasAndPaymasterAndDataOptions {
  policyId: string;
  entryPoint: string;
  dummySignature: string;
  userOperation: object;
  overrides?: GasOverrides;
}

interface GasOverrides {
  maxFeePerGas?: GasOverride;
  maxPriorityFeePerGas?: GasOverride;
  callGasLimit?: GasOverride;
  verificationGasLimit?: GasOverride;
  preVerificationGas?: GasOverride;
}

type GasOverride = string | { percentage: number };

export async function forwardAlchemyRequest(
  request: JsonRpcRequest<any[]>
): Promise<unknown> {
  const { method, params } = request;
  // Free access to Gas Manager methods puts our funds at risk. Lock them down.
  if (method === "alchemy_requestPaymasterAndData") {
    throw new Error(
      "Worth of Words does not allow alchemy_requestPaymasterAndData. Use alchemy_requestGasAndPaymasterAndData instead."
    );
  }
  if (method === "alchemy_requestGasAndPaymasterAndData") {
    const options: RequestGasAndPaymasterAndDataOptions = { ...params[0] };
    validateOverrides(options.overrides);
    options.policyId = GAS_MANAGER_POLICY_ID;
    request = { ...request, params: [options] };
  }
  const response = await axios.post(ALCHEMY_URL, request);
  return response.data;
}

function validateOverrides(overrides: GasOverrides | undefined): void {
  if (overrides == null) {
    return;
  }

  const validatedKeys = new Set<keyof GasOverrides>();

  const validateOverridePercentage = (
    key: keyof GasOverrides,
    maxPercentage: number
  ): void => {
    validatedKeys.add(key);
    const override = overrides[key];
    if (override == null) {
      return;
    }
    if (typeof override !== "object") {
      throw new Error(`${key} override must be a percentage`);
    }
    if (override.percentage > maxPercentage) {
      throw new Error(
        `${key} override must be at most ${maxPercentage} percent`
      );
    }
  };

  validateOverridePercentage("maxFeePerGas", 150);
  validateOverridePercentage("maxPriorityFeePerGas", 105);
  validateOverridePercentage("preVerificationGas", 105);

  const invalidKey = Object.keys(overrides).find(
    (key) => !validatedKeys.has(key as keyof GasOverrides)
  );
  if (invalidKey) {
    throw new Error(`${invalidKey} override not allowed`);
  }
}
