// STREAK — the app shell.
//
// Composition only: the store owns state, the sources own I/O, and this file
// wires them to the panels and holds the handful of things that are genuinely
// view state (which stake preset is selected, which network, the error toast).

import { useCallback, useMemo, useState } from "react";
import { useArcade, type ModePreference } from "./hooks/useArcade.ts";
import { RoundCard } from "./components/RoundCard.tsx";
import { ScorePanel } from "./components/ScorePanel.tsx";
import { BetList } from "./components/BetList.tsx";
import { HistoryStrip } from "./components/HistoryStrip.tsx";
import { WalletPanel } from "./components/WalletPanel.tsx";
import { DEFAULT_NETWORK, NETWORKS, isNetworkId, type NetworkId } from "./lib/networks.ts";
import {
  clearBurner,
  connectBurner,
  connectImported,
  connectInjected,
  type WalletConnection,
} from "./lib/wallet.ts";
import { intervalLabel, type Direction } from "./lib/rounds.ts";

/** Read the initial network from the URL so a demo link can pin one. */
function initialNetwork(): NetworkId {
  const fromUrl = new URLSearchParams(globalThis.location?.search ?? "").get("network");
  return isNetworkId(fromUrl) ? fromUrl : DEFAULT_NETWORK;
}

function initialPreference(): ModePreference {
  return new URLSearchParams(globalThis.location?.search ?? "").get("mode") === "demo"
    ? "demo"
    : "auto";
}

export default function App() {
  const [networkId, setNetworkId] = useState<NetworkId>(initialNetwork);
  const [preference, setPreference] = useState<ModePreference>(initialPreference);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [stake, setStake] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const network = NETWORKS[networkId];
  const arcade = useArcade({ network, connection, preference });
  const { state } = arcade;

  // A failed order used to auto-dismiss after seven seconds. That hid the one
  // message that explains why nothing works -- an empty gas balance -- so the
  // app looked broken rather than unfunded. Errors now stay until dismissed.

  const onBet = useCallback(
    (direction: Direction) => {
      void arcade.bet(direction, stake).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
    },
    [arcade, stake],
  );

  const onConnectInjected = useCallback(() => {
    void connectInjected(network)
      .then(setConnection)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, [network]);

  const onDisconnect = useCallback(() => {
    setConnection(null);
  }, []);

  const demo = state.mode === "demo";
  const seriesTabs = useMemo(() => state.series.slice(0, 8), [state.series]);

  return (
    <div className="shell">
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark">STREAK</span>
          <span className="brand-sub">up/down event contracts on Somnia</span>
        </div>

        <div className="masthead-right">
          <span className="chip" title={demo ? "Simulated data" : "Live on-chain data"}>
            <span className={`dot ${demo ? "sim" : state.status === "ready" ? "live" : "off"}`} />
            {demo ? "SIMULATION" : state.status === "ready" ? "LIVE" : "CONNECTING"}
          </span>

          {(Object.keys(NETWORKS) as NetworkId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`chip${id === networkId && !demo ? " on" : ""}`}
              onClick={() => {
                setPreference("auto");
                setNetworkId(id);
              }}
            >
              {NETWORKS[id].label.replace("Somnia ", "")}
            </button>
          ))}

          <button
            type="button"
            className={`chip${preference === "demo" ? " on" : ""}`}
            onClick={() => setPreference((p) => (p === "demo" ? "auto" : "demo"))}
            title="Play the simulation without touching the chain"
          >
            Demo
          </button>
        </div>
      </header>

      {state.notice && <div className="banner">{state.notice}</div>}
      {state.status === "error" && !state.notice && (
        <div className="banner bad">Could not reach {network.label}.</div>
      )}

      {seriesTabs.length > 1 && (
        <div className="masthead-right" style={{ marginBottom: 16 }}>
          {seriesTabs.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`chip${s.key === state.activeSeries ? " on" : ""}`}
              onClick={() => arcade.selectSeries(s.key)}
            >
              {s.asset} {intervalLabel(s.intervalSec)}
            </button>
          ))}
        </div>
      )}

      <div className="grid">
        <div className="stack">
          <RoundCard
            state={state}
            stake={stake}
            onStake={setStake}
            onBet={onBet}
            quote={arcade.quote}
          />
          <HistoryStrip rounds={state.history} />
        </div>

        <div className="stack">
          <ScorePanel score={state.score} symbol={state.collateralSymbol} />
          <WalletPanel
            network={network}
            connection={connection}
            balance={state.balance}
            symbol={state.collateralSymbol}
            demo={demo}
            canFaucet={arcade.canFaucet}
            onConnectBurner={() => setConnection(connectBurner())}
            onImportKey={(key) => {
              try {
                setConnection(connectImported(key));
                setError(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              }
            }}
            gas={state.gas}
            onConnectInjected={onConnectInjected}
            onDisconnect={() => {
              onDisconnect();
              clearBurner();
            }}
            onFaucet={async () => {
              try {
                await arcade.faucet();
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              }
            }}
          />
          <BetList
            bets={state.bets}
            nowSec={state.nowSec}
            symbol={state.collateralSymbol}
            network={network}
            linkTransactions={!demo}
          />
        </div>
      </div>

      <footer className="footer">
        <span>
          Every tap is a real IOC order on a Somnia binary pool via{" "}
          <a href="https://www.npmjs.com/package/@somnia-chain/markets-sdk" target="_blank" rel="noreferrer">
            @somnia-chain/markets-sdk
          </a>
          . No backend — your score is derived from your settled bets.
        </span>
        <span>
          <a href="legacy/">ring runner</a> · built for the Somnia × dreamDEX Event Contracts
          hackathon
        </span>
      </footer>

      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button type="button" className="toast-close" onClick={() => setError(null)}>
            dismiss
          </button>
        </div>
      )}
    </div>
  );
}
