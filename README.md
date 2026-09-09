# STREAK

**The one-tap Up/Down arcade for Somnia Event Contracts.**

Built for the Somnia × dreamDEX Event Contracts Hackathon.

STREAK turns a rolling up/down series into a game you can play in ten seconds:
pick a side, watch the countdown, keep your streak alive. Every tap is a real
IOC order on a real binary pool. There is no backend, no database, and no
paper-trading mode pretending to be real — the arcade either trades the chain
or tells you plainly that it is running a simulation.

---

## Why this, for this hackathon

The hackathon's stated goal is to **accelerate adoption of Event Contracts**.
Adoption is a distribution problem, not a features problem: the order book, the
oracle, and the settlement layer already work. What is missing is a surface that
someone who has never placed a limit order will actually use.

Prediction markets ask a new user to price a probability. STREAK asks them to
pick a direction and watch a clock. Underneath, those are the same action — a
market buy of a YES or NO outcome token — but only one of them survives contact
with a first-time user.

The fit with Somnia is not incidental. Sub-second blocks are what make a 1-minute
round feel like a game rather than a form submission: the order confirms inside
the round you placed it in. On a slow chain this product does not exist.

## What it actually does

| | |
|---|---|
| **Discovers rounds** | `listBinaryMarkets({ orderBy: "closingSoon" })`, grouped into rolling series by asset and cadence (1m / 5m / 15m / …) |
| **Prices the sides** | the live four-sided book, materialized locally from chain logs — `getLiveBinaryOrderBook(pool)` |
| **Charts the round** | the on-chain EMA price oracle via `watchPrice` / `getLivePriceTicks` |
| **Finds the level** | `getOpeningPrices([marketId])` — the reference answer an up/down market resolves against |
| **Places the bet** | `createOrder(symbol, "market", "buy", shares, …, { timeInForce: "IOC" })` |
| **Settles** | `redeem(symbol, shares)` against the settlement singleton, automatically, when the round resolves |

All of it through [`@somnia-chain/markets-sdk`](https://www.npmjs.com/package/@somnia-chain/markets-sdk),
with contract addresses read from the SDK's generated constants rather than
copied by hand.

## Three things that make it different

### 1. Your score is derived from the chain, not stored on a server

There is no backend. A player's rank, XP, streak and PnL are a **pure function**
of their settled bets, and every settled bet is an on-chain fill plus an
oracle-resolved outcome. Replay the same fills and you get the same number —
anyone can verify a score without trusting us, because there is no "us" to
trust. `src/game/scoring.ts` is that function, and it is 200 lines with no
imports.

### 2. The score rewards being right when the market was not

XP is weighted by the **entry probability**, which on a binary market is just
the price you paid. Winning a side the book priced at 0.25 scores far more than
winning one it priced at 0.95. Betting big on a near-certainty is not skill, and
a leaderboard that pays for volume just rewards whoever had the most collateral.

```
xp = 100 × (0.5 + (1 − entryProbability)) × streakMultiplier
```

The streak multiplier grows a quarter per consecutive win and caps at 3×, so a
run is worth protecting but cannot run away.

### 3. It degrades honestly instead of dying

If the indexer or RPC is unreachable, the arcade mounts a deterministic
simulation and says so in a banner and a badge — it never renders simulated
numbers as chain data. The two sources implement the same `ArcadeSource`
interface, so the entire UI is written once and neither mode is a second-class
citizen. Round boundaries in the simulation use the same
`floor(now / cadence) × cadence` rule as a real series, so rollover exercises
the identical code path.

## Try it

**Live demo:** https://vedlad10.github.io/game/

- `?mode=demo` — play the simulation, no wallet, no chain
- `?network=mainnet` — point at Somnia mainnet instead of testnet

Fastest path on testnet:

1. Open the demo, click **Play with a burner** — a throwaway key is generated in
   your browser. It is disposable and labelled as such; never fund it with
   anything real.
2. Get testnet **STT** for gas from the [Somnia testnet faucet](https://testnet.somnia.network/)
   (the hackathon Telegram also hands out STT).
3. Click **Mint test USDC** for collateral.
4. Pick a side before the countdown hits zero.

Or connect a browser wallet — STREAK will offer to add the Somnia network if it
does not have it.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:5173/game/
npm test           # 58 unit tests, no network required
npm run typecheck
npm run build
```

## How it is put together

```
src/
  game/scoring.ts     score from settled bets (pure, no imports)
  lib/
    rounds.ts         rolling series → game rounds (pure)
    types.ts          the ArcadeSource contract both modes satisfy
    liveSource.ts     the real integration: SDK, book, oracle, orders, redeem
    demoSource.ts     the seeded simulation
    store.ts          derived state, bet lifecycle, settlement
    wallet.ts         burner + injected wallet
    networks.ts       testnet/mainnet config from the SDK's constants
  components/         round card, chart, score, tickets, history, wallet
  hooks/useArcade.ts  React binding + the live→demo fallback
```

The split that carries the design: **sources produce raw facts, the store owns
everything derived.** A source reports markets, prices and fills; the store
decides which round is live, which bets have settled, and what the score is.
That is why adding the simulation cost one file and zero changes to the UI.

### Two decisions worth calling out

**Round phase comes from timestamps, not `status`.** The SDK documents that the
Listed → Trading → Settling transitions are timestamp-implicit and emit no
event, so a market's `status` field can lag the wall clock. Only the terminal
Resolved / Voided states emit, so those are the only ones trusted from `status`.
Getting this backwards shows up as an arcade that lets you bet on a closed round.

**A stake is a collateral budget; `createOrder` sizes in outcome tokens.** The
book is walked to convert one into the other, then the fills decoded from the
placement give the true average entry — which is what the score uses, not the
pre-trade estimate.

## Testing

58 unit tests over the logic that can be verified without a chain: round phase
boundaries, overlapping trading windows, series grouping, streak and void
handling, rank progression, book walking with thin and malformed levels, and
volume-weighted fill pricing including the NO-side complement.

The end-to-end game loop was verified in a real browser: place a bet, roll past
the round boundary, and watch it settle, pay out, advance the streak and move
the balance.

## Status and limits

- The **live path is written against the SDK's documented API and typechecks
  against its real types**, but it was developed in a sandbox without network
  access to Somnia, so the live path has not been exercised against a running
  venue. The simulation path is fully verified end to end. Anyone running this
  against testnet should expect to shake out integration details.
- A burner wallet needs testnet STT for gas; the collateral faucet mints tUSDC,
  not gas. The UI says so.
- Bets are cached in `localStorage` so a refresh does not lose a session. The
  score is derived, so clearing it loses history, not standing.

## Hackathon resources this was built against

- SDK: [`@somnia-chain/markets-sdk`](https://www.npmjs.com/package/@somnia-chain/markets-sdk)
  — the same package the official
  [starter template](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template) pins
- [DreamDEX Event Contracts docs](https://docs.dreamdex.io/developers/event-contracts)
- [DreamDEX Bot Kit](https://github.com/somnia-chain/dreamdex-bot-kit)
- Shannon testnet, chain `50312`; collateral tUSDC; gas STT

[`FEEDBACK.md`](./FEEDBACK.md) is our SDK and documentation feedback report —
seven concrete points of friction and four things that worked unusually well.

## Credits

The original Ring Runner game that lived in this repo is preserved at
[`/legacy/`](https://vedlad10.github.io/game/legacy/).

MIT.
