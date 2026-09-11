# BUIDL submission copy

Paste-ready text for the DoraHacks submission form. Trim from the bottom if the
field is short — it is ordered so the first three paragraphs carry the pitch on
their own.

---

## Name

```
STREAK
```

## Tagline / one-liner

```
The one-tap Up/Down arcade for Somnia Event Contracts. Every tap is a real IOC order on a real binary pool.
```

## Short description (if there is a separate short field)

```
Prediction markets ask newcomers to price a probability. STREAK asks them to pick
a direction before a 60-second clock — the same on-chain trade, a question anyone
can answer. Verified live on Shannon testnet with real orders filling on chain.
```

---

## Full description

```
THE PROBLEM

Event Contracts have a distribution problem, not a technology problem. The order
book works, the oracle works, settlement works. What's missing is a surface that
someone who has never traded will actually use.

The barrier is one specific question. A prediction market asks a newcomer to
price a probability — "YES is at 0.62, is that cheap?" Answering needs a
calibrated view AND an understanding of what the price implies. Most people
can't, and won't try. That single question filters out almost everyone who isn't
already a trader.

STREAK asks a different question over the same trade: up or down, before the
clock hits zero? Underneath it is identical — a market buy of a YES or NO outcome
token on the same binary pool — but only one of those framings survives contact
with a first-time user. The trade doesn't need to change. The question does.

WHAT IT IS

A rolling Up/Down series becomes a game. Each market is a round with a countdown,
a live price chart against the level that decides it, and two buttons carrying
the payout multiple. Tap UP to buy YES, DOWN to buy NO. The multiples come from
walking the live order book, not from a house-set payout. A tap sends a market
IOC order to that round's binary pool, signed locally and confirmed in one
round-trip. When the oracle resolves the round, the position redeems
automatically and the result folds into your streak.

It ships with a burner wallet (one click, no setup), an injected-wallet path, and
key import, plus the testnet collateral faucet — so a judge can go from landing
page to placing an order without reading anything.

THREE THINGS THAT MAKE IT DIFFERENT

1. No backend. Rank, streak and PnL are a pure function of settled bets, and
   every settled bet is an on-chain fill plus an oracle-resolved outcome. Replay
   the same fills and you get the same number. Anyone can verify a score without
   trusting a server, because there is no server.

2. Scoring rewards being right when the market was wrong. XP is weighted by the
   price you got in at — winning a side the book called at 25% pays far more than
   winning one it called at 95%. A leaderboard that counts volume just rewards
   whoever had the most capital.

3. It degrades honestly. If the indexer or RPC is unreachable, the arcade mounts
   a clearly-labelled simulation and says why in a banner. It never renders
   simulated numbers as chain data.

TECHNICAL IMPLEMENTATION

Built on @somnia-chain/markets-sdk — the same package the official hackathon
starter template pins — on Shannon testnet, chain 50312, tUSDC collateral.
Contract addresses come from the SDK's generated constants, never hand-copied.

  discovery   listBinaryMarkets({ orderBy: "newest" })
  odds        watchMarket -> getLiveBinaryOrderBook, with an RPC snapshot floor
  price       watchPrice -> the on-chain EMA oracle
  reference   strike for fixed-mode markets, getOpeningPrices for reference-mode
  bet         createOrder(symbol, "market", "buy", shares, IOC)
  settle      redeem(symbol, shares)

Handles both kinds of Event Contract the venue actually runs: fixed-strike ("at
or above 77305.31") and reference-mode ("at or above its opening price").

PROVEN ON-CHAIN, NOT JUST TYPECHECKED

A real IOC order filled on Shannon:
  BTC-0-11SEP26-0705/tUSDC#YES — 3.824 shares @ 0.55 — status closed
  0xc9c14b6280ce2b0ac128f7f64f898eaa7dcac8ab16b3075f9bbbd940536311bc

`npm run preflight` drives the real integration against the venue in ten
dependency-ordered steps and prints what it finds, so anyone can reproduce the
verification. 77 offline unit tests cover the pure logic.

The project was built without network access to Somnia, so the first live run
found seven bugs that typechecking could never catch — discovery ordering that
returned only long-settled rounds, series keys fragmented by cadence jitter, an
unconfigured price oracle, fixed-strike markets treated as reference-mode, a
chart projection that assumed the oracle's tape ran oldest-first, odds that
depended on a websocket that sometimes never hydrated, and an empty gas balance
surfacing as "Missing or invalid parameters". Each is a commit with its
measurement in the message.

ECOSYSTEM IMPACT

Analytics tools serve people already inside the funnel. STREAK is aimed at the
top of it: it converts a probability-pricing task into a direction-picking one,
which is the argument for new users and new trading activity on Event Contracts.
The 1-minute cadence is only playable because Somnia's sub-second blocks confirm
an order inside the round it was placed in — on a slow chain this product does
not exist.

HONEST LIMITS

Liquidity is a venue property: a quiet testnet round can be one-sided, and the UI
disables that side rather than showing a price it cannot fill. Gas onboarding is
unsolved and not solvable from inside the app — the Somnia faucet is
captcha-gated with no API — so the app detects an empty balance, names it, and
links the faucet instead of failing with a contract error. Not audited; testnet
is the default for a reason.
```

---

## Tech stack field

```
TypeScript · React 19 · Vite · viem · @somnia-chain/markets-sdk · Somnia Shannon (chain 50312) · GitHub Pages · Vitest
```

## Links

```
Live demo   https://vedlad10.github.io/game/
GitHub      https://github.com/vedlad10/game
Demo video  <paste your YouTube link>
On-chain    https://shannon-explorer.somnia.network/tx/0xc9c14b6280ce2b0ac128f7f64f898eaa7dcac8ab16b3075f9bbbd940536311bc
SDK feedback report  https://github.com/vedlad10/game/blob/main/FEEDBACK.md
```

## Tracks to tag

- Consumer-facing trading application (primary)
- Social / gamified prediction product

## Optional deliverable — mention it explicitly

The hackathon invites an optional SDK and documentation feedback report.
`FEEDBACK.md` is that report: seven concrete points of friction found while
integrating (including that the SDK README links nine `docs/*.md` pages that are
not in the published npm tarball) and four things that worked unusually well.
Judges rarely get this, and it costs nothing to point at.
