# Submission notes

Working notes for the DoraHacks BUIDL entry. Not part of the app.

## The pitch, in three sentences

Event Contracts already work — the book, the oracle and settlement are all
there. What is missing is a surface a first-time user will actually touch, and
"pick UP or DOWN before the clock runs out" is that surface. STREAK is a real
trading client wearing an arcade cabinet: one tap is one IOC order on one binary
pool, and the score it keeps is derived from the chain rather than from a
server.

## Demo video script (~2 minutes)

Record at 1440×900 or larger, browser zoom 100%, dark room. Two takes are
easier than one: record the simulation take first so the pacing is under your
control, then the live take.

**0:00 — 0:15 · The hook**
Open on the arcade with a 1m round mid-flight. Say: *"This is a real Somnia
event contract. One minute, BTC up or down. The clock is the whole product."*
Let the countdown tick visibly. Do not talk over the first five seconds.

**0:15 — 0:40 · One tap**
Point at the two buttons: *"1.56× if UP, 2.57× if DOWN — that's the live order
book, not a house-set payout."* Tap UP. Show the ticket appearing with its entry
probability. Say: *"That was a market IOC order on the binary pool. The price I
paid is the market's implied probability, and that number is what my score is
computed from."*

**0:40 — 1:05 · Settlement**
Let the round expire on camera. Show the ticket flip to **won**, the payout land,
the streak advance and the balance move. Say: *"The oracle resolved it, the
position redeemed automatically, and my streak went up. No backend touched
that."*

**1:05 — 1:30 · The scoring idea**
Point at the XP number. Say: *"XP is weighted by the price I got in at. Winning a
side the book called at 25% pays far more than winning one it called at 95% —
so the ladder rewards being right when the market was wrong, not just having the
most collateral. And because it's a pure function of settled bets, anyone can
recompute my score from chain data."*

**1:30 — 1:50 · Breadth**
Click through the series pills — BTC 1m, ETH 15m. Say: *"Every rolling series on
the venue shows up automatically; new rounds appear as the series mints them."*
Show mobile briefly if there is time.

**1:50 — 2:00 · Close**
Show the burner-wallet button. Say: *"One click gives you an address, the faucet
gives you collateral, and you're trading event contracts in under a minute.
That's the adoption gap this closes."*

## Things to have ready before recording

- [ ] Testnet SOMI in the wallet for gas (the collateral faucet does not mint gas)
- [ ] Test USDC minted
- [ ] A 1m series with resting liquidity on both sides — a one-sided book shows
      "no liquidity" and disables that button, which is correct but reads badly
      on camera
- [ ] Browser console closed, no extensions bar
- [ ] `?mode=demo` in a second tab as a fallback if the venue is quiet

## Submission checklist

- [ ] GitHub repo link (public)
- [ ] Live demo link — https://vedlad10.github.io/game/
- [ ] Demo video (YouTube or Loom, unlisted is usually fine)
- [ ] Description: lead with the adoption argument, not the tech stack
- [ ] Screenshots: the round card mid-countdown, and a settled winning ticket
- [ ] Tag the tracks that fit: consumer trading app, and social/gamified

## What to say if a judge asks "is this really on-chain?"

Point at:

- `src/lib/liveSource.ts` — the SDK calls, top of file, in a comment block
- The tx link on any settled ticket
- `src/lib/networks.ts` — addresses come from the SDK's generated constants
- The simulation is a labelled fallback, never the default when the chain is
  reachable

Be straight about the limit: the live path is written against the SDK's real
types and typechecks, but it was built without network access to Somnia, so it
has not been run against a live venue. Say so before they find it.
