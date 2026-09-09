// The player's tickets, newest first.
//
// Every row carries the entry probability, because that is what the score is
// computed from — a player who cannot see the price they got cannot tell why a
// win paid what it paid.

import { formatAmount, formatAgo, formatProbability, formatSigned } from "../lib/format.ts";
import { intervalLabel } from "../lib/rounds.ts";
import { txUrl, type NetworkConfig } from "../lib/networks.ts";
import type { PlacedBet } from "../lib/types.ts";

interface Props {
  bets: PlacedBet[];
  nowSec: number;
  symbol: string;
  network: NetworkConfig;
  /** Demo bets have no transaction to link to. */
  linkTransactions: boolean;
}

export function BetList({ bets, nowSec, symbol, network, linkTransactions }: Props) {
  const recent = [...bets].reverse().slice(0, 12);

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Your tickets</span>
        <span className="panel-title" style={{ letterSpacing: 0 }}>
          {bets.length}
        </span>
      </div>

      {recent.length === 0 ? (
        <p className="empty">
          No tickets yet.
          <br />
          Pick a side on the live round to open one.
        </p>
      ) : (
        <div className="rows">
          {recent.map((bet) => (
            <BetRow
              key={bet.id}
              bet={bet}
              nowSec={nowSec}
              symbol={symbol}
              network={network}
              linkTransactions={linkTransactions}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BetRow({
  bet,
  nowSec,
  symbol,
  network,
  linkTransactions,
}: {
  bet: PlacedBet;
  nowSec: number;
  symbol: string;
  network: NetworkConfig;
  linkTransactions: boolean;
}) {
  const settled = bet.status === "won" || bet.status === "lost" || bet.status === "void";
  const net = settled ? (bet.payout ?? 0) - bet.stake : null;

  return (
    <div className="row">
      <span className={`row-dir ${bet.direction === "UP" ? "up" : "down"}`}>
        {bet.direction === "UP" ? "▲ UP" : "▼ DN"}
      </span>

      <div className="row-main">
        <div>
          {bet.asset} <span style={{ color: "var(--faint)" }}>{intervalLabel(bet.intervalSec)}</span>
          {" · "}
          <span className="num">{formatAmount(bet.stake)}</span> {symbol}
        </div>
        <div className="row-sub">
          {bet.status === "failed" ? (
            <span style={{ color: "var(--down)" }}>{bet.error ?? "order rejected"}</span>
          ) : bet.status === "pending" ? (
            "submitting…"
          ) : (
            <>
              entry {formatProbability(bet.entryProbability)} · {formatAgo(
                Math.floor(bet.placedAt / 1000),
                nowSec,
              )}
              {linkTransactions && bet.txHash && (
                <>
                  {" · "}
                  <a href={txUrl(network, bet.txHash)} target="_blank" rel="noreferrer">
                    tx
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <span className={`tag ${bet.status}`}>{bet.status}</span>
        {net !== null && (
          <div
            className="row-sub"
            style={{ color: net > 0 ? "var(--up)" : net < 0 ? "var(--down)" : undefined }}
          >
            {formatSigned(net)}
          </div>
        )}
      </div>
    </div>
  );
}
