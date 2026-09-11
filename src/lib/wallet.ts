// Wallet plumbing.
//
// Two ways in, because a hackathon judge and a real trader want different
// things:
//
//   BURNER   a key generated in the browser and kept in localStorage. Zero
//            setup — open the page and you have an address. It still needs
//            testnet gas, so the UI links the Somnia faucet.
//   INJECTED an EIP-1193 wallet (MetaMask and friends), for anyone who wants
//            to play from an account they already fund.
//
// Neither path ever sends a key anywhere: the burner is signed with locally by
// the SDK, and the injected wallet signs in its own extension. The burner is
// explicitly disposable and the UI says so — it is for play money on testnet,
// not for holding value.

import { createWalletClient, custom, type Address, type WalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { NetworkConfig } from "./networks.ts";

const BURNER_KEY = "streak.burner.v1";

export type WalletKind = "burner" | "injected" | "imported";

export interface WalletConnection {
  kind: WalletKind;
  address: Address;
  /** Set for a burner — the SDK signs locally and sends in one round-trip. */
  privateKey?: `0x${string}`;
  /** Set for an injected wallet — the extension signs. */
  walletClient?: WalletClient;
}

/** The minimal EIP-1193 surface used here. */
interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

function injectedProvider(): Eip1193 | null {
  const eth = (globalThis as { ethereum?: Eip1193 }).ethereum;
  return eth ?? null;
}

export function hasInjectedWallet(): boolean {
  return injectedProvider() !== null;
}

function isHexKey(v: unknown): v is `0x${string}` {
  return typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v);
}

/**
 *  Load the stored burner key, or mint one. Storage is best-effort: a private
 *  window that refuses to persist still gets a working (if ephemeral) wallet
 *  rather than an error.
 */
export function loadOrCreateBurner(): `0x${string}` {
  try {
    const existing = localStorage.getItem(BURNER_KEY);
    if (isHexKey(existing)) return existing;
  } catch {
    /* storage unavailable — fall through and mint an ephemeral key */
  }
  const key = generatePrivateKey();
  try {
    localStorage.setItem(BURNER_KEY, key);
  } catch {
    /* ephemeral for this tab only; the address still works while it lives */
  }
  return key;
}

/** The stored burner key if one exists, without creating one. */
export function peekBurner(): `0x${string}` | null {
  try {
    const existing = localStorage.getItem(BURNER_KEY);
    return isHexKey(existing) ? existing : null;
  } catch {
    return null;
  }
}

/** Throw the burner away. The next connect mints a fresh one. */
export function clearBurner(): void {
  try {
    localStorage.removeItem(BURNER_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 *  Connect a key the user pasted in.
 *
 *  The burner is the zero-setup path, but it starts with no gas and the public
 *  faucet is captcha-gated, so there is no way to fund it from inside the app.
 *  Importing an already-funded key is the one route that lets someone play
 *  immediately, which matters most for a judge with thirty seconds of patience.
 *  The key is held in memory for the session only -- never written to storage.
 */
export function connectImported(privateKey: string): WalletConnection {
  const trimmed = privateKey.trim();
  const prefixed = (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as `0x${string}`;
  if (!isHexKey(prefixed)) {
    throw new Error("that is not a private key — expected 64 hex characters");
  }
  return {
    kind: "imported",
    address: privateKeyToAccount(prefixed).address,
    privateKey: prefixed,
  };
}

export function connectBurner(): WalletConnection {
  const privateKey = loadOrCreateBurner();
  return {
    kind: "burner",
    address: privateKeyToAccount(privateKey).address,
    privateKey,
  };
}

/**
 *  Connect an injected wallet, moving it onto the right Somnia network first.
 *  A wallet that has never seen the chain is offered it via
 *  `wallet_addEthereumChain` rather than being left on the wrong network.
 */
export async function connectInjected(network: NetworkConfig): Promise<WalletConnection> {
  const provider = injectedProvider();
  if (!provider) throw new Error("no browser wallet found — install one, or use a burner");

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as Address[];
  const address = accounts[0];
  if (!address) throw new Error("the wallet returned no account");

  await ensureChain(provider, network);

  const walletClient = createWalletClient({
    account: address,
    chain: network.chain,
    transport: custom(provider),
  });

  return { kind: "injected", address, walletClient };
}

/** Error code EIP-1193 uses for "this chain is unknown to the wallet". */
const CHAIN_NOT_ADDED = 4902;

async function ensureChain(provider: Eip1193, network: NetworkConfig): Promise<void> {
  const chainId = `0x${network.chain.id.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code !== CHAIN_NOT_ADDED) throw err;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: network.chain.name,
          nativeCurrency: network.chain.nativeCurrency,
          rpcUrls: network.chain.rpcUrls.default.http,
          blockExplorerUrls: [network.explorerUrl],
        },
      ],
    });
  }
}

/** 0x1234…abcd — addresses are shown truncated everywhere in the UI. */
export function shortAddress(address: string): string {
  return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
}
