// The two Somnia deployments STREAK talks to. Everything the exchange needs to
// boot lives here, so switching networks is one object swap rather than a
// scatter of env vars — the network picker in the UI reads straight off this.
//
// Addresses are NOT hand-copied: they come from the SDK's generated
// `SOMNIA_{MAINNET,TESTNET}_ADDRESSES`, which are stamped from the deployment
// manifests at SDK release time. Hand-copying an address is how a frontend
// drifts from the chain in silence.

import {
  SOMNIA_MAINNET_ADDRESSES,
  SOMNIA_TESTNET_ADDRESSES,
  type SomniaMarketsAddresses,
} from "@somnia-chain/markets-sdk";
import { somniaMainnet, somniaShannon } from "@somnia-chain/markets-sdk/chains";
import type { Chain } from "viem";

export type NetworkId = "testnet" | "mainnet";

export interface NetworkConfig {
  id: NetworkId;
  /** Display name for the network picker. */
  label: string;
  chain: Chain;
  /** Hasura/Envio indexer the SDK hydrates its snapshot from. */
  indexerUrl: string;
  /** WebSocket RPC the live tail materializes blocks from. */
  wsRpcUrl: string;
  addresses: SomniaMarketsAddresses;
  /** Block explorer root, for linking a fill to its transaction. */
  explorerUrl: string;
  /**
   *  Whether the venue's collateral is faucet-capable TestUSDC. Only testnet
   *  has one — the faucet button hides itself on mainnet rather than offering
   *  a call that always reverts.
   */
  hasFaucet: boolean;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  testnet: {
    id: "testnet",
    label: "Somnia Testnet",
    chain: somniaShannon,
    indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
    wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
    addresses: SOMNIA_TESTNET_ADDRESSES,
    explorerUrl: "https://shannon-explorer.somnia.network",
    hasFaucet: true,
  },
  mainnet: {
    id: "mainnet",
    label: "Somnia Mainnet",
    chain: somniaMainnet,
    indexerUrl: "https://prd.smk.somnia.host/v1/graphql",
    wsRpcUrl: "wss://api.infra.mainnet.somnia.network/ws",
    addresses: SOMNIA_MAINNET_ADDRESSES,
    explorerUrl: "https://explorer.somnia.network",
    hasFaucet: false,
  },
};

/** Testnet is the default so a first-time visitor can faucet and play. */
export const DEFAULT_NETWORK: NetworkId = "testnet";

export function isNetworkId(v: string | null | undefined): v is NetworkId {
  return v === "testnet" || v === "mainnet";
}

export function txUrl(net: NetworkConfig, hash: string): string {
  return `${net.explorerUrl}/tx/${hash}`;
}

export function addressUrl(net: NetworkConfig, address: string): string {
  return `${net.explorerUrl}/address/${address}`;
}
