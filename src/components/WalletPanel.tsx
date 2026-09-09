// Wallet and collateral.
//
// The burner path is the one that matters for a first-time visitor: one click
// and they have an address. It is honest about what it is — a throwaway key in
// this browser, for testnet play money — because pretending otherwise would
// invite someone to fund it.

import { useState } from "react";
import { addressUrl, type NetworkConfig } from "../lib/networks.ts";
import { hasInjectedWallet, shortAddress, type WalletConnection } from "../lib/wallet.ts";
import { formatAmount } from "../lib/format.ts";

interface Props {
  network: NetworkConfig;
  connection: WalletConnection | null;
  balance: number | null;
  symbol: string;
  demo: boolean;
  canFaucet: boolean;
  onConnectBurner(): void;
  onConnectInjected(): void;
  onDisconnect(): void;
  onFaucet(): Promise<void>;
}

export function WalletPanel({
  network,
  connection,
  balance,
  symbol,
  demo,
  canFaucet,
  onConnectBurner,
  onConnectInjected,
  onDisconnect,
  onFaucet,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function faucet() {
    setBusy(true);
    try {
      await onFaucet();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Collateral</span>
        {connection && (
          <button type="button" className="chip" onClick={onDisconnect}>
            disconnect
          </button>
        )}
      </div>

      <div className="wallet-body">
        <div className="balance">
          <span className="balance-value">{balance == null ? "—" : formatAmount(balance)}</span>
          <span className="balance-unit">{symbol}</span>
        </div>

        {demo ? (
          <>
            <p className="note">
              Simulation mode — this is play money and no transaction is sent. Switch to live to
              trade the real contracts.
            </p>
            {canFaucet && (
              <div className="btn-row">
                <button type="button" className="btn" onClick={faucet} disabled={busy}>
                  Top up play balance
                </button>
              </div>
            )}
          </>
        ) : connection ? (
          <>
            <div className="addr">
              <a href={addressUrl(network, connection.address)} target="_blank" rel="noreferrer">
                {shortAddress(connection.address)}
              </a>
              {connection.kind === "burner" && " · burner"}
            </div>

            {canFaucet && (
              <div className="btn-row">
                <button type="button" className="btn primary" onClick={faucet} disabled={busy}>
                  {busy ? "Minting…" : `Mint test ${symbol}`}
                </button>
              </div>
            )}

            <p className="note">
              Orders are signed {connection.kind === "burner" ? "locally" : "by your wallet"} and
              settle on {network.label}.
              {network.hasFaucet && (
                <>
                  {" "}
                  Transactions need testnet SOMI for gas — grab some from the{" "}
                  <a href="https://testnet.somnia.network/" target="_blank" rel="noreferrer">
                    Somnia faucet
                  </a>{" "}
                  if a bet is rejected for funds.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <div className="btn-row">
              <button type="button" className="btn primary" onClick={onConnectBurner}>
                Play with a burner
              </button>
              <button
                type="button"
                className="btn"
                onClick={onConnectInjected}
                disabled={!hasInjectedWallet()}
                title={hasInjectedWallet() ? undefined : "No browser wallet detected"}
              >
                Connect wallet
              </button>
            </div>
            <p className="note">
              The burner is a throwaway key generated in this browser and kept in local storage.
              It is for testnet play — never send it anything you care about.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
