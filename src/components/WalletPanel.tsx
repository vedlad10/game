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
  /** Native gas balance. Zero here is why every write fails. */
  gas: number | null;
  symbol: string;
  demo: boolean;
  canFaucet: boolean;
  onConnectBurner(): void;
  onImportKey(privateKey: string): void;
  onConnectInjected(): void;
  onDisconnect(): void;
  onFaucet(): Promise<void>;
}

export function WalletPanel({
  network,
  connection,
  balance,
  gas,
  symbol,
  demo,
  canFaucet,
  onConnectBurner,
  onImportKey,
  onConnectInjected,
  onDisconnect,
  onFaucet,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  // Only a live wallet that has actually been read can be known to be empty;
  // null means "not read yet" and must not raise a false alarm.
  const outOfGas = !demo && connection !== null && gas !== null && gas <= 0;

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

            <div className="gas-line">
              <span>gas</span>
              <b className="num">{gas == null ? "—" : gas.toFixed(4)}</b>
              <span>{network.gasSymbol}</span>
            </div>

            {outOfGas && (
              <div className="gas-warn">
                <b>This wallet has no {network.gasSymbol}.</b> Every transaction — including
                minting collateral — needs gas, so nothing will send until you fund it.
                {network.gasFaucetUrl && (
                  <>
                    {" "}
                    <a href={network.gasFaucetUrl} target="_blank" rel="noreferrer">
                      Get {network.gasSymbol} from the Somnia faucet
                    </a>
                    , paste the address above, then come back.
                  </>
                )}
              </div>
            )}

            {canFaucet && (
              <div className="btn-row">
                <button
                  type="button"
                  className="btn primary"
                  onClick={faucet}
                  disabled={busy || outOfGas}
                  title={outOfGas ? `Needs ${network.gasSymbol} for gas first` : undefined}
                >
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
                  Transactions need testnet STT for gas — request it from the{" "}
                  <a href="https://testnet.somnia.network/" target="_blank" rel="noreferrer">
                    Somnia testnet faucet
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
            {importing ? (
              <>
                <input
                  className="key-input"
                  type="password"
                  placeholder="0x… private key of a funded testnet wallet"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      onImportKey(keyInput);
                      setKeyInput("");
                    }}
                    disabled={keyInput.trim().length === 0}
                  >
                    Use this key
                  </button>
                  <button type="button" className="btn" onClick={() => setImporting(false)}>
                    Cancel
                  </button>
                </div>
                <p className="note">
                  Held in memory for this session only — never written to storage and never sent
                  anywhere. Use a testnet key, never one that holds real value.
                </p>
              </>
            ) : (
              <>
                <div className="btn-row">
                  <button type="button" className="btn" onClick={() => setImporting(true)}>
                    Import a funded key
                  </button>
                </div>
                <p className="note">
                  The burner is a throwaway key generated in this browser and kept in local
                  storage. It starts with no {network.gasSymbol}, so you will need to fund it from
                  the faucet before it can trade — importing an already-funded testnet key is the
                  fastest way to play right now.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
