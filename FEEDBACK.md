# SDK & documentation feedback

The hackathon invites an optional feedback report. This is ours, written while
building STREAK against `@somnia-chain/markets-sdk@0.29.0`.

Context that shapes it: this integration was built in a sandbox **without network
access to Somnia or to `docs.dreamdex.io`**. Everything below was learned from
the published npm package alone — the types, the shipped `src/`, and the README.
That is an unusual constraint, but it turned out to be a good stress test of how
much the package explains itself, which is exactly what a developer hitting it
at 2am during a hackathon experiences.

## What worked unusually well

**Shipping `src/` in the tarball.** The package publishes its full TypeScript
source, not just `dist/` and `.d.ts`. This was the single most useful thing about
it. When the hosted docs were unreachable, the source comments carried the entire
mental model — and they are written as explanations, not restatements of the
signature. `interval.ts` explaining *why* the cadence helper lives in the SDK
rather than the explorer, and `derivedReads.ts` explaining why a lone bid is not
a fair mark, are the kind of comments that save an integrator an hour each.

**Generated addresses.** `SOMNIA_TESTNET_ADDRESSES` / `SOMNIA_MAINNET_ADDRESSES`
being stamped from deployment manifests, with a header saying "do not edit by
hand", removes the most common frontend drift bug outright. We consumed them
directly and never typed an address.

**The timestamp-vs-status warning.** `BinaryMarket.status` documents that the
Listed → Trading → Settling transitions are timestamp-implicit and emit no event,
so `status` can lag the clock. That one paragraph changed our architecture — we
derive round phase from `tradingStart`/`expiry` and trust `status` only for the
terminal states. Without it we would have shipped an arcade that lets you bet on
a closed round, and we would not have found it until a demo.

**Honest quote functions.** `quoteBinaryStakeOverBook` returning `null` rather
than a fake quote when the book cannot fill, and `quoteBinarySellOverBook`
surfacing `fillableQuantity` so a partial unwind is visible *before* sending, are
good API manners. We copied the pattern into our own book walk.

## Friction, roughly in order of time cost

**1. `docs/` is referenced but not shipped.** The README links
`./docs/EXCHANGE.md`, `./docs/BINARY.md`, `./docs/PRICES.md` and six more. None
of them are in the npm tarball — `files` includes `src`, `dist`, `README.md`,
`LICENSE`. Offline, every one of those links is a dead end, and they are exactly
the documents a first-time integrator is sent to. Adding `docs` to `files` would
cost a few KB and close the gap.

**2. `Tradable` vs `UnifiedMarket` is an easy wrong turn.** `exchange.market(ref)`
returns `Tradable`, which is `{ market, marketSymbol, symbol, outcome,
outcomeIndex, pool }`. We reached for `.outcomes[]`, `.quote` and `.precision` on
it — those live on `UnifiedMarket`, returned by `loadMarkets()`/`fetchMarkets()`.
The names are close enough that the mistake is natural, and the compiler error
(`Did you mean 'outcome'?`) points at the wrong fix. A line on `market()` saying
"for outcome tradables and the collateral code, use the `loadMarkets()` registry"
would have saved the round trip.

**3. Watch handles are `stop()`, not `close()`.** `WatchHandle` and
`PriceWatchHandle` both expose `stop()`. Most of the surrounding vocabulary
(`exchange.close()`, "closing the watch") says close, so we wrote `close()` three
times. Minor, but it is the kind of thing that costs a compile cycle each time.

**4. Sizing a bet from a collateral budget needs assembly.** The natural consumer
action is "spend 5 USDC on UP". `createOrder` sizes in outcome tokens, and the
budget→shares conversion lives in `quoteBinaryStakeOverBook`, which needs the
pool's raw `tickSize`/`lotSize`/`minQuantity` — not exposed on `UnifiedMarket`
(which carries derived `precision` instead). We ended up walking the human-unit
book ourselves. A `createOrder`-level `params.budget`, or a documented path from
a market to its `BinaryCrossingParams`, would make the most common consumer flow
a one-liner.

**5. `UnifiedOrder` has no `average`.** It carries `filled`, `amount`, `price`
(the placed limit) and `remaining`, but not the achieved average fill price. For
a binary market that average *is* the probability the user entered at — the most
meaningful number in the whole trade. It is recoverable by decoding `info.fills`,
but `info` is typed `unknown`, so that decode is unchecked at the one place
precision matters most. Either an `average` field or a typed `fills` on the
unified result would fix it.

**6. Opening price is a separate, batched, async read.** For a reference-mode
market the strike is `0` and the real threshold comes from
`getOpeningPrices([marketId])`, returned as a raw string in the oracle's scale
(`PRICE_FEED_DECIMALS`, 1e18) keyed by *lowercased* marketId. Three separate
things to get right — the extra call, the scale, and the key casing — for a value
that is arguably part of the market. Folding a resolved `openingPrice` onto
`BinaryMarket` when known would remove a whole class of "why is my chart
reference missing" bugs.

**7. `orderBy: "closingSoon"` is great; discovery of *new* rounds is manual.**
A rolling series mints a new pool every cadence, and a pool the unified registry
has not seen has no resolvable outcome symbols, so `createOrder` throws. We poll
`listBinaryMarkets` and call `loadMarkets(true)` when we see an unknown pool.
`watchMarkets({ discover: true })` exists and presumably handles this — but the
relationship between the discovery watch and the *unified symbol registry* is not
spelled out, so it was not obvious that it would keep `createOrder` working.

## One documentation request

The single thing that would most help a hackathon entrant: **a worked
"place one up/down bet" example, end to end, in the README** — discover the live
round of a series, size a market buy from a collateral budget, place it, read
back what filled at what price, and redeem after resolution. Every piece exists
in the package; assembling them in the right order was most of our integration
time. The starter template covers the lifecycle in scripts, but a 30-line README
example is what people actually copy.

## Correction we owe the docs

We initially told users the gas token was SOMI. It is **STT** on Shannon. That
was our error, not the SDK's — but a line in the SDK or template README naming
the gas token alongside the collateral token would have caught it.
