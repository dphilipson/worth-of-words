import { TurnkeyApiTypes } from "@turnkey/http";

export type TAttestation = TurnkeyApiTypes["v1Attestation"];

export interface CreateSubOrgWithPrivateKeyRequest {
  subOrgName: string;
  challenge: string;
  attestation: TAttestation;
}

export interface WalletDetails {
  id: string;
  name: string;
  address: string;
  subOrgId: string;
}
