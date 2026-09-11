import {
  ContractRevertError,
  DEFAULT_FEES,
  DEFAULT_GAS,
  IndexerError,
  InvalidInputError,
  NotConfiguredError,
  RpcError,
  SOMNIA_TESTNET_PRICE_FEED,
  SignerRequiredError,
  SomniaMarketsError,
  binaryMarketReadAbi,
  binaryPoolWriteAbi,
  broadcastSigned,
  collateralRouterWriteAbi,
  erc20VaultWriteAbi,
  erc20WriteAbi,
  marginBankWriteAbi,
  operatorAuthorizationReadAbi,
  operatorRegistryWriteAbi,
  orderBookBatchWriteAbi,
  perpPoolWriteAbi,
  perpStopRegistryEventsAbi,
  perpStopRegistryWriteAbi,
  resolvePriceFeed,
  resolveSigner,
  spotPoolLockReadAbi,
  spotPoolStopReadAbi,
  spotPoolWriteAbi,
  spotStopRegistryEventsAbi,
  spotStopRegistryWriteAbi,
  spotVaultModeAbi,
  waitReceiptViaHeads
} from "./chunk-YALXW3ZM.js";
import {
  createPublicClient,
  decodeEventLog,
  formatUnits,
  parseUnits,
  webSocket,
  zeroAddress
} from "./chunk-556T3CNV.js";
import {
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  decodeAbiParameters,
  decodeErrorResult,
  encodeFunctionData,
  getAbiItem,
  parseAbi,
  toEventSelector,
  toFunctionSelector
} from "./chunk-35QB63S7.js";
import {
  privateKeyToAccount
} from "./chunk-TEKXKFXC.js";
import {
  nonceManager
} from "./chunk-V4HZ2GWO.js";
import {
  BaseError,
  ChainDoesNotSupportContract,
  isAddress,
  isHex,
  maxUint256
} from "./chunk-RTKA4PG2.js";
import "./chunk-S5SRPMHC.js";
import "./chunk-ENL6RYZW.js";
import {
  __publicField
} from "./chunk-L6OFPWCY.js";

// node_modules/@somnia-chain/markets-sdk/dist/raise.js
var InvariantError = class extends SomniaMarketsError {
  constructor(message) {
    super(`invariant violated: ${message}`);
    this.name = "InvariantError";
  }
};
function unreachable(message = "expected a value to be present") {
  throw new InvariantError(message);
}

// node_modules/@somnia-chain/markets-sdk/dist/actionsAbi.js
var binaryMarketWriteAbi = parseAbi([
  // No-op kept for ABI stability with adapters that probe `poke()`.
  "function poke()",
  // The dead-oracle escape hatch: permissionless once
  // `expiry + settlementWindow` has elapsed, after which both sides redeem at
  // 1/N. Flips the market Voided on the MARKET contract, bypassing the module —
  // so `syncSettlement` is still needed afterwards to release the hub earmark.
  // Reverts `WrongStatus` if already terminal, `SettlementWindowOpen` if the
  // oracle still has time.
  "function voidExpired()"
]);
var fakeOracleAbi = parseAbi([
  "function resolve(address market, uint8 outcomeIdx)",
  "function voidMarket(address market)"
]);
var testUsdcAbi = parseAbi(["function faucet(uint256 amount)"]);

// node_modules/@somnia-chain/markets-sdk/dist/readsAbi.js
var orderViews = [
  "function getOrder(uint128 orderId) view returns ((uint128 orderId, bool isBid, address owner, uint64 userData, uint256 price, uint256 fullQuantity, uint256 quantityRemaining, uint64 expireTimestampNs))",
  "function getOwnOpenOrders() view returns (uint128[])",
  "function getAllOpenOrdersOffChain(bool isBid, uint256 maxCount, uint64 startCursor) view returns ((uint128 orderId, bool isBid, address owner, uint64 userData, uint256 price, uint256 fullQuantity, uint256 quantityRemaining, uint64 expireTimestampNs)[] orders, bool hasMoreOrders, uint64 nextCursor)",
  // `getOrder` reverts with this for an id the pool has no ACTIVE order for
  // (unknown, filled, cancelled, or replaced by a reduce) — `getOrderOnchain`
  // reads it as a null answer, matching on its selector.
  //
  // The revert does NOT decode by name at the read boundary: that table is
  // generated from `smart-contracts/src/**`, and OrderBook lives in the dex
  // submodule under `lib/`. Declared here anyway as the single source the
  // selector and its test are both derived from.
  "error IncorrectOrder()"
];
var binaryPoolReadAbi = parseAbi([
  "function getBookLevels(bool isBid, uint64 numLevels) view returns ((uint256 price, uint256 quantity)[])",
  // The tick/lot grid the pool validates orders against (IOrderBook base —
  // shared by spot/binary/perp pools; see perpPoolReadAbi's identical entry).
  "function getOrderBookParameters() view returns ((uint256 tickSize, uint256 minQuantity, uint256 lotSize))",
  // Builder / routing-fee views (pool bps×1000 unit). Read-only, no signer —
  // these back the order form's ceiling hint + approval gate. `getEffective…`
  // clamps the user's raw approval by the pool's protocol-wide ceiling.
  "function getMaxBuilderFeeBpsTimes1k() view returns (uint256)",
  "function getBuilderApproval(address user, address builder) view returns (uint256)",
  "function getEffectiveBuilderApproval(address user, address builder) view returns (uint256)",
  // Settlement-extraction v2 pool reads. A pool is now a TIME-VARYING 1:1 binding
  // to markets (never concurrent): `marketNonce` (1 on a fresh pool, ++ on each
  // recycle) disambiguates successive markets' outcome ids; `settlement` is the
  // permanent redemption singleton; `finalized` is true between finalize and the
  // next recycle; `booksEmpty` gates release; `marketExpiryNs` is the order-expiry
  // cap. `getBinaryPoolParams` bundles the whole state (BinaryPoolInfo) in one call.
  "function marketNonce() view returns (uint64)",
  "function settlement() view returns (address)",
  "function finalized() view returns (bool)",
  "function booksEmpty() view returns (bool)",
  "function marketExpiryNs() view returns (uint64)",
  "function setBacking() view returns (uint256)",
  // Closing-price capture views (capture-generation pools only; older pools lack the
  // selectors — closingPrice doubles as the capability probe). closingMid is meaningful
  // only in state 1 (Captured); state: 0 Open | 1 Captured | 2 CapturedDegenerate |
  // 3 TerminalLatch. closingTop is the dual-regime raw top (pre-expiry: best live
  // order; post-expiry: best closing-book order preserved by the lock).
  "function closingPrice() view returns (uint256 closingMid, uint256 oneCollateral, uint8 state)",
  "function closingTop(uint256 maxSteps) view returns (uint256 bestBid, uint256 bestAsk, bool bidFound, bool askFound)",
  "function getBinaryPoolParams() view returns ((address collateralToken, address market, address outcomeToken, uint256 yesId, uint256 noId, uint256 oneCollateral, uint256 setBacking, address feeRecipient, uint256 makerFeeBpsTimes1k, uint256 takerFeeBpsTimes1k, uint256 maxBuilderFeeBpsTimes1k, uint256 settlementFeeBpsTimes1k, address settlement, uint64 marketNonce, bool finalized))",
  ...orderViews
]);
var binaryPoolTokensAbi = parseAbi([
  "function outcomeToken() view returns (address)",
  "function collateralToken() view returns (address)",
  "function marketNonce() view returns (uint64)"
]);
var binarySettlementAbi = parseAbi([
  "function redeem(uint256 outcomeId, uint256 amount, address to) returns (uint256 collateralOut)",
  "function finalizeAndRedeem(address pool, uint256 outcomeId, uint256 amount, address to) returns (uint256 collateralOut)",
  "function finalize(address pool) returns (uint256 marketKey)",
  "function claimOwed(address token) returns (uint256 amount)",
  "function getSettlement(uint256 marketKey) view returns ((address collateralToken, uint128 backing, bool finalized, bool voided, uint256 settlementFeeBpsTimes1k, address feeRecipient, address pool, uint64 nonce, uint256[] payoutNumerators))",
  "function isFinalized(uint256 outcomeId) view returns (bool)",
  "function owed(address user, address token) view returns (uint256)",
  "function isPoolApproved(address pool) view returns (bool)",
  "function poolRegistrar() view returns (address)",
  "function outcomeToken() view returns (address)"
]);
var binaryMarketReadAbi2 = parseAbi([
  // Outcome positions are ids on the shared ERC-6909 singleton (`outcomeToken`),
  // not per-market ERC-20 token addresses.
  "function outcomeToken() view returns (address)",
  "function yesId() view returns (uint256)",
  "function noId() view returns (uint256)",
  "function pool() view returns (address)",
  "function collateral() view returns (address)",
  "function status() view returns (uint8)",
  "function backing() view returns (uint256)",
  "function expiry() view returns (uint64)",
  // Seconds after `expiry` the oracle still has to resolve. `expiry +
  // settlementWindow` is the instant `voidExpired()` becomes callable.
  "function settlementWindow() view returns (uint64)",
  // Resolution state (Settlement v3 payout vectors). The market stores a payout
  // VECTOR, not a single winner — `winningOutcome()` was removed in the
  // payout-vector refactor. `getMarketOnchain` derives the winning index as the
  // argmax of this vector, gated on `isResolved`. Empty until resolved.
  "function payoutNumerators() view returns (uint256[])",
  "function isResolved() view returns (bool)",
  "function isVoided() view returns (bool)",
  // Void payout policy frozen at creation (0 UNIFORM | 2 CLOB_SNAPSHOT; the legacy
  // AMM slot 1 is unreachable). Snapshot-generation markets only — older clones
  // lack the selector.
  "function voidPolicy() view returns (uint8)"
]);
var erc20ReadAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)"
]);
var erc6909Abi = parseAbi([
  "function balanceOf(address owner, uint256 id) view returns (uint256)",
  "function allowance(address owner, address spender, uint256 id) view returns (uint256)",
  "function isOperator(address owner, address spender) view returns (bool)",
  "function approve(address spender, uint256 id, uint256 amount) returns (bool)",
  "function setOperator(address spender, bool approved) returns (bool)",
  "function transfer(address receiver, uint256 id, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address receiver, uint256 id, uint256 amount) returns (bool)"
]);
var spotStopRegistryReadAbi = parseAbi([
  "function somiPaymentPerOrder() view returns (uint256)"
]);
var spotPoolOperatorRegistryReadAbi = parseAbi([
  "function getOperatorPermissionsRegistry() view returns (address)"
]);
var perpPoolReadAbi = parseAbi([
  "function marginBank() view returns (address)",
  "function oracle() view returns (address)",
  "function getMarkPrice() view returns (uint256)",
  "function getIndexPrice() view returns (uint256 price, uint256 updatedAt)",
  "function getCurrentFundingRate() view returns (int256)",
  "function getCumulativeFundingPerUnit() view returns (int256)",
  "function getProjectedCumulativeFundingPerUnit() view returns (int256)",
  // ONE total, not a (long, short) pair. The contract keeps a single counter because
  // the short side is provably equal in a matched CLOB. Declaring two outputs made
  // viem require 64 bytes from a 32-byte return, so it threw
  // AbiDecodingDataSizeTooSmallError and getPerpState() failed for EVERY perp pool —
  // and with it SomniaMarkets.fetchFundingRate(), which is built on it.
  "function getOpenInterest() view returns (uint256 openInterest)",
  "function getOneBase() view returns (uint256)",
  // Funding parameters. `fundingCalculationWindowSec` is the rate's DENOMINATOR and
  // `fundingSettlementIntervalSec` the accrual cadence; n = window / interval is both
  // the per-interval divisor and the catch-up cap. Needed to normalize any rate.
  "function getFundingParameters() view returns ((uint256 fundingCalculationWindowSec, uint256 fundingSettlementIntervalSec, int256 interestRatePerWindow, uint256 maxFundingRatePerWindow, uint256 dampener, uint256 emaSmoothingAlpha, uint256 maxOracleStalenessSec))",
  // Last settlement anchor, in NANOseconds. anchor + fundingSettlementIntervalSec is
  // when the next settlement becomes due.
  "function getLastFundingUpdateTimestampNs() view returns (uint64)",
  // The EMA'd premium driving the funding rate: book-MIDPOINT vs index, NOT mark vs
  // index. Not recoverable from FundingUpdated — the event carries neither the midpoint
  // nor the EMA, and the rate is doubly clamped so the EMA cannot be inverted. So a
  // premium reading requires this call.
  "function getEmaPremium() view returns (int256)",
  // Mark price with an explicit liveness flag, in that output order. getMarkPrice()
  // reverts on a stale feed; this reports it instead.
  "function tryGetMarkPrice() view returns (bool ok, uint256 price)",
  "function getOrderBookParameters() view returns ((uint256 tickSize, uint256 minQuantity, uint256 lotSize))",
  "function getPerpPoolParameters() view returns ((uint256 initialMarginBps, uint256 maintenanceMarginBps, uint256 closeOutMarginBps, uint256 maxOpenInterest, uint256 maxPositionSize, uint256 takerFeeBpsTimes1k, int256 makerFeeBpsTimes1k, uint256 insuranceFundShareBps))",
  // The OI-scaled dynamic IMF actually in force right now. NOT `initialMarginBps`,
  // which is only the curve's floor: `_effectiveIMFFromIndex` scales it with the
  // market's open notional whenever dynamic IMF is enabled. Equal to the static base
  // only when it is off (`dynamicIMFParameters.upperCap == 0`).
  "function getEffectiveIMF() view returns (uint256)",
  // Every per-market risk input a health or margin calculation needs, in ONE call —
  // the contract added it precisely so a cross-margin walk reads a market once
  // instead of making five separate cross-contract getter calls.
  //
  // `getHealthSnapshot` REVERTS on a stale or zero mark (fails closed, by design).
  // Inside a Promise.all fan-out that takes every market down with it, which is the
  // exact failure mode that made getPerpState unusable before it moved to
  // tryGetMarkPrice — so prefer the try* variant for anything spanning markets.
  "function getHealthSnapshot() view returns ((uint256 oneBase, uint256 markPrice, int256 projectedCumulativeFunding, uint256 effectiveIMFBps, uint256 maintenanceMarginBps, uint256 closeOutMarginBps) snapshot)",
  "function tryGetHealthSnapshot() view returns (bool ok, (uint256 oneBase, uint256 markPrice, int256 projectedCumulativeFunding, uint256 effectiveIMFBps, uint256 maintenanceMarginBps, uint256 closeOutMarginBps) snapshot)",
  // How much of an opposite-side order counts as purely REDUCING, plus the position
  // size and resting quantities it derives from.
  //
  // Read whole, never composed from parts: the fields move together on every fill, so
  // separate calls can straddle one and yield a capacity that was never true at any
  // block. Before this existed the only visible trace was `hasOrdersFor`, which
  // collapses both quantities to a bool — so a client could not tell whether a
  // close-sized order would be accepted.
  "function getReducingCapacity(address account) view returns ((int128 positionSize, uint256 pendingBidQuantity, uint256 pendingAskQuantity, uint256 pendingOppositeQuantity, uint256 effectiveReducingCapacity) capacity)",
  // Close-only mode: position-INCREASING orders revert MarketRestricted, while closes,
  // reduces and cancels still work. Reversible — a wind-down, not necessarily a
  // retirement. Only needed on the pre-upgrade fallback path; an upgraded factory
  // reports it for every pool in one call (perpPoolFactoryReadAbi).
  "function isRestricted() view returns (bool)"
]);
var perpPoolFactoryReadAbi = parseAbi([
  "function getPerpPools() view returns (address[])",
  "function perpPoolCount() view returns (uint256)",
  "function getBaseTokenForPool(address perpPool) view returns (address)",
  "function getPoolForBaseToken(address baseToken) view returns (address)",
  "function isDeployedByFactory(address perpPool) view returns (bool)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function getPerpPoolStatuses() view returns ((address perpPool, address baseToken, bool restricted)[] statuses)",
  "function getUnrestrictedPerpPools() view returns (address[] perpPools)",
  "function getRestrictedPerpPools() view returns (address[] perpPools)",
  // IPerpPoolFactoryStopRegistry. The factory RECORDS which PerpStopOrderRegistry
  // serves which pool, which is the only on-chain route to it: the registry is
  // separately deployed and the pool holds no pointer back to it. Absent on a factory
  // predating that interface, so the read is feature-detected rather than assumed.
  "function getStopOrderRegistry(address perpPool) view returns (address stopOrderRegistry)"
]);
var marginBankReadAbi = parseAbi([
  // The bank has no bare collateralToken() getter — read it from getSystemConfig.
  "function getSystemConfig() view returns ((address marginBank, address collateralToken, address perpPoolFactory, address liquidationEngine, address insuranceFund, address feeRecipient, uint16 maxLeverageLimit, bool fullyWired))",
  "function getPosition(address account, address perpPool) view returns ((int128 size, uint128 avgEntryPrice, int256 entryFundingIndex, uint64 lastUpdatedTimestampNs))",
  "function getAccountState(address account) view returns ((int256 unlockedCollateralBalance, uint256 lockedCollateral, address[] activePerpPools))",
  "function getAccountEquity(address account) view returns (int256)",
  "function getWithdrawableCollateral(address account) view returns (uint256)",
  "function getActivePerpPools(address account) view returns (address[])",
  // Cross-margin health across all active markets: equity vs the initial /
  // maintenance / close-out margin requirements (raw collateral units). Plus the
  // MarginStatus enum: 0 Healthy · 1 MarginCall · 2 PartialLiquidation · 3 CloseOut.
  "function getAccountHealth(address account) view returns (int256 equity, uint256 imReq, uint256 mmReq, uint256 cmReq)",
  "function getMarginStatus(address account) view returns (uint8)",
  // Non-reverting equity. `getAccountEquity` propagates an oracle revert, which is
  // exactly when a health sweep most needs an answer; this reports it instead.
  "function tryGetAccountEquity(address account) view returns (bool ok, int256 equity)",
  // Collateral BACKING the account: max(0, unlocked + locked). Deliberately unlike
  // equity — one storage pair, no market walk, no oracle, cannot revert.
  "function getCollateralBasis(address account) view returns (uint256)",
  "function getInsuranceFundAddress() view returns (address)",
  // Whether the fund will absorb this pool's bad debt, and which tier it sits in.
  // `getPoolTier` is itself gated on registration, so a 0 means "uncovered OR not
  // registered" — pair it with isPerpPoolRegistered before reading anything into it.
  "function isInsuranceFundCoverageEnabled(address perpPool) view returns (bool)",
  "function getPoolTier(address perpPool) view returns (uint256)",
  // The two initial-margin probes. They differ ONLY in whether the increasing leg's
  // base IM is treated as already reserved, and that one flag decides which a client
  // can actually use:
  //
  //   quoteMeetsIMForOrder  baseImReserved = TRUE. Mirrors the placement-time check,
  //                         which runs AFTER lockCollateral has reserved the order's
  //                         base IM and depressed equity. Called cold by a client —
  //                         before any lock — the order's own margin is counted
  //                         nowhere, so it collapses to "does equity cover EXISTING
  //                         positions" and answers true for almost any size. Correct
  //                         only for a caller that has ALREADY taken the lock; wrong
  //                         as a pre-trade gate. (Its sole on-chain callers are the
  //                         sim market maker and sim taker — no production contract
  //                         uses it, so there is no live precedent to copy.)
  //   meetsIMForFill        baseImReserved = FALSE, so the increasing leg's base IM
  //                         IS charged against free equity — which is the pre-trade
  //                         situation, where nothing has been locked yet.
  //
  // Neither models the lock's adverse mark-to-entry reserve; `previewPerpOrderMargin`
  // does. Both are permissionless views gated only on `isPerpPool`.
  "function quoteMeetsIMForOrder(address account, address perpPool, uint256 additionalSize, uint256 orderPrice) view returns (bool)",
  "function meetsIMForFill(address account, address perpPool, uint256 additionalSize, uint256 orderPrice) view returns (bool)",
  // What auto-pull (T70) would take from the owner's WALLET for one order.
  // `PerpPool._onOrderPlaced` calls this before `lockCollateral` and deposits the
  // answer, so placing and funding are one transaction instead of approve+deposit
  // then placeOrder. It owns every decision about the amount — the pool holds no
  // sizing logic of its own — which is why it declines rather than reverts in three
  // cases, all of which return a bare 0:
  //
  //   increasingQuantity == 0   a purely reducing order locks nothing and needs
  //                             nothing; closing must never debit a wallet.
  //   unlocked < 0              never pull into a debt. A shortfall measured against
  //                             a negative balance includes the debt itself, so
  //                             pulling it would cure pre-existing bad debt as a side
  //                             effect of placing an order.
  //   voucher-blocked           the voucher rules forbid this increase outright, so
  //                             the placement reverts whatever the collateral says.
  //
  // A `0` therefore means "no pull", NOT "nothing needed" — read it beside the
  // account's unlocked balance, not on its own. `previewPerpOrderMargin` does that
  // for you; this is the contract's own opinion, useful as a cross-check.
  //
  // Reverts InvalidPerpPool for an unregistered market. `feeHeadroom` is the
  // worst-case fee reserve the POOL computes (`PerpPool._feeHeadroom`) — the larger
  // of the taker and floored-maker rates plus the order's builder fee, ceil-rounded
  // on the FULL order notional — not a number the bank derives, so a caller quoting
  // this directly has to supply the same one the pool would.
  "function quoteOrderTopUp(address account, address perpPool, uint256 lockAmount, uint256 feeHeadroom, uint256 increasingQuantity, uint256 orderPrice) view returns (uint256 topUp)",
  // Isolated-margin confinement. An isolated account may hold a footprint in exactly
  // one market, and `PerpPool._onOrderPlaced` rejects `IsolatedMarketBlocked` for ANY
  // order in a different one — increasing and reducing alike, unlike every other
  // placement gate. Closing the one market it is active in stays allowed, so this is
  // a market-selection constraint rather than a margin one.
  //
  // Answers true for a non-isolated account, so it is safe to read unconditionally;
  // `isolated` distinguishes "allowed because unconfined" from "allowed because this
  // is the one market", which is what a UI needs to explain the block.
  "function isolationAllowsMarket(address account, address market) view returns (bool)",
  "function isolated(address account) view returns (bool)",
  // The account's per-market leverage cap (0 = unset) and the protocol-wide ceiling
  // that clamps it. A cap STRICTER than the market's effective IMF adds margin on top
  // of the base requirement — the only way the order itself moves the placement gate.
  "function getMaxLeverage(address account, address perpPool) view returns (uint16)",
  "function getMaxLeverageLimit() view returns (uint16)",
  // Credit-voucher state. While an account carries a non-withdrawable credit floor,
  // `_meetsIM` confines position-INCREASING orders to a curated allowlist and forces
  // leverage to `voucherLeverageCap` whenever the user's own setting is unset or
  // looser. That is not a separate reject path bolted on beside the margin check — the
  // cap is fed into the SAME leverage->IM computation, so it raises the requirement.
  // A preview that ignored it would under-quote a voucher account's margin and call an
  // order affordable that placement rejects.
  "function getCreditFloor(address account) view returns (uint256)",
  "function getVoucherLeverageCap() view returns (uint16)",
  "function isVoucherMarketAllowed(address perpPool) view returns (bool)",
  // The ACTIVATION gate, independent of the factory's restriction gate. Coming from
  // the factory only proves a pool is authentic; `addPerpPool` is what makes it
  // usable, and `removePerpPool` revokes it. An unregistered pool rejects every
  // settlement callback (OnlyPerpPool) and every quote view (InvalidPerpPool) while
  // still reading as an ordinary market from the factory.
  //
  // `getPoolTier` is NOT a substitute: it is itself gated on registration, so it
  // returns 0 for an uncovered-but-registered market and an unregistered one alike.
  "function isPerpPoolRegistered(address perpPool) view returns (bool)",
  // Liquidation-keeper enumeration: the bank keeps a per-(pool, side) holder array,
  // which is what lets a keeper find every open position from head state alone — no
  // off-chain indexer. This is the bounded slice view: revert-free by construction
  // (a `start` past the end or `count` of 0 returns empty; `count` is clamped to
  // what exists, so `start + count` cannot overflow). `getPerpSideHolders` walks it
  // page by page at ONE pinned block.
  "function getSideHoldersPaginated(address pool, bool isLong, uint256 start, uint256 count) view returns (address[] holders)",
  // The bank's OWN price at which an account's position in one pool exhausts its
  // allocated equity — the number a liquidation keeper prices a bankrupt position
  // against. NOT the SDK's client-side `getLiquidationPrice` estimate.
  "function getBankruptcyPrice(address account, address perpPool) view returns (uint256 price)",
  // `getBankruptcyPrice`'s two reverts: flat-in-that-pool, and the sole-dust
  // degenerate state (total mark notional zero). Neither decodes by NAME at the
  // read boundary today — the generated contract-error table compiles only the DEX
  // contracts `smart-contracts/src` references, and MarginBank lives in the
  // submodule under `lib/`. Declared here as the single source their selectors and
  // tests derive from (the `IncorrectOrder()` pattern above); `getBankruptcyPrice`
  // names them at the call site.
  "error NoOpenPosition()",
  "error AdlZeroNotional()",
  // ---------------------------------------------------------------- T70 / DEX-2361
  // The EXTRA initial margin an account's own leverage overrides demand, in collateral
  // units, summed across every market where it both holds a position AND has set a
  // stricter-than-market cap.
  //
  // Not a nicety: `quoteOrderTopUp` funds ONE order and measures the unlocked balance,
  // while the admission gate measures whole-account equity, so an order can be fully
  // funded on its own market and still be refused `InsufficientMarginForOrder` because
  // of an override on a DIFFERENT one. This is the whole-account figure that explains
  // that refusal, and the amount to deposit deliberately rather than pull.
  //
  // REVERTS if a market that is both positioned and overridden is not currently
  // priceable. That is a strict subset of what `getAccountHealth` reads, so it is not a
  // priceability probe for the account: an account with a stale position in a market it
  // has NOT overridden reverts there and answers fine here.
  "function getLeverageImSurcharge(address account) view returns (uint256)",
  // Which main would be debited if `child` placed a position-increasing order now, or
  // zero if none would. Zero covers all three no-op cases at once: registry unset (the
  // rail is dormant), the account is unlinked, and the account resolves to itself
  // because it IS a main. The frontend quote for "will this order spend my main's
  // wallet, and whose".
  "function quoteFundingPayer(address child) view returns (address payer)",
  // What a wallet could actually contribute to a pull right now: `min(balance,
  // allowance)` in collateral units. The rail sizes a child's own contribution with
  // this, which is why a child holding no approval contributes zero rather than
  // reverting the order. Read it on the MAIN to see the ceiling on what a child can
  // draw, and on the CHILD to see how much it covers itself first.
  "function quoteWalletCapacity(address wallet) view returns (uint256)",
  // The outstanding claim against a child: principal its main has funded and which the
  // child may trade but NOT withdraw (`withdraw` frees at most `balance - claim`).
  // Zero for an account with no main funding outstanding.
  "function getMainFundedPrincipal(address child) view returns (uint256)",
  // The payer SNAPSHOTTED when the principal was pulled, not whoever is linked now.
  // Both routes home — `repayFunding` and `recallFromChild` — settle against this
  // address, so an unlink or re-link between funding and repayment cannot misroute the
  // money. Read this rather than `mainOf` when the question is "who gets it back".
  "function getMainFundingPayer(address child) view returns (address)",
  // The registry the bank resolves links through, or zero while the rail is DORMANT.
  // This is the arming switch: the feature's code ships inert and does nothing until an
  // address is set here, so a zero means no child can draw on any main regardless of
  // what the registry itself says.
  "function getLinkedWalletRegistry() view returns (address)"
]);
var linkedWalletRegistryReadAbi = parseAbi([
  // The wallet's main, or zero. A main resolves to ITSELF here rather than to zero, so
  // "is this a child" is `mainOf(w) !== zero && mainOf(w) !== w`, not `mainOf(w) !== zero`.
  "function mainOf(address wallet) view returns (address)",
  // Every child of a main, excluding the main itself. Bounded by `maxChildren`.
  "function childrenOf(address main) view returns (address[])",
  // The whole link group a wallet belongs to — the main plus every child — from either
  // end. A single read for the group, versus `mainOf` then `childrenOf`.
  "function groupOf(address wallet) view returns (address[] group)",
  // Whether two wallets are in the same group. Symmetric, and false for a wallet
  // against itself.
  "function areLinked(address a, address b) view returns (bool)",
  // The group plus its MATURITY, which the raw graph does not carry. `maturesAt` exists
  // because a link armed in reaction to an impending ADL must not buy netting credit;
  // the FUNDING rail deliberately reads the raw graph instead, since the main proposed
  // the link and owns the allowance. So a link can be fundable and not yet mature.
  "function linkageOf(address wallet) view returns ((address main, address[] members, uint64 linkedAt, uint64 maturesAt) linkage)",
  "function linkedAtOf(address child) view returns (uint64)",
  "function linkMaturitySeconds() view returns (uint64)",
  // How many children one main may hold — the cap on how many isolated buckets a single
  // treasury can serve.
  "function maxChildren() view returns (uint256)"
]);
var insuranceFundReadAbi = parseAbi([
  "function getMaxTiers() view returns (uint256)",
  "function getTotalTierBalances() view returns (uint256)",
  "function getTierBalance(uint256 tier) view returns (uint256)",
  "function getPoolCountForTier(uint256 tier) view returns (uint256)",
  "function getTierForPool(address pool) view returns (uint256)"
]);
var liquidationEngineReadAbi = parseAbi([
  "function isLiquidatable(address account) view returns (bool)",
  "function getMarginBank() view returns (address)",
  "function getBidderCount() view returns (uint256)",
  "function getBidders() view returns (address[])",
  "function getLiquidationPenaltyBps() view returns (uint256)",
  "function getMinLiquidationSpreadBps() view returns (uint256)",
  "function getMaxLiquidationSpreadBps() view returns (uint256)",
  "function getMaxLiquidationVolumePerBlock() view returns (uint256)",
  "function getLiquidationVolumeForBlock(uint256 blockNumber) view returns (uint256)"
]);
var erc20VaultReadAbi = parseAbi([
  "function getWithdrawableBalance(address owner, address token) view returns (uint256)"
]);

// node_modules/@somnia-chain/markets-sdk/dist/moduleAbi.js
var binaryModuleWriteAbi = parseAbi([
  // Redemption — trader-facing, signatures UNCHANGED from v1. The module pulls the
  // caller's winning outcome tokens then redeems through the settlement singleton;
  // `(operatorId, venueId)` are attribution-only (may be 0).
  "function redeem(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint8 outcomeIdx, uint256 amount)",
  "function redeemMany(uint32 operatorId, bytes32 venueId, bytes32[] marketIds, uint8[] outcomeIdxs, uint256[] amounts)",
  "function redeemFor(address owner, uint256 nonce, uint256 deadline, bytes sig, uint32 operatorId, bytes32 venueId, bytes32 marketId, uint8 outcomeIdx, uint256 amount)",
  // Complete-set mint / merge — pool surface unchanged; module orchestrates.
  "function mintCompleteSet(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint256 amount)",
  "function mergeCompleteSet(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint256 amount)",
  // NEW permissionless keeper entries. `finalizeMarket` sweeps the pool's backing
  // + resolution snapshot to settlement (no-op-guarded against double-finalize);
  // `releasePool` returns a finalized, drained pool to its creator's free list for
  // recycle. Both revert if the module has no settlement wired.
  "function finalizeMarket(bytes32 marketId)",
  "function releasePool(bytes32 marketId)",
  // Permissionless earmark reconcile. `BinaryMarket.voidExpired()` (the dead-oracle
  // escape hatch) flips a market Voided directly, bypassing the module — so the
  // oracle adapter's onResolved (hub earmark release) never fires. `syncSettlement`
  // drives that missing release once the market is terminal (reverts
  // `MarketNotSettled` while still live). Idempotent on the hub side.
  "function syncSettlement(bytes32 marketId)",
  // Permissionless oracle retry — the FIRST thing to try when a market is past
  // expiry with no resolution. Keyed by ORACLE QUESTION, not market: the module
  // fans out to every market bound to that question, pulls each one's adapter,
  // and resolves the ones that answer. Unanswered adapters are skipped, so a
  // partial success is a success; it reverts `OracleNotAnswered` only when none
  // answered, and `UnknownOracleQuestion` when no market is bound at all.
  "function pokeOracle(uint256 oracleQuestionId)"
]);
var oracleAdapterReadAbi = parseAbi([
  "function pullNumericAnswer(uint256 oracleQuestionId) view returns (int256 numericValue, bool voided)",
  "function PRICE_DECIMALS() view returns (uint256)"
]);
var binaryModuleReadAbi = parseAbi([
  // The permanent BinarySettlement singleton every pool finalizes into.
  "function settlement() view returns (address)",
  // A pool's creator (its first-deploy creator) — the only party that can reuse it.
  "function poolCreator(address pool) view returns (address creator)",
  // The creator's free (finalized + released, reusable) pools for a collateral.
  "function getFreePools(address creator, address collateral) view returns (address[] pools)",
  "function freePoolCount(address creator, address collateral) view returns (uint256 count)",
  // A market's pool nonce (part of its outcome-id encoding). Separate view — the
  // wide `markets` tuple keeps its v1 ABI.
  "function marketNonce(bytes32 marketId) view returns (uint64 nonce)",
  // marketId => the value-type MarketRecord fields (ABI unchanged from v1).
  "function markets(bytes32 marketId) view returns (uint256 oracleQuestionId, uint8 outcomeSlotCount, uint8 voidPolicy, address collateral, uint32 originOperatorId, bytes32 originVenueId, address oracleAdapter, address creator, address market, address pool, uint256 yesId, uint256 noId, uint64 tradingStart, uint64 expiry)"
]);

// node_modules/@somnia-chain/markets-sdk/dist/graphqlBoundary.js
function operationNameOf(query) {
  var _a;
  return ((_a = query.match(/(?:query|mutation|subscription)\s+(\w+)/)) == null ? void 0 : _a[1]) ?? "anonymous";
}
function signalFor(options) {
  const timeout = options.timeoutMs !== void 0 ? AbortSignal.timeout(options.timeoutMs) : void 0;
  if (!options.signal)
    return timeout ? { signal: timeout } : {};
  if (!timeout)
    return { signal: options.signal };
  return {
    signal: typeof AbortSignal.any === "function" ? AbortSignal.any([options.signal, timeout]) : options.signal
  };
}
async function postGraphql(endpoint, query, variables, options = {}) {
  var _a, _b;
  const operation = options.label ?? operationNameOf(query);
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...options.headers },
      body: JSON.stringify({ query, variables }),
      // Never let a framework fetch cache stand between the indexer and the UI —
      // Next.js would otherwise serve a stale response to `router.refresh()`.
      // Indexer reads are always point-in-time.
      cache: "no-store",
      ...signalFor(options)
    });
  } catch (cause) {
    if ((_a = options.signal) == null ? void 0 : _a.aborted)
      throw options.signal.reason;
    throw new IndexerError(operation, cause instanceof Error ? cause.message : String(cause), { cause });
  }
  if (!res.ok)
    throw new IndexerError(operation, `HTTP ${res.status}`);
  let json;
  try {
    json = await res.json();
  } catch (cause) {
    throw new IndexerError(operation, "response was not JSON", { cause });
  }
  const gqlError = (_b = json.errors) == null ? void 0 : _b[0];
  if (gqlError)
    throw new IndexerError(operation, gqlError.message);
  if (!json.data)
    throw new IndexerError(operation, "empty response (no data)");
  return json.data;
}

// node_modules/@somnia-chain/markets-sdk/dist/indexerRead.js
var GQL_TIMEOUT_MS = 3e4;
var signals = /* @__PURE__ */ new Map();
function registerIndexerSignal(indexerUrl, signal) {
  const ref = new WeakRef(signal);
  signals.set(indexerUrl, ref);
  return () => {
    if (signals.get(indexerUrl) === ref)
      signals.delete(indexerUrl);
  };
}
function signalFor2(indexerUrl) {
  const ref = signals.get(indexerUrl);
  if (!ref)
    return void 0;
  const signal = ref.deref();
  if (!signal) {
    signals.delete(indexerUrl);
    return void 0;
  }
  return signal;
}
function findBadVariablePaths(value, path, out) {
  if (value === void 0) {
    out.push(`${path}=undefined`);
    return;
  }
  if (typeof value === "function") {
    out.push(`${path}=<client-boundary stub function>`);
    return;
  }
  if (value === null || typeof value !== "object")
    return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => findBadVariablePaths(v, `${path}[${i}]`, out));
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    findBadVariablePaths(v, path ? `${path}.${k}` : k, out);
  }
}
async function gqlRequest(document, variables, indexerUrl, headers) {
  return sendGraphql(document.toString(), variables, indexerUrl, headers);
}
async function gqlRequestDynamic(query, variables, indexerUrl, headers) {
  return sendGraphql(query, variables, indexerUrl, headers);
}
async function sendGraphql(query, variables, indexerUrl, headers) {
  var _a;
  const operation = ((_a = query.match(/query\s+(\w+)/)) == null ? void 0 : _a[1]) ?? "anonymous";
  const bad = [];
  for (const [k, v] of Object.entries(variables))
    findBadVariablePaths(v, k, bad);
  if (bad.length) {
    throw new InvalidInputError(`gqlRequest(${operation}): unusable variable(s): ${bad.join(", ")}`);
  }
  return postGraphql(indexerUrl, query, variables, {
    headers,
    timeoutMs: GQL_TIMEOUT_MS,
    signal: signalFor2(indexerUrl)
  });
}
var COUNT_FALLBACK_CAP = 1e4;
async function aggregateCountBounded(table, whereType, where, indexerUrl, headers) {
  try {
    const data = await gqlRequestDynamic(`query Count($where: ${whereType}!) { ${table}_aggregate(where: $where) { aggregate { count } } }`, { where }, indexerUrl, headers);
    const agg = data[`${table}_aggregate`];
    if (!agg)
      throw new IndexerError("aggregateCount", `${table}_aggregate not found in response`);
    return { count: agg.aggregate.count, truncated: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!(/aggregate/i.test(msg) && /not found/i.test(msg)))
      throw e;
    const probeLimit = COUNT_FALLBACK_CAP + 1;
    const rows = await gqlRequestDynamic(`query CountFallback($where: ${whereType}!) { ${table}(where: $where, limit: ${probeLimit}) { id } }`, { where }, indexerUrl, headers);
    const table_rows = rows[table];
    if (!table_rows)
      throw new IndexerError("aggregateCount", `${table} not found in response`);
    const fetched = table_rows.length;
    return fetched > COUNT_FALLBACK_CAP ? { count: COUNT_FALLBACK_CAP, truncated: true } : { count: fetched, truncated: false };
  }
}
async function aggregateCount(table, whereType, where, indexerUrl, headers) {
  return (await aggregateCountBounded(table, whereType, where, indexerUrl, headers)).count;
}
function narrowIndexerInvariant(rows) {
  return rows;
}

// node_modules/@somnia-chain/markets-sdk/dist/gql/graphql.js
var TypedDocumentString = class extends String {
  constructor(value, __meta__) {
    super(value);
    __publicField(this, "__apiType");
    __publicField(this, "value");
    __publicField(this, "__meta__");
    this.value = value;
    this.__meta__ = __meta__;
  }
  toString() {
    return this.value;
  }
};
var ActivityFillFieldsFragmentDoc = new TypedDocumentString(`
    fragment ActivityFillFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  takerIsBid
  takerOrder {
    owner
    side
  }
  blockNumber
  timestamp
  txHash
}
    `, { "fragmentName": "ActivityFillFields" });
var ActivityRouterFieldsFragmentDoc = new TypedDocumentString(`
    fragment ActivityRouterFields on RouterActionRecord {
  id
  kind
  market: market_id
  account
  amount
  payout
  routedVia
  blockNumber
  timestamp
  txHash
}
    `, { "fragmentName": "ActivityRouterFields" });
var ActivityResolutionFieldsFragmentDoc = new TypedDocumentString(`
    fragment ActivityResolutionFields on MarketResolutionEvent {
  id
  kind
  market: market_id
  outcomeIdx
  voided
  blockNumber
  timestamp
  txHash
}
    `, { "fragmentName": "ActivityResolutionFields" });
var ActivityStatusFieldsFragmentDoc = new TypedDocumentString(`
    fragment ActivityStatusFields on MarketStatusUpdate {
  id
  market: market_id
  oldStatus
  newStatus
  blockNumber
  timestamp
  txHash
}
    `, { "fragmentName": "ActivityStatusFields" });
var TransactionOrderFieldsFragmentDoc = new TypedDocumentString(`
    fragment TransactionOrderFields on Order {
  id
  orderId
  market_id
  owner
  isBid
  side
  price
  fullQuantity
  filledQuantity
  quantityRemaining
  status
  rested
  cancelReason
  placedAtTimestamp
  placedTxHash
}
    `, { "fragmentName": "TransactionOrderFields" });
var PortfolioMarketFieldsFragmentDoc = new TypedDocumentString(`
    fragment PortfolioMarketFields on Market {
  id
  marketAddress
  poolAddress
  asset
  question
  status: clobStatus
  lastPrice
  strike
  expiry
  winningOutcome
  voided
  quoteDecimals
  intervalSec
}
    `, { "fragmentName": "PortfolioMarketFields" });
var ProtocolFeeFieldsFragmentDoc = new TypedDocumentString(`
    fragment ProtocolFeeFields on ProtocolFeeRecord {
  id
  orderId
  recipient
  payer
  token
  amount
  isTakerSide
  market: market_id
  pool
  timestamp
  txHash
}
    `, { "fragmentName": "ProtocolFeeFields" });
var BuilderFeeFieldsFragmentDoc = new TypedDocumentString(`
    fragment BuilderFeeFields on BuilderFeeRecord {
  id
  orderId
  builder
  payer
  token
  amount
  market: market_id
  pool
  timestamp
  txHash
}
    `, { "fragmentName": "BuilderFeeFields" });
var SettlementFeeFieldsFragmentDoc = new TypedDocumentString(`
    fragment SettlementFeeFields on SettlementFeeRecord {
  id
  recipient: feeRecipient
  amount: fee
  winningBacking
  market: market_id
  timestamp
  txHash
}
    `, { "fragmentName": "SettlementFeeFields" });
var FillQueryFieldsFragmentDoc = new TypedDocumentString(`
    fragment FillQueryFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  makerOrderId
  takerOrderId
  timestamp
  txHash
  takerOrder {
    owner
    side
  }
}
    `, { "fragmentName": "FillQueryFields" });
var MarketRefFieldsFragmentDoc = new TypedDocumentString(`
    fragment MarketRefFields on Market {
  id
  marketType
  poolAddress
  marketAddress
  baseSymbol
  quoteSymbol
  baseDecimals
  quoteDecimals
  asset
  question
}
    `, { "fragmentName": "MarketRefFields" });
var TradeContextFillFieldsFragmentDoc = new TypedDocumentString(`
    fragment TradeContextFillFields on Fill {
  id
  market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  takerOrder {
    owner
    side
  }
  makerOrderId
  takerOrderId
  takerRemainingQuantity
  makerRemainingQuantity
  blockNumber
  timestamp
  logIndex
  txHash
}
    `, { "fragmentName": "TradeContextFillFields" });
var FillOrderFieldsFragmentDoc = new TypedDocumentString(`
    fragment FillOrderFields on Order {
  id
  orderId
  owner
  isBid
  side
  price
  fullQuantity
  filledQuantity
  quantityRemaining
  status
  rested
  cancelReason
  placedAtTimestamp
  placedTxHash
}
    `, { "fragmentName": "FillOrderFields" });
var SeriesFieldsFragmentDoc = new TypedDocumentString(`
    fragment SeriesFields on Series {
  id
  creatorAddress
  seriesId
  collateral
  asset
  intervalSec
  createdAtTimestamp
  updatedAtTimestamp
}
    `, { "fragmentName": "SeriesFields" });
var MarketCreatorFieldsFragmentDoc = new TypedDocumentString(`
    fragment MarketCreatorFields on MarketCreator {
  id
  owner
  policy
  core
  adapter
  operatorId
  venueId
  factory
  createdAtBlock
  createdAtTimestamp
}
    `, { "fragmentName": "MarketCreatorFields" });
var OracleAdapterFieldsFragmentDoc = new TypedDocumentString(`
    fragment OracleAdapterFields on OracleAdapter {
  id
  owner
  factory
  approved
  approvedAtTimestamp
  createdAtTimestamp
}
    `, { "fragmentName": "OracleAdapterFields" });
var MarketFieldsFragmentDoc = new TypedDocumentString(`
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}
    `, { "fragmentName": "MarketFields" });
var OperatorFieldsFragmentDoc = new TypedDocumentString(`
    fragment OperatorFields on Operator {
  operatorId
  owner
  feeRecipient
  enabled
  policy
  context
  pendingOwner
  venueCount
  createdAtTimestamp
  updatedAtTimestamp
  marketCount
  cumulativeQuoteVolume
  protocolFeesCollected
  settlementFeesCollected
  builderFeesCollected
}
    `, { "fragmentName": "OperatorFields" });
var VenueFieldsFragmentDoc = new TypedDocumentString(`
    fragment VenueFields on Venue {
  venueId
  operatorId
  marketType
  feeParams
  feeRecipientOverride
  policy
  signer
  creationEnabled
  context
  createdAtTimestamp
  updatedAtTimestamp
  marketCount
  cumulativeQuoteVolume
  protocolFeesCollected
  settlementFeesCollected
  builderFeesCollected
}
    `, { "fragmentName": "VenueFields" });
var OracleQuestionFieldsFragmentDoc = new TypedDocumentString(`
    fragment OracleQuestionFields on OracleQuestion {
  id
  questionKey
  scheduler
  oracleCost
  bindCount
  reuseCount
  createdAtBlock
  createdAtTimestamp
}
    `, { "fragmentName": "OracleQuestionFields" });
var OperatorHubAccountFieldsFragmentDoc = new TypedDocumentString(`
    fragment OperatorHubAccountFields on OperatorHubAccount {
  id
  operatorId
  earmarked
  credit
  outstanding
  createdAtBlock
  createdAtTimestamp
  updatedAtBlock
  updatedAtTimestamp
}
    `, { "fragmentName": "OperatorHubAccountFields" });
var OracleBindFieldsFragmentDoc = new TypedDocumentString(`
    fragment OracleBindFields on OracleBind {
  id
  oracleQuestionId
  bindIndex
  operatorId
  measuredGas
  overheadShare
  cost
  charged
  subsidy
  resolvedAt
  boundAtBlock
  boundAtTimestamp
  txHash
}
    `, { "fragmentName": "OracleBindFields" });
var OracleCallbackFieldsFragmentDoc = new TypedDocumentString(`
    fragment OracleCallbackFields on OracleCallback {
  id
  marketsResolved
  gasPrice
  measuredGas
  overheadGasAttributed
  totalCost
  totalCharged
  subsidy
  pendingRemaining
  blockNumber
  timestamp
  txHash
}
    `, { "fragmentName": "OracleCallbackFields" });
var OrderMarketFieldsFragmentDoc = new TypedDocumentString(`
    fragment OrderMarketFields on Market {
  marketAddress
  asset
  question
  expiry
  tradingStart
  quoteDecimals
  intervalSec
}
    `, { "fragmentName": "OrderMarketFields" });
var PerpPortfolioMarketFieldsFragmentDoc = new TypedDocumentString(`
    fragment PerpPortfolioMarketFields on Market {
  poolAddress
  baseSymbol
  quoteSymbol
  baseDecimals
  quoteDecimals
  tickSize
  lotSize
  minQuantity
  lastPrice
  marginBank
  initialMarginBps
  fundingRate
  indexPrice
  stopRegistry
}
    `, { "fragmentName": "PerpPortfolioMarketFields" });
var RouterActionFieldsFragmentDoc = new TypedDocumentString(`
    fragment RouterActionFields on RouterActionRecord {
  id
  kind
  account
  market: market_id
  amount
  payout
  routedVia
  timestamp
  txHash
}
    `, { "fragmentName": "RouterActionFields" });
var SpotPortfolioMarketFieldsFragmentDoc = new TypedDocumentString(`
    fragment SpotPortfolioMarketFields on Market {
  poolAddress
  baseSymbol
  quoteSymbol
  baseToken
  quoteToken
  baseDecimals
  quoteDecimals
  baseIsNative
  tickSize
  lotSize
  minQuantity
  lastPrice
  markPrice
  stopRegistry
}
    `, { "fragmentName": "SpotPortfolioMarketFields" });
var SpotStopOrderFieldsFragmentDoc = new TypedDocumentString(`
    fragment SpotStopOrderFields on StopOrder {
  id
  registry
  orderId: orderIdRaw
  isBid
  quantity
  triggerPrice
  triggerOperator
  orderType
  status
  placedOrderId
  createdAt
}
    `, { "fragmentName": "SpotStopOrderFields" });
var MarketActivityDocument = new TypedDocumentString(`
    query MarketActivity($fillWhere: Fill_bool_exp!, $routerWhere: RouterActionRecord_bool_exp!, $resolutionWhere: MarketResolutionEvent_bool_exp!, $statusWhere: MarketStatusUpdate_bool_exp!, $fillLimit: Int!, $routerLimit: Int!, $resolutionLimit: Int!, $statusLimit: Int!) {
  Fill(
    where: $fillWhere
    order_by: [{timestamp: desc}, {blockNumber: desc}, {logIndex: desc}]
    limit: $fillLimit
  ) {
    ...ActivityFillFields
  }
  RouterActionRecord(
    where: $routerWhere
    order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}]
    limit: $routerLimit
  ) {
    ...ActivityRouterFields
  }
  MarketResolutionEvent(
    where: $resolutionWhere
    order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}]
    limit: $resolutionLimit
  ) {
    ...ActivityResolutionFields
  }
  MarketStatusUpdate(
    where: $statusWhere
    order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}]
    limit: $statusLimit
  ) {
    ...ActivityStatusFields
  }
}
    fragment ActivityFillFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  takerIsBid
  takerOrder {
    owner
    side
  }
  blockNumber
  timestamp
  txHash
}
fragment ActivityRouterFields on RouterActionRecord {
  id
  kind
  market: market_id
  account
  amount
  payout
  routedVia
  blockNumber
  timestamp
  txHash
}
fragment ActivityResolutionFields on MarketResolutionEvent {
  id
  kind
  market: market_id
  outcomeIdx
  voided
  blockNumber
  timestamp
  txHash
}
fragment ActivityStatusFields on MarketStatusUpdate {
  id
  market: market_id
  oldStatus
  newStatus
  blockNumber
  timestamp
  txHash
}`);
var TransactionEventsDocument = new TypedDocumentString(`
    query TransactionEvents($txHash: String!, $limit: Int!) {
  Fill(where: {txHash: {_eq: $txHash}}, order_by: {logIndex: asc}, limit: $limit) {
    ...ActivityFillFields
  }
  RouterActionRecord(
    where: {txHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: $limit
  ) {
    ...ActivityRouterFields
  }
  MarketResolutionEvent(
    where: {txHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: $limit
  ) {
    ...ActivityResolutionFields
  }
  MarketStatusUpdate(
    where: {txHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: $limit
  ) {
    ...ActivityStatusFields
  }
}
    fragment ActivityFillFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  takerIsBid
  takerOrder {
    owner
    side
  }
  blockNumber
  timestamp
  txHash
}
fragment ActivityRouterFields on RouterActionRecord {
  id
  kind
  market: market_id
  account
  amount
  payout
  routedVia
  blockNumber
  timestamp
  txHash
}
fragment ActivityResolutionFields on MarketResolutionEvent {
  id
  kind
  market: market_id
  outcomeIdx
  voided
  blockNumber
  timestamp
  txHash
}
fragment ActivityStatusFields on MarketStatusUpdate {
  id
  market: market_id
  oldStatus
  newStatus
  blockNumber
  timestamp
  txHash
}`);
var TransactionOrderAnchorDocument = new TypedDocumentString(`
    query TransactionOrderAnchor($txHash: String!, $limit: Int!) {
  Order(where: {placedTxHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {
    ...TransactionOrderFields
    placedAtBlock
  }
}
    fragment TransactionOrderFields on Order {
  id
  orderId
  market_id
  owner
  isBid
  side
  price
  fullQuantity
  filledQuantity
  quantityRemaining
  status
  rested
  cancelReason
  placedAtTimestamp
  placedTxHash
}`);
var TransactionContextDocument = new TypedDocumentString(`
    query TransactionContext($txHash: String!, $timestamp: numeric!, $marketIds: [String!]!, $limit: Int!, $orderLimit: Int!) {
  Order(
    where: {placedAtTimestamp: {_eq: $timestamp}, placedTxHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: $orderLimit
  ) {
    ...TransactionOrderFields
  }
  ProtocolFeeRecord(
    where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: $limit
  ) {
    ...ProtocolFeeFields
  }
  BuilderFeeRecord(
    where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: $limit
  ) {
    ...BuilderFeeFields
  }
  Market(where: {id: {_in: $marketIds}}) {
    ...MarketFields
  }
}
    fragment TransactionOrderFields on Order {
  id
  orderId
  market_id
  owner
  isBid
  side
  price
  fullQuantity
  filledQuantity
  quantityRemaining
  status
  rested
  cancelReason
  placedAtTimestamp
  placedTxHash
}
fragment ProtocolFeeFields on ProtocolFeeRecord {
  id
  orderId
  recipient
  payer
  token
  amount
  isTakerSide
  market: market_id
  pool
  timestamp
  txHash
}
fragment BuilderFeeFields on BuilderFeeRecord {
  id
  orderId
  builder
  payer
  token
  amount
  market: market_id
  pool
  timestamp
  txHash
}
fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var PortfolioDocument = new TypedDocumentString(`
    query Portfolio($acct: String!, $fillWhere: Fill_bool_exp!, $ordersLimit: Int, $tradesLimit: Int) {
  OutcomeBalance(
    where: {account: {_eq: $acct}, balance: {_gt: "0"}}
    order_by: {balance: desc}
    limit: 200
  ) {
    outcomeIndex
    tokenId
    balance
    market {
      ...PortfolioMarketFields
    }
  }
  ClobOrder: Order(
    where: {owner: {_eq: $acct}, status: {_eq: "Open"}, market: {marketType: {_eq: "BINARY"}}}
    order_by: {placedAtTimestamp: desc}
    limit: $ordersLimit
  ) {
    id
    orderId
    side
    price
    quantityRemaining
    filledQuantity
    fullQuantity
    placedAtTimestamp
    placedTxHash
    market {
      ...PortfolioMarketFields
    }
  }
  ClobFill: Fill(
    where: $fillWhere
    order_by: {timestamp: desc}
    limit: $tradesLimit
  ) {
    id
    fillPrice
    quantity
    timestamp
    txHash
    maker
    makerSide
    takerOrder {
      owner
      side
    }
    market {
      marketAddress
      asset
      quoteDecimals
    }
  }
}
    fragment PortfolioMarketFields on Market {
  id
  marketAddress
  poolAddress
  asset
  question
  status: clobStatus
  lastPrice
  strike
  expiry
  winningOutcome
  voided
  quoteDecimals
  intervalSec
}`);
var OutcomeBalancesDocument = new TypedDocumentString(`
    query OutcomeBalances($acct: String!, $mkt: String!) {
  OutcomeBalance(
    where: {account: {_eq: $acct}, market: {marketAddress: {_eq: $mkt}}}
  ) {
    outcomeIndex
    balance
  }
}
    `);
var VaultPayoutFallbacksDocument = new TypedDocumentString(`
    query VaultPayoutFallbacks($where: VaultPayoutFallback_bool_exp!, $limit: Int, $offset: Int) {
  VaultPayoutFallback(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    owner
    token
    amount
    market: market_id
    timestamp
    txHash
  }
}
    `);
var MarketResolutionDocument = new TypedDocumentString(`
    query MarketResolution($id: String!) {
  MarketResolutionEvent(
    where: {market_id: {_eq: $id}}
    order_by: {timestamp: asc}
  ) {
    id
    market: market_id
    kind
    winningOutcome: outcomeIdx
    payoutNumerators
    payoutDenominator
    voided
    blockNumber
    timestamp
    txHash
  }
  MarketReferenceLink(where: {market_id: {_eq: $id}}, limit: 1) {
    id
    market: market_id
    oracleQuestionId: referenceQuestionId
    pending
  }
  Market_by_pk(id: $id) {
    oracleQuestionId
  }
}
    `);
var OracleAnswersDocument = new TypedDocumentString(`
    query OracleAnswers($closingQid: String!, $openingQid: String!) {
  closing: OracleAnswer_by_pk(id: $closingQid) {
    oracleQuestionId
    numericValue
    outcomeLabel
    voidReason
    resolvedAt
    txHash
  }
  opening: OracleAnswer_by_pk(id: $openingQid) {
    oracleQuestionId
    numericValue
    outcomeLabel
    voidReason
    resolvedAt
    txHash
  }
}
    `);
var CandlesDocument = new TypedDocumentString(`
    query Candles($where: Candle_bool_exp!, $limit: Int) {
  Candle(where: $where, order_by: {bucketStart: desc}, limit: $limit) {
    bucketStart
    openPrice
    high
    low
    closePrice
    baseVolume
    quoteVolume
    tradeCount
  }
}
    `);
var BuilderApprovalsDocument = new TypedDocumentString(`
    query BuilderApprovals($where: BuilderApproval_bool_exp!, $limit: Int, $offset: Int) {
  BuilderApproval(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    market_id
    market {
      poolAddress
    }
    user
    builder
    maxFeeBpsTimes1k
    blockNumber
    timestamp
    txHash
  }
}
    `);
var ProtocolFeesDocument = new TypedDocumentString(`
    query ProtocolFees($where: ProtocolFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
  ProtocolFeeRecord(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...ProtocolFeeFields
  }
}
    fragment ProtocolFeeFields on ProtocolFeeRecord {
  id
  orderId
  recipient
  payer
  token
  amount
  isTakerSide
  market: market_id
  pool
  timestamp
  txHash
}`);
var BuilderFeesDocument = new TypedDocumentString(`
    query BuilderFees($where: BuilderFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
  BuilderFeeRecord(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...BuilderFeeFields
  }
}
    fragment BuilderFeeFields on BuilderFeeRecord {
  id
  orderId
  builder
  payer
  token
  amount
  market: market_id
  pool
  timestamp
  txHash
}`);
var SettlementFeesDocument = new TypedDocumentString(`
    query SettlementFees($where: SettlementFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
  SettlementFeeRecord(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...SettlementFeeFields
  }
}
    fragment SettlementFeeFields on SettlementFeeRecord {
  id
  recipient: feeRecipient
  amount: fee
  winningBacking
  market: market_id
  timestamp
  txHash
}`);
var FillsDocument = new TypedDocumentString(`
    query Fills($where: Fill_bool_exp!, $limit: Int, $offset: Int) {
  Fill(
    where: $where
    order_by: [{timestamp: desc}, {blockNumber: desc}]
    limit: $limit
    offset: $offset
  ) {
    ...FillQueryFields
  }
}
    fragment FillQueryFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  makerOrderId
  takerOrderId
  timestamp
  txHash
  takerOrder {
    owner
    side
  }
}`);
var UserFillsDocument = new TypedDocumentString(`
    query UserFills($where: Fill_bool_exp!, $limit: Int, $offset: Int) {
  Fill(
    where: $where
    order_by: [{timestamp: desc}, {blockNumber: desc}]
    limit: $limit
    offset: $offset
  ) {
    ...FillQueryFields
  }
}
    fragment FillQueryFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  makerOrderId
  takerOrderId
  timestamp
  txHash
  takerOrder {
    owner
    side
  }
}`);
var FillDetailDocument = new TypedDocumentString(`
    query FillDetail($id: String!) {
  Fill(where: {id: {_eq: $id}}, limit: 1) {
    ...FillQueryFields
    takerRemainingQuantity
    makerRemainingQuantity
    blockNumber
    logIndex
    marketRef: market {
      ...MarketRefFields
    }
  }
}
    fragment FillQueryFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  makerOrderId
  takerOrderId
  timestamp
  txHash
  takerOrder {
    owner
    side
  }
}
fragment MarketRefFields on Market {
  id
  marketType
  poolAddress
  marketAddress
  baseSymbol
  quoteSymbol
  baseDecimals
  quoteDecimals
  asset
  question
}`);
var OrderFillsDocument = new TypedDocumentString(`
    query OrderFills($pool: String!, $oid: numeric!, $limit: Int) {
  Fill(
    where: {pool: {_eq: $pool}, _or: [{takerOrderId: {_eq: $oid}}, {makerOrderId: {_eq: $oid}}]}
    order_by: [{timestamp: desc}, {blockNumber: desc}]
    limit: $limit
  ) {
    ...FillQueryFields
    takerRemainingQuantity
    makerRemainingQuantity
    blockNumber
    logIndex
  }
}
    fragment FillQueryFields on Fill {
  id
  market: market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  makerOrderId
  takerOrderId
  timestamp
  txHash
  takerOrder {
    owner
    side
  }
}`);
var TradeContextDocument = new TypedDocumentString(`
    query TradeContext($id: String!) {
  Fill_by_pk(id: $id) {
    ...TradeContextFillFields
    market {
      ...MarketFields
    }
    makerOrder {
      ...FillOrderFields
    }
    takerOrder {
      ...FillOrderFields
    }
  }
}
    fragment TradeContextFillFields on Fill {
  id
  market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  takerOrder {
    owner
    side
  }
  makerOrderId
  takerOrderId
  takerRemainingQuantity
  makerRemainingQuantity
  blockNumber
  timestamp
  logIndex
  txHash
}
fragment FillOrderFields on Order {
  id
  orderId
  owner
  isBid
  side
  price
  fullQuantity
  filledQuantity
  quantityRemaining
  status
  rested
  cancelReason
  placedAtTimestamp
  placedTxHash
}
fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var FillTxContextDocument = new TypedDocumentString(`
    query FillTxContext($timestamp: numeric!, $txHash: String!, $market: String!, $id: String!) {
  Fill(
    where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}, id: {_neq: $id}}
    order_by: [{blockNumber: desc}, {logIndex: desc}]
    limit: 100
  ) {
    ...TradeContextFillFields
  }
  ProtocolFeeRecord(
    where: {market_id: {_eq: $market}, timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: 100
  ) {
    ...ProtocolFeeFields
  }
  BuilderFeeRecord(
    where: {market_id: {_eq: $market}, timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
    order_by: {id: asc}
    limit: 100
  ) {
    ...BuilderFeeFields
  }
}
    fragment ProtocolFeeFields on ProtocolFeeRecord {
  id
  orderId
  recipient
  payer
  token
  amount
  isTakerSide
  market: market_id
  pool
  timestamp
  txHash
}
fragment BuilderFeeFields on BuilderFeeRecord {
  id
  orderId
  builder
  payer
  token
  amount
  market: market_id
  pool
  timestamp
  txHash
}
fragment TradeContextFillFields on Fill {
  id
  market_id
  pool
  fillPrice
  quantity
  quoteQuantity
  maker
  makerSide
  taker
  takerSide
  kind
  takerIsBid
  takerOrder {
    owner
    side
  }
  makerOrderId
  takerOrderId
  takerRemainingQuantity
  makerRemainingQuantity
  blockNumber
  timestamp
  logIndex
  txHash
}`);
var MarketCreatorsDocument = new TypedDocumentString(`
    query MarketCreators($where: MarketCreator_bool_exp!, $limit: Int, $offset: Int) {
  MarketCreator(
    where: $where
    order_by: {createdAtBlock: desc}
    limit: $limit
    offset: $offset
  ) {
    ...MarketCreatorFields
    series(order_by: {seriesId: asc}) {
      ...SeriesFields
    }
  }
}
    fragment SeriesFields on Series {
  id
  creatorAddress
  seriesId
  collateral
  asset
  intervalSec
  createdAtTimestamp
  updatedAtTimestamp
}
fragment MarketCreatorFields on MarketCreator {
  id
  owner
  policy
  core
  adapter
  operatorId
  venueId
  factory
  createdAtBlock
  createdAtTimestamp
}`);
var MarketCreatorByPkDocument = new TypedDocumentString(`
    query MarketCreatorByPk($id: String!) {
  MarketCreator_by_pk(id: $id) {
    ...MarketCreatorFields
    series(order_by: {seriesId: asc}) {
      ...SeriesFields
    }
  }
}
    fragment SeriesFields on Series {
  id
  creatorAddress
  seriesId
  collateral
  asset
  intervalSec
  createdAtTimestamp
  updatedAtTimestamp
}
fragment MarketCreatorFields on MarketCreator {
  id
  owner
  policy
  core
  adapter
  operatorId
  venueId
  factory
  createdAtBlock
  createdAtTimestamp
}`);
var OracleAdaptersDocument = new TypedDocumentString(`
    query OracleAdapters($where: OracleAdapter_bool_exp!, $limit: Int, $offset: Int) {
  OracleAdapter(
    where: $where
    order_by: {createdAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...OracleAdapterFields
  }
}
    fragment OracleAdapterFields on OracleAdapter {
  id
  owner
  factory
  approved
  approvedAtTimestamp
  createdAtTimestamp
}`);
var OracleAdapterByPkDocument = new TypedDocumentString(`
    query OracleAdapterByPk($id: String!) {
  OracleAdapter_by_pk(id: $id) {
    ...OracleAdapterFields
  }
}
    fragment OracleAdapterFields on OracleAdapter {
  id
  owner
  factory
  approved
  approvedAtTimestamp
  createdAtTimestamp
}`);
var SeriesByIdDocument = new TypedDocumentString(`
    query SeriesById($id: String!) {
  Series(where: {id: {_eq: $id}}, limit: 1) {
    ...SeriesFields
  }
}
    fragment SeriesFields on Series {
  id
  creatorAddress
  seriesId
  collateral
  asset
  intervalSec
  createdAtTimestamp
  updatedAtTimestamp
}`);
var SeriesListDocument = new TypedDocumentString(`
    query SeriesList($where: Series_bool_exp!, $limit: Int, $offset: Int) {
  Series(
    where: $where
    order_by: {createdAtTimestamp: asc}
    limit: $limit
    offset: $offset
  ) {
    ...SeriesFields
  }
}
    fragment SeriesFields on Series {
  id
  creatorAddress
  seriesId
  collateral
  asset
  intervalSec
  createdAtTimestamp
  updatedAtTimestamp
}`);
var RegistryMarketsDocument = new TypedDocumentString(`
    query RegistryMarkets($where: Market_bool_exp!, $limit: Int, $offset: Int) {
  Market(
    where: $where
    order_by: {createdAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var MarketsDocument = new TypedDocumentString(`
    query Markets($where: Market_bool_exp!, $limit: Int, $offset: Int) {
  Market(
    where: $where
    order_by: {createdAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var MarketByPkDocument = new TypedDocumentString(`
    query MarketByPk($id: String!) {
  Market_by_pk(id: $id) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var MarketByAddressDocument = new TypedDocumentString(`
    query MarketByAddress($a: String!) {
  Market(
    where: {marketAddress: {_eq: $a}}
    order_by: {createdAtTimestamp: desc}
    limit: 1
  ) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var BinaryMarketsDocument = new TypedDocumentString(`
    query BinaryMarkets($where: Market_bool_exp!, $orderBy: [Market_order_by!], $limit: Int) {
  Market(where: $where, order_by: $orderBy, limit: $limit) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var SpotMarketsDocument = new TypedDocumentString(`
    query SpotMarkets($where: Market_bool_exp!, $limit: Int) {
  Market(where: $where, order_by: {createdAtTimestamp: desc}, limit: $limit) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var PerpMarketsDocument = new TypedDocumentString(`
    query PerpMarkets($where: Market_bool_exp!, $limit: Int) {
  Market(where: $where, order_by: {createdAtTimestamp: desc}, limit: $limit) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var LiveBinaryMarketsDocument = new TypedDocumentString(`
    query LiveBinaryMarkets($where: Market_bool_exp!, $orderBy: [Market_order_by!], $limit: Int!, $offset: Int!) {
  Market(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var PastBinaryMarketsDocument = new TypedDocumentString(`
    query PastBinaryMarkets($where: Market_bool_exp!, $limit: Int!, $offset: Int!) {
  Market(where: $where, order_by: {expiry: desc}, limit: $limit, offset: $offset) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var BinaryOriginPairsDocument = new TypedDocumentString(`
    query BinaryOriginPairs {
  Market(
    distinct_on: [operatorId, venueId]
    where: {marketType: {_eq: "BINARY"}, operatorId: {_is_null: false}, venueId: {_is_null: false}}
    order_by: [{operatorId: asc}, {venueId: asc}]
  ) {
    operatorId
    venueId
  }
}
    `);
var BinaryAssetsDocument = new TypedDocumentString(`
    query BinaryAssets {
  Market(
    distinct_on: asset
    where: {marketType: {_eq: "BINARY"}, asset: {_is_null: false}}
    order_by: {asset: asc}
  ) {
    asset
  }
}
    `);
var MarketFeesDocument = new TypedDocumentString(`
    query MarketFees($id: String!) {
  MarketVenue_by_pk(id: $id) {
    operatorId
    venueId
    feeRecipient
    makerFeeBps
    takerFeeBps
    maxBuilderFeeBps
    routingFeeBps
    settlementFeeBps
    settlementFeesCollected
  }
}
    `);
var MarketStatusHistoryDocument = new TypedDocumentString(`
    query MarketStatusHistory($id: String!) {
  MarketStatusUpdate(where: {market_id: {_eq: $id}}, order_by: {timestamp: asc}) {
    oldStatus
    newStatus
    blockNumber
    timestamp
    txHash
  }
}
    `);
var OracleAnswersByQidDocument = new TypedDocumentString(`
    query OracleAnswersByQid($qids: [String!]) {
  OracleAnswer(where: {id: {_in: $qids}}) {
    id
    numericValue
    voided
  }
}
    `);
var ResolutionQidsDocument = new TypedDocumentString(`
    query ResolutionQids($ids: [String!]) {
  Market(where: {id: {_in: $ids}}) {
    id
    oracleQuestionId
  }
}
    `);
var OpeningRefsDocument = new TypedDocumentString(`
    query OpeningRefs($ids: [String!]) {
  MarketReferenceLink(where: {market_id: {_in: $ids}}) {
    market: market_id
    referenceQuestionId
  }
}
    `);
var OperatorsDocument = new TypedDocumentString(`
    query Operators($where: Operator_bool_exp!, $limit: Int, $offset: Int) {
  Operator(
    where: $where
    order_by: {operatorId: desc}
    limit: $limit
    offset: $offset
  ) {
    ...OperatorFields
  }
}
    fragment OperatorFields on Operator {
  operatorId
  owner
  feeRecipient
  enabled
  policy
  context
  pendingOwner
  venueCount
  createdAtTimestamp
  updatedAtTimestamp
  marketCount
  cumulativeQuoteVolume
  protocolFeesCollected
  settlementFeesCollected
  builderFeesCollected
}`);
var OperatorByPkDocument = new TypedDocumentString(`
    query OperatorByPk($id: String!) {
  Operator_by_pk(id: $id) {
    ...OperatorFields
  }
}
    fragment OperatorFields on Operator {
  operatorId
  owner
  feeRecipient
  enabled
  policy
  context
  pendingOwner
  venueCount
  createdAtTimestamp
  updatedAtTimestamp
  marketCount
  cumulativeQuoteVolume
  protocolFeesCollected
  settlementFeesCollected
  builderFeesCollected
}`);
var VenuesDocument = new TypedDocumentString(`
    query Venues($where: Venue_bool_exp!, $limit: Int, $offset: Int) {
  Venue(
    where: $where
    order_by: {createdAtTimestamp: asc}
    limit: $limit
    offset: $offset
  ) {
    ...VenueFields
  }
}
    fragment VenueFields on Venue {
  venueId
  operatorId
  marketType
  feeParams
  feeRecipientOverride
  policy
  signer
  creationEnabled
  context
  createdAtTimestamp
  updatedAtTimestamp
  marketCount
  cumulativeQuoteVolume
  protocolFeesCollected
  settlementFeesCollected
  builderFeesCollected
}`);
var VenueByPkDocument = new TypedDocumentString(`
    query VenueByPk($id: String!) {
  Venue_by_pk(id: $id) {
    ...VenueFields
  }
}
    fragment VenueFields on Venue {
  venueId
  operatorId
  marketType
  feeParams
  feeRecipientOverride
  policy
  signer
  creationEnabled
  context
  createdAtTimestamp
  updatedAtTimestamp
  marketCount
  cumulativeQuoteVolume
  protocolFeesCollected
  settlementFeesCollected
  builderFeesCollected
}`);
var OracleQuestionDocument = new TypedDocumentString(`
    query OracleQuestion($id: String!) {
  OracleQuestion_by_pk(id: $id) {
    ...OracleQuestionFields
  }
}
    fragment OracleQuestionFields on OracleQuestion {
  id
  questionKey
  scheduler
  oracleCost
  bindCount
  reuseCount
  createdAtBlock
  createdAtTimestamp
}`);
var OracleQuestionsDocument = new TypedDocumentString(`
    query OracleQuestions($where: OracleQuestion_bool_exp!, $limit: Int, $offset: Int) {
  OracleQuestion(
    where: $where
    order_by: {createdAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...OracleQuestionFields
  }
}
    fragment OracleQuestionFields on OracleQuestion {
  id
  questionKey
  scheduler
  oracleCost
  bindCount
  reuseCount
  createdAtBlock
  createdAtTimestamp
}`);
var OperatorHubAccountDocument = new TypedDocumentString(`
    query OperatorHubAccount($id: String!) {
  OperatorHubAccount_by_pk(id: $id) {
    ...OperatorHubAccountFields
  }
}
    fragment OperatorHubAccountFields on OperatorHubAccount {
  id
  operatorId
  earmarked
  credit
  outstanding
  createdAtBlock
  createdAtTimestamp
  updatedAtBlock
  updatedAtTimestamp
}`);
var OperatorHubAccountsDocument = new TypedDocumentString(`
    query OperatorHubAccounts($limit: Int, $offset: Int) {
  OperatorHubAccount(
    order_by: {updatedAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...OperatorHubAccountFields
  }
}
    fragment OperatorHubAccountFields on OperatorHubAccount {
  id
  operatorId
  earmarked
  credit
  outstanding
  createdAtBlock
  createdAtTimestamp
  updatedAtBlock
  updatedAtTimestamp
}`);
var OracleBindsDocument = new TypedDocumentString(`
    query OracleBinds($where: OracleBind_bool_exp!, $limit: Int, $offset: Int) {
  OracleBind(
    where: $where
    order_by: {boundAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...OracleBindFields
  }
}
    fragment OracleBindFields on OracleBind {
  id
  oracleQuestionId
  bindIndex
  operatorId
  measuredGas
  overheadShare
  cost
  charged
  subsidy
  resolvedAt
  boundAtBlock
  boundAtTimestamp
  txHash
}`);
var OracleCallbacksDocument = new TypedDocumentString(`
    query OracleCallbacks($limit: Int, $offset: Int) {
  OracleCallback(order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
    ...OracleCallbackFields
  }
}
    fragment OracleCallbackFields on OracleCallback {
  id
  marketsResolved
  gasPrice
  measuredGas
  overheadGasAttributed
  totalCost
  totalCharged
  subsidy
  pendingRemaining
  blockNumber
  timestamp
  txHash
}`);
var SweepableOrdersDocument = new TypedDocumentString(`
    query SweepableOrders($where: Order_bool_exp!, $limit: Int, $offset: Int) {
  Order(
    where: $where
    order_by: [{expireTimestampNs: asc}, {id: asc}]
    limit: $limit
    offset: $offset
  ) {
    id
    orderId
    owner
    isBid
    price
    quantityRemaining
    expireTimestampNs
    placedAtTimestamp
    market: market_id
    marketRow: market {
      poolAddress
      marketType
      ...OrderMarketFields
    }
  }
}
    fragment OrderMarketFields on Market {
  marketAddress
  asset
  question
  expiry
  tradingStart
  quoteDecimals
  intervalSec
}`);
var OpenOrdersDocument = new TypedDocumentString(`
    query OpenOrders($where: Order_bool_exp!, $limit: Int, $offset: Int) {
  Order(
    where: $where
    order_by: {placedAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    orderId
    side
    isBid
    price
    quantityRemaining
    market: market_id
    marketRow: market {
      poolAddress
      ...OrderMarketFields
    }
  }
}
    fragment OrderMarketFields on Market {
  marketAddress
  asset
  question
  expiry
  tradingStart
  quoteDecimals
  intervalSec
}`);
var OrdersDocument = new TypedDocumentString(`
    query Orders($where: Order_bool_exp!, $limit: Int, $offset: Int) {
  Order(
    where: $where
    order_by: {placedAtTimestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    orderId
    side
    isBid
    price
    quantityRemaining
    fullQuantity
    filledQuantity
    status
    rested
    expireTimestampNs
    placedTxHash
    placedAtTimestamp
    cancelReason
    amendedFromOrderId
    amendedToOrderId
    market: market_id
    marketRow: market {
      poolAddress
      ...OrderMarketFields
    }
  }
}
    fragment OrderMarketFields on Market {
  marketAddress
  asset
  question
  expiry
  tradingStart
  quoteDecimals
  intervalSec
}`);
var OrderDetailDocument = new TypedDocumentString(`
    query OrderDetail($id: String!) {
  Order(where: {id: {_eq: $id}}, limit: 1) {
    id
    orderId
    owner
    userData
    side
    isBid
    price
    quantityRemaining
    fullQuantity
    filledQuantity
    status
    rested
    expireTimestampNs
    placedTxHash
    placedAtTimestamp
    placedAtBlock
    lastUpdatedAtTimestamp
    cancelReason
    amendedFromOrderId
    amendedToOrderId
    market: market_id
    marketRow: market {
      poolAddress
      ...OrderMarketFields
    }
    marketRef: market {
      ...MarketRefFields
    }
  }
}
    fragment MarketRefFields on Market {
  id
  marketType
  poolAddress
  marketAddress
  baseSymbol
  quoteSymbol
  baseDecimals
  quoteDecimals
  asset
  question
}
fragment OrderMarketFields on Market {
  marketAddress
  asset
  question
  expiry
  tradingStart
  quoteDecimals
  intervalSec
}`);
var BookTopsDocument = new TypedDocumentString(`
    query BookTops($bidWhere: Order_bool_exp!, $askWhere: Order_bool_exp!) {
  bids: Order(
    where: $bidWhere
    distinct_on: market_id
    order_by: [{market_id: desc}, {price: desc}]
  ) {
    market: market_id
    price
  }
  asks: Order(
    where: $askWhere
    distinct_on: market_id
    order_by: [{market_id: asc}, {price: asc}]
  ) {
    market: market_id
    price
  }
}
    `);
var FundingPaymentsDocument = new TypedDocumentString(`
    query FundingPayments($where: FundingPayment_bool_exp!, $limit: Int, $offset: Int) {
  FundingPayment(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    account
    pool
    amount
    timestamp
    txHash
  }
}
    `);
var MarginEventsDocument = new TypedDocumentString(`
    query MarginEvents($account: String!, $limit: Int, $offset: Int) {
  MarginEvent(
    where: {account: {_eq: $account}}
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    account
    kind
    pool
    amount
    granter
    timestamp
    txHash
  }
}
    `);
var LiquidationsDocument = new TypedDocumentString(`
    query Liquidations($where: LiquidationEvent_bool_exp!, $limit: Int, $offset: Int) {
  LiquidationEvent(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    account
    pool
    kind
    size
    price
    counterparty
    penalty
    badDebt
    insuranceCovered
    deficit
    coverageDeclined
    collateralAmount
    equity
    positionsProcessed
    stageReached
    marginStatusBefore
    marginStatusAfter
    timestamp
    blockNumber
    txHash
  }
}
    `);
var FundingRateHistoryDocument = new TypedDocumentString(`
    query FundingRateHistory($where: FundingRateUpdate_bool_exp!, $orderBy: [FundingRateUpdate_order_by!], $limit: Int, $offset: Int) {
  FundingRateUpdate(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    id
    pool
    fundingRate
    cumulativeFundingPerUnit
    indexPrice
    markPrice
    intervalsSettled
    intervalsAccrued
    fundingWindowSec
    fundingIntervalSec
    spanStart
    spanEnd
    anchorResynced
    timestamp
    blockNumber
    txHash
  }
}
    `);
var FundingRateCandlesDocument = new TypedDocumentString(`
    query FundingRateCandles($where: FundingRateCandle_bool_exp!, $limit: Int, $offset: Int) {
  FundingRateCandle(
    where: $where
    order_by: {bucketStart: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    pool
    intervalSeconds
    bucketStart
    avgFundingRate8h
    minFundingRate8h
    maxFundingRate8h
    coverage
    cumulativeFundingStart
    cumulativeFundingEnd
    fundingWindowSec
    fundingIntervalSec
    paramsChangedInBucket
    indexPriceEnd
    openInterestEnd
    updateCount
  }
}
    `);
var PerpFeesDocument = new TypedDocumentString(`
    query PerpFees($where: PerpFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
  PerpFeeRecord(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    account
    pool
    amount
    isRebate
    kind
    insurancePortion
    tier
    fillNotional
    builder
    timestamp
    txHash
  }
}
    `);
var OpenInterestHistoryDocument = new TypedDocumentString(`
    query OpenInterestHistory($pool: String!, $limit: Int, $offset: Int) {
  OpenInterestSnapshot(
    where: {pool: {_eq: $pool}}
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    pool
    openInterest
    timestamp
    blockNumber
  }
}
    `);
var PerpPortfolioDocument = new TypedDocumentString(`
    query PerpPortfolio($acct: String!, $fillWhere: Fill_bool_exp!, $ordersLimit: Int, $tradesLimit: Int) {
  PerpOrder: Order(
    where: {owner: {_eq: $acct}, status: {_eq: "Open"}, market: {marketType: {_eq: "PERP"}}}
    order_by: {placedAtTimestamp: desc}
    limit: $ordersLimit
  ) {
    id
    orderId
    isBid
    price
    quantityRemaining
    filledQuantity
    fullQuantity
    placedAtTimestamp
    placedTxHash
    market {
      ...PerpPortfolioMarketFields
    }
  }
  PerpFill: Fill(
    where: $fillWhere
    order_by: {timestamp: desc}
    limit: $tradesLimit
  ) {
    id
    fillPrice
    quantity
    quoteQuantity
    timestamp
    txHash
    maker
    taker
    takerIsBid
    market {
      ...PerpPortfolioMarketFields
    }
  }
}
    fragment PerpPortfolioMarketFields on Market {
  poolAddress
  baseSymbol
  quoteSymbol
  baseDecimals
  quoteDecimals
  tickSize
  lotSize
  minQuantity
  lastPrice
  marginBank
  initialMarginBps
  fundingRate
  indexPrice
  stopRegistry
}`);
var PerpOrderHistoryDocument = new TypedDocumentString(`
    query PerpOrderHistory($where: Order_bool_exp!, $orderBy: [Order_order_by!], $limit: Int, $offset: Int) {
  Order(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
    id
    orderId
    isBid
    price
    quantityRemaining
    filledQuantity
    fullQuantity
    status
    rested
    expireTimestampNs
    placedAtTimestamp
    placedTxHash
    lastUpdatedAtTimestamp
    market {
      ...PerpPortfolioMarketFields
    }
  }
}
    fragment PerpPortfolioMarketFields on Market {
  poolAddress
  baseSymbol
  quoteSymbol
  baseDecimals
  quoteDecimals
  tickSize
  lotSize
  minQuantity
  lastPrice
  marginBank
  initialMarginBps
  fundingRate
  indexPrice
  stopRegistry
}`);
var PerpPositionsDocument = new TypedDocumentString(`
    query PerpPositions($where: PerpPosition_bool_exp!, $limit: Int, $offset: Int) {
  PerpPosition(
    where: $where
    order_by: {updatedAt: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    pool
    account
    size
    isLong
    entryPriceX18
    realizedPnl
    updatedAt
    updatedAtBlock
  }
}
    `);
var PerpStopOrdersDocument = new TypedDocumentString(`
    query PerpStopOrders($where: StopOrder_bool_exp!, $limit: Int, $offset: Int) {
  StopOrder(
    where: $where
    order_by: [{createdAt: desc}, {id: desc}]
    limit: $limit
    offset: $offset
  ) {
    id
    registry
    orderIdRaw
    owner
    isBid
    quantity
    triggerPrice
    triggerOperator
    orderType
    builder
    builderFeeBpsTimes1k
    status
    placedOrderId
    dropReason
    createdAt
    updatedAt
    txHash
    market {
      poolAddress
      baseSymbol
      quoteSymbol
      baseDecimals
      quoteDecimals
    }
  }
}
    `);
var MarketsByPoolDocument = new TypedDocumentString(`
    query MarketsByPool($pool: String!, $limit: Int) {
  Market(
    where: {poolAddress: {_eq: $pool}}
    order_by: {createdAtTimestamp: desc}
    limit: $limit
  ) {
    ...MarketFields
  }
}
    fragment MarketFields on Market {
  id
  marketType
  poolAddress
  lastPrice
  lastTradeAt
  cumulativeBaseVolume
  cumulativeQuoteVolume
  tradeCount
  baseDecimals
  quoteDecimals
  createdAtTimestamp
  createdAtBlock
  baseToken
  quoteToken
  baseSymbol
  quoteSymbol
  baseIsNative
  tickSize
  lotSize
  minQuantity
  markPrice
  rawMidpoint
  markPriceUpdatedAt
  stopRegistry
  marginBank
  initialMarginBps
  fundingRate
  cumulativeFundingPerUnit
  indexPrice
  fundingUpdatedAt
  fundingWindowSec
  fundingIntervalSec
  openInterest
  openInterestUpdatedAt
  marketId
  marketAddress
  yesTokenId
  noTokenId
  collateral
  asset
  question
  oracleQuestion
  oracleQuestionId
  status: clobStatus
  strike
  tradingStart
  expiry
  winningOutcome
  payoutNumerators
  payoutDenominator
  resolvedAtBlock
  resolvedAtTimestamp
  createdByTx
  creator
  voided
  backing
  nonce
  finalized
  netBacking
  context
  intervalSec
  operatorId
  venueId
  voidPolicy
}`);
var PoolBindingsDocument = new TypedDocumentString(`
    query PoolBindings($pool: String!) {
  PoolBinding(where: {poolAddress: {_eq: $pool}}, order_by: {nonce: desc}) {
    id
    poolAddress
    marketId
    nonce
    fromBlock
    fromLogIndex
    fromTimestamp
    toBlock
    toLogIndex
    toTimestamp
    closedBy
  }
}
    `);
var PoolByPkDocument = new TypedDocumentString(`
    query PoolByPk($id: String!) {
  Pool_by_pk(id: $id) {
    id
    address
    collateral
    creator
    currentMarketId
    currentNonce
    generationCount
    createdAtTimestamp
    updatedAtTimestamp
  }
}
    `);
var RouterActionsDocument = new TypedDocumentString(`
    query RouterActions($where: RouterActionRecord_bool_exp!, $limit: Int, $offset: Int) {
  RouterActionRecord(
    where: $where
    order_by: {timestamp: desc}
    limit: $limit
    offset: $offset
  ) {
    ...RouterActionFields
  }
}
    fragment RouterActionFields on RouterActionRecord {
  id
  kind
  account
  market: market_id
  amount
  payout
  routedVia
  timestamp
  txHash
}`);
var SpotPortfolioDocument = new TypedDocumentString(`
    query SpotPortfolio($acct: String!, $fillWhere: Fill_bool_exp!, $ordersLimit: Int, $tradesLimit: Int) {
  SpotOrder: Order(
    where: {owner: {_eq: $acct}, status: {_eq: "Open"}, market: {marketType: {_eq: "SPOT"}}}
    order_by: {placedAtTimestamp: desc}
    limit: $ordersLimit
  ) {
    id
    orderId
    isBid
    price
    quantityRemaining
    filledQuantity
    fullQuantity
    placedAtTimestamp
    placedTxHash
    market {
      ...SpotPortfolioMarketFields
    }
  }
  SpotStopOrder: StopOrder(
    where: {owner: {_eq: $acct}, status: {_eq: "PENDING"}}
    order_by: {createdAt: desc}
    limit: $ordersLimit
  ) {
    ...SpotStopOrderFields
    market {
      ...SpotPortfolioMarketFields
    }
  }
  SpotFill: Fill(
    where: $fillWhere
    order_by: {timestamp: desc}
    limit: $tradesLimit
  ) {
    id
    fillPrice
    quantity
    quoteQuantity
    timestamp
    txHash
    maker
    taker
    takerIsBid
    market {
      ...SpotPortfolioMarketFields
    }
  }
}
    fragment SpotPortfolioMarketFields on Market {
  poolAddress
  baseSymbol
  quoteSymbol
  baseToken
  quoteToken
  baseDecimals
  quoteDecimals
  baseIsNative
  tickSize
  lotSize
  minQuantity
  lastPrice
  markPrice
  stopRegistry
}
fragment SpotStopOrderFields on StopOrder {
  id
  registry
  orderId: orderIdRaw
  isBid
  quantity
  triggerPrice
  triggerOperator
  orderType
  status
  placedOrderId
  createdAt
}`);
var SpotStopOrdersDocument = new TypedDocumentString(`
    query SpotStopOrders($where: StopOrder_bool_exp!, $limit: Int) {
  StopOrder(where: $where, order_by: {createdAt: desc}, limit: $limit) {
    ...SpotStopOrderFields
    market {
      ...SpotPortfolioMarketFields
    }
  }
}
    fragment SpotPortfolioMarketFields on Market {
  poolAddress
  baseSymbol
  quoteSymbol
  baseToken
  quoteToken
  baseDecimals
  quoteDecimals
  baseIsNative
  tickSize
  lotSize
  minQuantity
  lastPrice
  markPrice
  stopRegistry
}
fragment SpotStopOrderFields on StopOrder {
  id
  registry
  orderId: orderIdRaw
  isBid
  quantity
  triggerPrice
  triggerOperator
  orderType
  status
  placedOrderId
  createdAt
}`);
var SyncStatusDocument = new TypedDocumentString(`
    query SyncStatus($chainId: Int!) {
  chain_metadata(where: {chain_id: {_eq: $chainId}}) {
    chain_id
    latest_processed_block
    block_height
    num_events_processed
  }
}
    `);

// node_modules/@somnia-chain/markets-sdk/dist/gql/gql.js
var documents = {
  "\n  fragment ActivityFillFields on Fill {\n    id\n    market: market_id\n    pool\n    fillPrice\n    quantity\n    quoteQuantity\n    maker\n    makerSide\n    taker\n    takerSide\n    takerIsBid\n    # The taker's ORDER, not only the denormalized copy on the fill: Fill.takerSide\n    # is backfilled by the PendingTakerFill bridge and stays null on a binary row\n    # until BinaryOrderPlaced lands, while the order names the side from the start.\n    # Same precedence fills.ts documents on FillRow.takerOrder.\n    takerOrder { owner side }\n    blockNumber\n    timestamp\n    txHash\n  }\n": ActivityFillFieldsFragmentDoc,
  "\n  fragment ActivityRouterFields on RouterActionRecord {\n    id\n    kind\n    market: market_id\n    account\n    amount\n    payout\n    routedVia\n    blockNumber\n    timestamp\n    txHash\n  }\n": ActivityRouterFieldsFragmentDoc,
  "\n  fragment ActivityResolutionFields on MarketResolutionEvent {\n    id\n    kind\n    market: market_id\n    outcomeIdx\n    voided\n    blockNumber\n    timestamp\n    txHash\n  }\n": ActivityResolutionFieldsFragmentDoc,
  "\n  fragment ActivityStatusFields on MarketStatusUpdate {\n    id\n    market: market_id\n    oldStatus\n    newStatus\n    blockNumber\n    timestamp\n    txHash\n  }\n": ActivityStatusFieldsFragmentDoc,
  "\n  query MarketActivity(\n         $fillWhere: Fill_bool_exp!\n         $routerWhere: RouterActionRecord_bool_exp!\n         $resolutionWhere: MarketResolutionEvent_bool_exp!\n         $statusWhere: MarketStatusUpdate_bool_exp!\n         $fillLimit: Int!\n         $routerLimit: Int!\n         $resolutionLimit: Int!\n         $statusLimit: Int!\n       ) {\n         Fill(where: $fillWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {logIndex: desc}], limit: $fillLimit) {\n           ...ActivityFillFields\n         }\n         RouterActionRecord(where: $routerWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}], limit: $routerLimit) {\n           ...ActivityRouterFields\n         }\n         MarketResolutionEvent(where: $resolutionWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}], limit: $resolutionLimit) {\n           ...ActivityResolutionFields\n         }\n         MarketStatusUpdate(where: $statusWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}], limit: $statusLimit) {\n           ...ActivityStatusFields\n         }\n       }\n": MarketActivityDocument,
  "\n  fragment TransactionOrderFields on Order {\n    id\n    orderId\n    market_id\n    owner\n    isBid\n    side\n    price\n    fullQuantity\n    filledQuantity\n    quantityRemaining\n    status\n    rested\n    cancelReason\n    placedAtTimestamp\n    placedTxHash\n  }\n": TransactionOrderFieldsFragmentDoc,
  "\n  query TransactionEvents($txHash: String!, $limit: Int!) {\n         Fill(where: {txHash: {_eq: $txHash}}, order_by: {logIndex: asc}, limit: $limit) {\n           ...ActivityFillFields\n         }\n         RouterActionRecord(where: {txHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {\n           ...ActivityRouterFields\n         }\n         MarketResolutionEvent(where: {txHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {\n           ...ActivityResolutionFields\n         }\n         MarketStatusUpdate(where: {txHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {\n           ...ActivityStatusFields\n         }\n       }\n": TransactionEventsDocument,
  "\n  query TransactionOrderAnchor($txHash: String!, $limit: Int!) {\n         Order(where: {placedTxHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {\n           ...TransactionOrderFields\n           placedAtBlock\n         }\n       }\n": TransactionOrderAnchorDocument,
  "\n  query TransactionContext($txHash: String!, $timestamp: numeric!, $marketIds: [String!]!, $limit: Int!, $orderLimit: Int!) {\n         Order(\n           where: {placedAtTimestamp: {_eq: $timestamp}, placedTxHash: {_eq: $txHash}}\n           order_by: {id: asc}\n           limit: $orderLimit\n         ) {\n           ...TransactionOrderFields\n         }\n         ProtocolFeeRecord(\n           where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}\n           order_by: {id: asc}\n           limit: $limit\n         ) {\n           ...ProtocolFeeFields\n         }\n         BuilderFeeRecord(\n           where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}\n           order_by: {id: asc}\n           limit: $limit\n         ) {\n           ...BuilderFeeFields\n         }\n         Market(where: {id: {_in: $marketIds}}) {\n           ...MarketFields\n         }\n       }\n": TransactionContextDocument,
  "\n  fragment PortfolioMarketFields on Market {\n    id\n    marketAddress\n    poolAddress\n    asset\n    question\n    status: clobStatus\n    lastPrice\n    strike\n    expiry\n    winningOutcome\n    voided\n    quoteDecimals\n    intervalSec\n  }\n": PortfolioMarketFieldsFragmentDoc,
  '\n  query Portfolio($acct: String!, $fillWhere: Fill_bool_exp!, $ordersLimit: Int, $tradesLimit: Int) {\n    OutcomeBalance(\n      where: { account: { _eq: $acct }, balance: { _gt: "0" } }\n      order_by: { balance: desc }\n      limit: 200\n    ) {\n      outcomeIndex\n      tokenId\n      balance\n      market {\n        ...PortfolioMarketFields\n      }\n    }\n    ClobOrder: Order(\n      where: {\n        owner: { _eq: $acct }\n        status: { _eq: "Open" }\n        market: { marketType: { _eq: "BINARY" } }\n      }\n      order_by: { placedAtTimestamp: desc }\n      limit: $ordersLimit\n    ) {\n      id\n      orderId\n      side\n      price\n      quantityRemaining\n      filledQuantity\n      fullQuantity\n      placedAtTimestamp\n      placedTxHash\n      market {\n        ...PortfolioMarketFields\n      }\n    }\n    ClobFill: Fill(where: $fillWhere, order_by: { timestamp: desc }, limit: $tradesLimit) {\n      id\n      fillPrice\n      quantity\n      timestamp\n      txHash\n      maker\n      makerSide\n      takerOrder {\n        owner\n        side\n      }\n      market {\n        marketAddress\n        asset\n        quoteDecimals\n      }\n    }\n  }\n': PortfolioDocument,
  "\n  query OutcomeBalances($acct: String!, $mkt: String!) {\n        OutcomeBalance(where: {account: {_eq: $acct}, market: {marketAddress: {_eq: $mkt}}}) { outcomeIndex balance }\n      }\n": OutcomeBalancesDocument,
  "\n  query VaultPayoutFallbacks($where: VaultPayoutFallback_bool_exp!, $limit: Int, $offset: Int) {\n         VaultPayoutFallback(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {\n           id owner token amount market: market_id timestamp txHash\n         }\n       }\n": VaultPayoutFallbacksDocument,
  "\n  query MarketResolution($id: String!) {\n         MarketResolutionEvent(where: {market_id: {_eq: $id}}, order_by: {timestamp: asc}) {\n           id market: market_id kind winningOutcome: outcomeIdx payoutNumerators payoutDenominator voided blockNumber timestamp txHash\n         }\n         MarketReferenceLink(where: {market_id: {_eq: $id}}, limit: 1) {\n           id market: market_id oracleQuestionId: referenceQuestionId pending\n         }\n         Market_by_pk(id: $id) { oracleQuestionId }\n       }\n": MarketResolutionDocument,
  "\n  query OracleAnswers($closingQid: String!, $openingQid: String!) {\n         closing: OracleAnswer_by_pk(id: $closingQid) { oracleQuestionId numericValue outcomeLabel voidReason resolvedAt txHash }\n         opening: OracleAnswer_by_pk(id: $openingQid) { oracleQuestionId numericValue outcomeLabel voidReason resolvedAt txHash }\n       }\n": OracleAnswersDocument,
  "\n  query Candles($where: Candle_bool_exp!, $limit: Int) {\n        Candle(where: $where, order_by: {bucketStart: desc}, limit: $limit) {\n          bucketStart openPrice high low closePrice baseVolume quoteVolume tradeCount\n        }\n      }\n": CandlesDocument,
  "\n  fragment ProtocolFeeFields on ProtocolFeeRecord {\n    id\n    orderId\n    recipient\n    payer\n    token\n    amount\n    isTakerSide\n    market: market_id\n    pool\n    timestamp\n    txHash\n  }\n": ProtocolFeeFieldsFragmentDoc,
  "\n  fragment BuilderFeeFields on BuilderFeeRecord {\n    id\n    orderId\n    builder\n    payer\n    token\n    amount\n    market: market_id\n    pool\n    timestamp\n    txHash\n  }\n": BuilderFeeFieldsFragmentDoc,
  "\n  fragment SettlementFeeFields on SettlementFeeRecord {\n    id\n    recipient: feeRecipient\n    amount: fee\n    winningBacking\n    market: market_id\n    timestamp\n    txHash\n  }\n": SettlementFeeFieldsFragmentDoc,
  "\n  query BuilderApprovals($where: BuilderApproval_bool_exp!, $limit: Int, $offset: Int) {\n         BuilderApproval(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {\n           id market_id market { poolAddress } user builder maxFeeBpsTimes1k blockNumber timestamp txHash\n         }\n       }\n": BuilderApprovalsDocument,
  "\n  query ProtocolFees($where: ProtocolFeeRecord_bool_exp!, $limit: Int, $offset: Int) {\n         ProtocolFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...ProtocolFeeFields }\n       }\n": ProtocolFeesDocument,
  "\n  query BuilderFees($where: BuilderFeeRecord_bool_exp!, $limit: Int, $offset: Int) {\n         BuilderFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...BuilderFeeFields }\n       }\n": BuilderFeesDocument,
  "\n  query SettlementFees($where: SettlementFeeRecord_bool_exp!, $limit: Int, $offset: Int) {\n         SettlementFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...SettlementFeeFields }\n       }\n": SettlementFeesDocument,
  "\n  fragment FillQueryFields on Fill {\n    id\n    market: market_id\n    pool\n    fillPrice\n    quantity\n    quoteQuantity\n    maker\n    makerSide\n    taker\n    takerSide\n    kind\n    takerIsBid\n    makerOrderId\n    takerOrderId\n    timestamp\n    txHash\n    # The taker's ORDER, not just the denormalized copy on the fill. On binary\n    # the fill's takerSide is backfilled by the PendingTakerFill bridge only\n    # once BinaryOrderPlaced lands, so it can still be null on a row whose\n    # taker is already stamped. The Order carries the authoritative side from\n    # the moment it exists, which is what the portfolio reads have always used.\n    takerOrder { owner side }\n  }\n": FillQueryFieldsFragmentDoc,
  "\n  query Fills($where: Fill_bool_exp!, $limit: Int, $offset: Int) {\n        Fill(where: $where, order_by: [{timestamp: desc}, {blockNumber: desc}], limit: $limit, offset: $offset) {\n          ...FillQueryFields\n        }\n      }\n": FillsDocument,
  "\n  query UserFills($where: Fill_bool_exp!, $limit: Int, $offset: Int) {\n        Fill(where: $where, order_by: [{timestamp: desc}, {blockNumber: desc}], limit: $limit, offset: $offset) {\n          ...FillQueryFields\n        }\n      }\n": UserFillsDocument,
  "\n  fragment MarketRefFields on Market {\n    id marketType poolAddress marketAddress baseSymbol quoteSymbol\n    baseDecimals quoteDecimals asset question\n  }\n": MarketRefFieldsFragmentDoc,
  "\n  query FillDetail($id: String!) {\n        Fill(where: { id: { _eq: $id } }, limit: 1) {\n          ...FillQueryFields\n          takerRemainingQuantity makerRemainingQuantity\n          blockNumber logIndex\n          marketRef: market { ...MarketRefFields }\n        }\n      }\n": FillDetailDocument,
  "\n  query OrderFills($pool: String!, $oid: numeric!, $limit: Int) {\n        Fill(\n          where: { pool: { _eq: $pool }, _or: [{ takerOrderId: { _eq: $oid } }, { makerOrderId: { _eq: $oid } }] }\n          order_by: [{timestamp: desc}, {blockNumber: desc}]\n          limit: $limit\n        ) {\n          ...FillQueryFields\n          takerRemainingQuantity makerRemainingQuantity\n          blockNumber logIndex\n        }\n      }\n": OrderFillsDocument,
  "\n  fragment TradeContextFillFields on Fill {\n    id\n    market_id\n    pool\n    fillPrice\n    quantity\n    quoteQuantity\n    maker\n    makerSide\n    taker\n    takerSide\n    kind\n    takerIsBid\n    takerOrder { owner side }\n    makerOrderId\n    takerOrderId\n    takerRemainingQuantity\n    makerRemainingQuantity\n    blockNumber\n    timestamp\n    logIndex\n    txHash\n  }\n": TradeContextFillFieldsFragmentDoc,
  "\n  fragment FillOrderFields on Order {\n    id\n    orderId\n    owner\n    isBid\n    side\n    price\n    fullQuantity\n    filledQuantity\n    quantityRemaining\n    status\n    rested\n    cancelReason\n    placedAtTimestamp\n    placedTxHash\n  }\n": FillOrderFieldsFragmentDoc,
  "\n  query TradeContext($id: String!) {\n         Fill_by_pk(id: $id) {\n           ...TradeContextFillFields\n           market { ...MarketFields }\n           makerOrder { ...FillOrderFields }\n           takerOrder { ...FillOrderFields }\n         }\n       }\n": TradeContextDocument,
  "\n  query FillTxContext($timestamp: numeric!, $txHash: String!, $market: String!, $id: String!) {\n         Fill(\n           where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}, id: {_neq: $id}}\n           order_by: [{blockNumber: desc}, {logIndex: desc}]\n           limit: 100\n         ) {\n           ...TradeContextFillFields\n         }\n         ProtocolFeeRecord(\n           where: {market_id: {_eq: $market}, timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}\n           order_by: {id: asc}\n           limit: 100\n         ) {\n           ...ProtocolFeeFields\n         }\n         BuilderFeeRecord(\n           where: {market_id: {_eq: $market}, timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}\n           order_by: {id: asc}\n           limit: 100\n         ) {\n           ...BuilderFeeFields\n         }\n       }\n": FillTxContextDocument,
  "\n  fragment SeriesFields on Series {\n    id\n    creatorAddress\n    seriesId\n    collateral\n    asset\n    intervalSec\n    createdAtTimestamp\n    updatedAtTimestamp\n  }\n": SeriesFieldsFragmentDoc,
  "\n  fragment MarketCreatorFields on MarketCreator {\n    id\n    owner\n    policy\n    core\n    adapter\n    operatorId\n    venueId\n    factory\n    createdAtBlock\n    createdAtTimestamp\n  }\n": MarketCreatorFieldsFragmentDoc,
  "\n  fragment OracleAdapterFields on OracleAdapter {\n    id\n    owner\n    factory\n    approved\n    approvedAtTimestamp\n    createdAtTimestamp\n  }\n": OracleAdapterFieldsFragmentDoc,
  "\n  query MarketCreators($where: MarketCreator_bool_exp!, $limit: Int, $offset: Int) {\n         MarketCreator(where: $where, order_by: {createdAtBlock: desc}, limit: $limit, offset: $offset) {\n           ...MarketCreatorFields\n           series(order_by: {seriesId: asc}) { ...SeriesFields }\n         }\n       }\n": MarketCreatorsDocument,
  "\n  query MarketCreatorByPk($id: String!) {\n         MarketCreator_by_pk(id: $id) {\n           ...MarketCreatorFields\n           series(order_by: {seriesId: asc}) { ...SeriesFields }\n         }\n       }\n": MarketCreatorByPkDocument,
  "\n  query OracleAdapters($where: OracleAdapter_bool_exp!, $limit: Int, $offset: Int) {\n         OracleAdapter(where: $where, order_by: {createdAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OracleAdapterFields }\n       }\n": OracleAdaptersDocument,
  "\n  query OracleAdapterByPk($id: String!) { OracleAdapter_by_pk(id: $id) { ...OracleAdapterFields } }\n": OracleAdapterByPkDocument,
  "\n  query SeriesById($id: String!) {\n         Series(where: { id: { _eq: $id } }, limit: 1) { ...SeriesFields }\n       }\n": SeriesByIdDocument,
  "\n  query SeriesList($where: Series_bool_exp!, $limit: Int, $offset: Int) {\n         Series(where: $where, order_by: {createdAtTimestamp: asc}, limit: $limit, offset: $offset) { ...SeriesFields }\n       }\n": SeriesListDocument,
  "\n  fragment MarketFields on Market {\n    id\n    marketType\n    poolAddress\n    lastPrice\n    lastTradeAt\n    cumulativeBaseVolume\n    cumulativeQuoteVolume\n    tradeCount\n    baseDecimals\n    quoteDecimals\n    createdAtTimestamp\n    createdAtBlock\n    baseToken\n    quoteToken\n    baseSymbol\n    quoteSymbol\n    baseIsNative\n    tickSize\n    lotSize\n    minQuantity\n    markPrice\n    rawMidpoint\n    markPriceUpdatedAt\n    stopRegistry\n    marginBank\n    initialMarginBps\n    fundingRate\n    cumulativeFundingPerUnit\n    indexPrice\n    fundingUpdatedAt\n    fundingWindowSec\n    fundingIntervalSec\n    openInterest\n    openInterestUpdatedAt\n    marketId\n    marketAddress\n    yesTokenId\n    noTokenId\n    collateral\n    asset\n    question\n    oracleQuestion\n    oracleQuestionId\n    status: clobStatus\n    strike\n    tradingStart\n    expiry\n    winningOutcome\n    payoutNumerators\n    payoutDenominator\n    resolvedAtBlock\n    resolvedAtTimestamp\n    createdByTx\n    creator\n    voided\n    backing\n    nonce\n    finalized\n    netBacking\n    context\n    intervalSec\n    operatorId\n    venueId\n    voidPolicy\n  }\n": MarketFieldsFragmentDoc,
  "\n  query RegistryMarkets($where: Market_bool_exp!, $limit: Int, $offset: Int) {\n    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit, offset: $offset) {\n      ...MarketFields\n    }\n  }\n": RegistryMarketsDocument,
  "\n  query Markets($where: Market_bool_exp!, $limit: Int, $offset: Int) {\n    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit, offset: $offset) {\n      ...MarketFields\n    }\n  }\n": MarketsDocument,
  "\n  query MarketByPk($id: String!) {\n    Market_by_pk(id: $id) {\n      ...MarketFields\n    }\n  }\n": MarketByPkDocument,
  "\n  query MarketByAddress($a: String!) {\n    Market(\n      where: { marketAddress: { _eq: $a } }\n      order_by: { createdAtTimestamp: desc }\n      limit: 1\n    ) {\n      ...MarketFields\n    }\n  }\n": MarketByAddressDocument,
  "\n  query BinaryMarkets($where: Market_bool_exp!, $orderBy: [Market_order_by!], $limit: Int) {\n    Market(where: $where, order_by: $orderBy, limit: $limit) {\n      ...MarketFields\n    }\n  }\n": BinaryMarketsDocument,
  "\n  query SpotMarkets($where: Market_bool_exp!, $limit: Int) {\n    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit) {\n      ...MarketFields\n    }\n  }\n": SpotMarketsDocument,
  "\n  query PerpMarkets($where: Market_bool_exp!, $limit: Int) {\n    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit) {\n      ...MarketFields\n    }\n  }\n": PerpMarketsDocument,
  "\n  query LiveBinaryMarkets(\n    $where: Market_bool_exp!\n    $orderBy: [Market_order_by!]\n    $limit: Int!\n    $offset: Int!\n  ) {\n    Market(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {\n      ...MarketFields\n    }\n  }\n": LiveBinaryMarketsDocument,
  "\n  query PastBinaryMarkets($where: Market_bool_exp!, $limit: Int!, $offset: Int!) {\n    Market(where: $where, order_by: { expiry: desc }, limit: $limit, offset: $offset) {\n      ...MarketFields\n    }\n  }\n": PastBinaryMarketsDocument,
  '\n  query BinaryOriginPairs {\n         Market(\n           distinct_on: [operatorId, venueId],\n           where: {marketType: {_eq: "BINARY"}, operatorId: {_is_null: false}, venueId: {_is_null: false}},\n           order_by: [{operatorId: asc}, {venueId: asc}]\n         ) {\n           operatorId\n           venueId\n         }\n       }\n': BinaryOriginPairsDocument,
  '\n  query BinaryAssets {\n         Market(distinct_on: asset, where: {marketType: {_eq: "BINARY"}, asset: {_is_null: false}}, order_by: {asset: asc}) {\n           asset\n         }\n       }\n': BinaryAssetsDocument,
  "\n  query MarketFees($id: String!) {\n         MarketVenue_by_pk(id: $id) {\n           operatorId venueId feeRecipient\n           makerFeeBps takerFeeBps maxBuilderFeeBps routingFeeBps settlementFeeBps settlementFeesCollected\n         }\n       }\n": MarketFeesDocument,
  "\n  query MarketStatusHistory($id: String!) {\n         MarketStatusUpdate(where: {market_id: {_eq: $id}}, order_by: {timestamp: asc}) {\n           oldStatus newStatus blockNumber timestamp txHash\n         }\n       }\n": MarketStatusHistoryDocument,
  "\n  query OracleAnswersByQid($qids: [String!]) {\n         OracleAnswer(where: {id: {_in: $qids}}) { id numericValue voided }\n       }\n": OracleAnswersByQidDocument,
  "\n  query ResolutionQids($ids: [String!]) {\n         Market(where: {id: {_in: $ids}}) { id oracleQuestionId }\n       }\n": ResolutionQidsDocument,
  "\n  query OpeningRefs($ids: [String!]) {\n         MarketReferenceLink(where: {market_id: {_in: $ids}}) { market: market_id referenceQuestionId }\n       }\n": OpeningRefsDocument,
  "\n  fragment OperatorFields on Operator {\n    operatorId\n    owner\n    feeRecipient\n    enabled\n    policy\n    context\n    pendingOwner\n    venueCount\n    createdAtTimestamp\n    updatedAtTimestamp\n    marketCount\n    cumulativeQuoteVolume\n    protocolFeesCollected\n    settlementFeesCollected\n    builderFeesCollected\n  }\n": OperatorFieldsFragmentDoc,
  "\n  fragment VenueFields on Venue {\n    venueId\n    operatorId\n    marketType\n    feeParams\n    feeRecipientOverride\n    policy\n    signer\n    creationEnabled\n    context\n    createdAtTimestamp\n    updatedAtTimestamp\n    marketCount\n    cumulativeQuoteVolume\n    protocolFeesCollected\n    settlementFeesCollected\n    builderFeesCollected\n  }\n": VenueFieldsFragmentDoc,
  "\n  query Operators($where: Operator_bool_exp!, $limit: Int, $offset: Int) {\n         Operator(where: $where, order_by: {operatorId: desc}, limit: $limit, offset: $offset) { ...OperatorFields }\n       }\n": OperatorsDocument,
  "\n  query OperatorByPk($id: String!) { Operator_by_pk(id: $id) { ...OperatorFields } }\n": OperatorByPkDocument,
  "\n  query Venues($where: Venue_bool_exp!, $limit: Int, $offset: Int) {\n         Venue(where: $where, order_by: {createdAtTimestamp: asc}, limit: $limit, offset: $offset) { ...VenueFields }\n       }\n": VenuesDocument,
  "\n  query VenueByPk($id: String!) { Venue_by_pk(id: $id) { ...VenueFields } }\n": VenueByPkDocument,
  "\n  fragment OracleQuestionFields on OracleQuestion {\n    id\n    questionKey\n    scheduler\n    oracleCost\n    bindCount\n    reuseCount\n    createdAtBlock\n    createdAtTimestamp\n  }\n": OracleQuestionFieldsFragmentDoc,
  "\n  fragment OperatorHubAccountFields on OperatorHubAccount {\n    id\n    operatorId\n    earmarked\n    credit\n    outstanding\n    createdAtBlock\n    createdAtTimestamp\n    updatedAtBlock\n    updatedAtTimestamp\n  }\n": OperatorHubAccountFieldsFragmentDoc,
  "\n  fragment OracleBindFields on OracleBind {\n    id\n    oracleQuestionId\n    bindIndex\n    operatorId\n    measuredGas\n    overheadShare\n    cost\n    charged\n    subsidy\n    resolvedAt\n    boundAtBlock\n    boundAtTimestamp\n    txHash\n  }\n": OracleBindFieldsFragmentDoc,
  "\n  fragment OracleCallbackFields on OracleCallback {\n    id\n    marketsResolved\n    gasPrice\n    measuredGas\n    overheadGasAttributed\n    totalCost\n    totalCharged\n    subsidy\n    pendingRemaining\n    blockNumber\n    timestamp\n    txHash\n  }\n": OracleCallbackFieldsFragmentDoc,
  "\n  query OracleQuestion($id: String!) {\n         OracleQuestion_by_pk(id: $id) { ...OracleQuestionFields }\n       }\n": OracleQuestionDocument,
  "\n  query OracleQuestions($where: OracleQuestion_bool_exp!, $limit: Int, $offset: Int) {\n         OracleQuestion(where: $where, order_by: {createdAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OracleQuestionFields }\n       }\n": OracleQuestionsDocument,
  "\n  query OperatorHubAccount($id: String!) {\n         OperatorHubAccount_by_pk(id: $id) { ...OperatorHubAccountFields }\n       }\n": OperatorHubAccountDocument,
  "\n  query OperatorHubAccounts($limit: Int, $offset: Int) {\n         OperatorHubAccount(order_by: {updatedAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OperatorHubAccountFields }\n       }\n": OperatorHubAccountsDocument,
  "\n  query OracleBinds($where: OracleBind_bool_exp!, $limit: Int, $offset: Int) {\n         OracleBind(where: $where, order_by: {boundAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OracleBindFields }\n       }\n": OracleBindsDocument,
  "\n  query OracleCallbacks($limit: Int, $offset: Int) {\n         OracleCallback(order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...OracleCallbackFields }\n       }\n": OracleCallbacksDocument,
  "\n  fragment OrderMarketFields on Market {\n    marketAddress\n    asset\n    question\n    expiry\n    tradingStart\n    quoteDecimals\n    intervalSec\n  }\n": OrderMarketFieldsFragmentDoc,
  "\n  query SweepableOrders($where: Order_bool_exp!, $limit: Int, $offset: Int) {\n        Order(where: $where, order_by: [{expireTimestampNs: asc}, {id: asc}], limit: $limit, offset: $offset) {\n          id orderId owner isBid price quantityRemaining expireTimestampNs placedAtTimestamp\n          market: market_id\n          marketRow: market { poolAddress marketType ...OrderMarketFields }\n        }\n      }\n": SweepableOrdersDocument,
  "\n  query OpenOrders($where: Order_bool_exp!, $limit: Int, $offset: Int) {\n        Order(where: $where, order_by: {placedAtTimestamp: desc}, limit: $limit, offset: $offset) {\n          id orderId side isBid price quantityRemaining\n          market: market_id\n          marketRow: market { poolAddress ...OrderMarketFields }\n        }\n      }\n": OpenOrdersDocument,
  "\n  query Orders($where: Order_bool_exp!, $limit: Int, $offset: Int) {\n        Order(where: $where, order_by: {placedAtTimestamp: desc}, limit: $limit, offset: $offset) {\n          id orderId side isBid price quantityRemaining fullQuantity filledQuantity status\n          rested expireTimestampNs placedTxHash placedAtTimestamp\n          cancelReason amendedFromOrderId amendedToOrderId\n          market: market_id\n          marketRow: market { poolAddress ...OrderMarketFields }\n        }\n      }\n": OrdersDocument,
  "\n  query OrderDetail($id: String!) {\n        Order(where: { id: { _eq: $id } }, limit: 1) {\n          id orderId owner userData side isBid price quantityRemaining fullQuantity filledQuantity\n          status rested expireTimestampNs placedTxHash placedAtTimestamp placedAtBlock\n          lastUpdatedAtTimestamp cancelReason amendedFromOrderId amendedToOrderId\n          market: market_id\n          marketRow: market { poolAddress ...OrderMarketFields }\n          marketRef: market { ...MarketRefFields }\n        }\n      }\n": OrderDetailDocument,
  "\n  query BookTops($bidWhere: Order_bool_exp!, $askWhere: Order_bool_exp!) {\n         bids: Order(where: $bidWhere, distinct_on: market_id, order_by: [{market_id: desc}, {price: desc}]) {\n           market: market_id price\n         }\n         asks: Order(where: $askWhere, distinct_on: market_id, order_by: [{market_id: asc}, {price: asc}]) {\n           market: market_id price\n         }\n       }\n": BookTopsDocument,
  "\n  query FundingPayments($where: FundingPayment_bool_exp!, $limit: Int, $offset: Int) {\n         FundingPayment(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {\n           id account pool amount timestamp txHash\n         }\n       }\n": FundingPaymentsDocument,
  "\n  query MarginEvents($account: String!, $limit: Int, $offset: Int) {\n         MarginEvent(where: {account: {_eq: $account}}, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {\n           id account kind pool amount granter timestamp txHash\n         }\n       }\n": MarginEventsDocument,
  "\n  query Liquidations($where: LiquidationEvent_bool_exp!, $limit: Int, $offset: Int) {\n         LiquidationEvent(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {\n           id account pool kind size price counterparty penalty\n           badDebt insuranceCovered deficit coverageDeclined collateralAmount equity\n           positionsProcessed stageReached marginStatusBefore marginStatusAfter\n           timestamp blockNumber txHash\n         }\n       }\n": LiquidationsDocument,
  "\n  query FundingRateHistory($where: FundingRateUpdate_bool_exp!, $orderBy: [FundingRateUpdate_order_by!], $limit: Int, $offset: Int) {\n         FundingRateUpdate(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {\n           id pool fundingRate cumulativeFundingPerUnit indexPrice markPrice\n           intervalsSettled intervalsAccrued fundingWindowSec fundingIntervalSec\n           spanStart spanEnd anchorResynced timestamp blockNumber txHash\n         }\n       }\n": FundingRateHistoryDocument,
  "\n  query FundingRateCandles($where: FundingRateCandle_bool_exp!, $limit: Int, $offset: Int) {\n         FundingRateCandle(where: $where, order_by: {bucketStart: desc}, limit: $limit, offset: $offset) {\n           id pool intervalSeconds bucketStart\n           avgFundingRate8h minFundingRate8h maxFundingRate8h coverage\n           cumulativeFundingStart cumulativeFundingEnd\n           fundingWindowSec fundingIntervalSec paramsChangedInBucket\n           indexPriceEnd openInterestEnd updateCount\n         }\n       }\n": FundingRateCandlesDocument,
  "\n  query PerpFees($where: PerpFeeRecord_bool_exp!, $limit: Int, $offset: Int) {\n         PerpFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {\n           id account pool amount isRebate kind insurancePortion tier fillNotional builder timestamp txHash\n         }\n       }\n": PerpFeesDocument,
  "\n  query OpenInterestHistory($pool: String!, $limit: Int, $offset: Int) {\n         OpenInterestSnapshot(where: {pool: {_eq: $pool}}, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {\n           id pool openInterest timestamp blockNumber\n         }\n       }\n": OpenInterestHistoryDocument,
  "\n  fragment PerpPortfolioMarketFields on Market {\n    poolAddress\n    baseSymbol\n    quoteSymbol\n    baseDecimals\n    quoteDecimals\n    tickSize\n    lotSize\n    minQuantity\n    lastPrice\n    marginBank\n    initialMarginBps\n    fundingRate\n    indexPrice\n    stopRegistry\n  }\n": PerpPortfolioMarketFieldsFragmentDoc,
  '\n  query PerpPortfolio(\n    $acct: String!\n    $fillWhere: Fill_bool_exp!\n    $ordersLimit: Int\n    $tradesLimit: Int\n  ) {\n    PerpOrder: Order(\n      where: {\n        owner: { _eq: $acct }\n        status: { _eq: "Open" }\n        market: { marketType: { _eq: "PERP" } }\n      }\n      order_by: { placedAtTimestamp: desc }\n      limit: $ordersLimit\n    ) {\n      id\n      orderId\n      isBid\n      price\n      quantityRemaining\n      filledQuantity\n      fullQuantity\n      placedAtTimestamp\n      placedTxHash\n      market {\n        ...PerpPortfolioMarketFields\n      }\n    }\n    PerpFill: Fill(where: $fillWhere, order_by: { timestamp: desc }, limit: $tradesLimit) {\n      id\n      fillPrice\n      quantity\n      quoteQuantity\n      timestamp\n      txHash\n      maker\n      taker\n      takerIsBid\n      market {\n        ...PerpPortfolioMarketFields\n      }\n    }\n  }\n': PerpPortfolioDocument,
  "\n  query PerpOrderHistory($where: Order_bool_exp!, $orderBy: [Order_order_by!], $limit: Int, $offset: Int) {\n    Order(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {\n      id\n      orderId\n      isBid\n      price\n      quantityRemaining\n      filledQuantity\n      fullQuantity\n      status\n      rested\n      expireTimestampNs\n      placedAtTimestamp\n      placedTxHash\n      lastUpdatedAtTimestamp\n      market {\n        ...PerpPortfolioMarketFields\n      }\n    }\n  }\n": PerpOrderHistoryDocument,
  "\n  query PerpPositions($where: PerpPosition_bool_exp!, $limit: Int, $offset: Int) {\n    PerpPosition(where: $where, order_by: { updatedAt: desc }, limit: $limit, offset: $offset) {\n      id\n      pool\n      account\n      size\n      isLong\n      entryPriceX18\n      realizedPnl\n      updatedAt\n      updatedAtBlock\n    }\n  }\n": PerpPositionsDocument,
  "\n  query PerpStopOrders($where: StopOrder_bool_exp!, $limit: Int, $offset: Int) {\n    StopOrder(where: $where, order_by: [{ createdAt: desc }, { id: desc }], limit: $limit, offset: $offset) {\n      id\n      registry\n      orderIdRaw\n      owner\n      isBid\n      quantity\n      triggerPrice\n      triggerOperator\n      orderType\n      builder\n      builderFeeBpsTimes1k\n      status\n      placedOrderId\n      dropReason\n      createdAt\n      updatedAt\n      txHash\n      market {\n        poolAddress\n        baseSymbol\n        quoteSymbol\n        baseDecimals\n        quoteDecimals\n      }\n    }\n  }\n": PerpStopOrdersDocument,
  "\n  query MarketsByPool($pool: String!, $limit: Int) {\n    Market(\n      where: { poolAddress: { _eq: $pool } }\n      order_by: { createdAtTimestamp: desc }\n      limit: $limit\n    ) {\n      ...MarketFields\n    }\n  }\n": MarketsByPoolDocument,
  "\n  query PoolBindings($pool: String!) {\n         PoolBinding(where: {poolAddress: {_eq: $pool}}, order_by: {nonce: desc}) {\n           id poolAddress marketId nonce fromBlock fromLogIndex fromTimestamp\n           toBlock toLogIndex toTimestamp closedBy\n         }\n       }\n": PoolBindingsDocument,
  "\n  query PoolByPk($id: String!) {\n         Pool_by_pk(id: $id) {\n           id address collateral creator currentMarketId currentNonce generationCount\n           createdAtTimestamp updatedAtTimestamp\n         }\n       }\n": PoolByPkDocument,
  "\n  fragment RouterActionFields on RouterActionRecord {\n    id\n    kind\n    account\n    market: market_id\n    amount\n    payout\n    routedVia\n    timestamp\n    txHash\n  }\n": RouterActionFieldsFragmentDoc,
  "\n  query RouterActions($where: RouterActionRecord_bool_exp!, $limit: Int, $offset: Int) {\n         RouterActionRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...RouterActionFields }\n       }\n": RouterActionsDocument,
  "\n  fragment SpotPortfolioMarketFields on Market {\n    poolAddress\n    baseSymbol\n    quoteSymbol\n    baseToken\n    quoteToken\n    baseDecimals\n    quoteDecimals\n    baseIsNative\n    tickSize\n    lotSize\n    minQuantity\n    lastPrice\n    markPrice\n    stopRegistry\n  }\n": SpotPortfolioMarketFieldsFragmentDoc,
  '\n  query SpotPortfolio(\n    $acct: String!\n    $fillWhere: Fill_bool_exp!\n    $ordersLimit: Int\n    $tradesLimit: Int\n  ) {\n    SpotOrder: Order(\n      where: {\n        owner: { _eq: $acct }\n        status: { _eq: "Open" }\n        market: { marketType: { _eq: "SPOT" } }\n      }\n      order_by: { placedAtTimestamp: desc }\n      limit: $ordersLimit\n    ) {\n      id\n      orderId\n      isBid\n      price\n      quantityRemaining\n      filledQuantity\n      fullQuantity\n      placedAtTimestamp\n      placedTxHash\n      market {\n        ...SpotPortfolioMarketFields\n      }\n    }\n    SpotStopOrder: StopOrder(\n      where: { owner: { _eq: $acct }, status: { _eq: "PENDING" } }\n      order_by: { createdAt: desc }\n      limit: $ordersLimit\n    ) {\n      ...SpotStopOrderFields\n      market {\n        ...SpotPortfolioMarketFields\n      }\n    }\n    SpotFill: Fill(where: $fillWhere, order_by: { timestamp: desc }, limit: $tradesLimit) {\n      id\n      fillPrice\n      quantity\n      quoteQuantity\n      timestamp\n      txHash\n      maker\n      taker\n      takerIsBid\n      market {\n        ...SpotPortfolioMarketFields\n      }\n    }\n  }\n': SpotPortfolioDocument,
  "\n  fragment SpotStopOrderFields on StopOrder {\n    id\n    registry\n    orderId: orderIdRaw\n    isBid\n    quantity\n    triggerPrice\n    triggerOperator\n    orderType\n    status\n    placedOrderId\n    createdAt\n  }\n": SpotStopOrderFieldsFragmentDoc,
  "\n  query SpotStopOrders($where: StopOrder_bool_exp!, $limit: Int) {\n    StopOrder(where: $where, order_by: { createdAt: desc }, limit: $limit) {\n      ...SpotStopOrderFields\n      market {\n        ...SpotPortfolioMarketFields\n      }\n    }\n  }\n": SpotStopOrdersDocument,
  "\n  query SyncStatus($chainId: Int!) {\n    chain_metadata(where: { chain_id: { _eq: $chainId } }) {\n      chain_id\n      latest_processed_block\n      block_height\n      num_events_processed\n    }\n  }\n": SyncStatusDocument
};
function graphql(source) {
  return documents[source] ?? {};
}

// node_modules/@somnia-chain/markets-sdk/dist/store.js
var BINARY_MARKET_STATUS = [
  "Listed",
  "Trading",
  "Locked",
  "Settling",
  "Resolved",
  "Voided"
];
var DECIMALS = 6;
var MAX_FILLS_PER_POOL = 400;
var MAX_FUNDING_PER_POOL = 500;
var ORDER_KIND_SIDE = ["BUY_YES", "SELL_YES", "BUY_NO", "SELL_NO"];
function sideOfKind(kind) {
  return ORDER_KIND_SIDE[Number(kind)] ?? "BUY_YES";
}
function fillKind(takerSide, makerSide) {
  if (takerSide === "BUY_YES" && makerSide === "SELL_YES" || takerSide === "SELL_YES" && makerSide === "BUY_YES")
    return "DIRECT_YES";
  if (takerSide === "BUY_NO" && makerSide === "SELL_NO" || takerSide === "SELL_NO" && makerSide === "BUY_NO")
    return "DIRECT_NO";
  if (takerSide === "BUY_YES" && makerSide === "BUY_NO" || takerSide === "BUY_NO" && makerSide === "BUY_YES")
    return "MINT_A_PAIR";
  if (takerSide === "SELL_YES" && makerSide === "SELL_NO" || takerSide === "SELL_NO" && makerSide === "SELL_YES")
    return "BURN_A_PAIR";
  return "DIRECT_YES";
}
function orderKey(pool, orderId) {
  return `${pool.toLowerCase()}_${orderId}`;
}
function fillKey(blockNumber, logIndex) {
  return `${blockNumber}_${logIndex}`;
}
function isExpired(expireTimestampNs, nowNs) {
  const exp = BigInt(expireTimestampNs);
  return exp !== 0n && nowNs > exp;
}
var MaterializerStore = class {
  constructor() {
    __publicField(this, "markets", /* @__PURE__ */ new Map());
    __publicField(this, "fills", /* @__PURE__ */ new Map());
    __publicField(this, "orders", /* @__PURE__ */ new Map());
    /**
     *  `${blockNumber}_${logIndex}` -> funding update, appended by the live tail.
     *
     *  Separate from `markets` because a funding CHART needs the series, not just the
     *  latest value the market row carries. Keyed on (block, logIndex) rather than
     *  appended to a list so a reorg replay overwrites instead of duplicating — the same
     *  dedup the tail already applies to fills and orders.
     */
    __publicField(this, "fundingUpdates", /* @__PURE__ */ new Map());
    /**
     *  pool (lowercase) -> market id — the pool's CURRENT market binding, so the
     *  reducer can route a pool log to its market. Settlement-extraction v2: this
     *  binding is TIME-VARYING (a recycled pool serves successive markets, never
     *  concurrently) — `MarketCreated` opens/re-points it, `PoolReleased` closes it.
     */
    __publicField(this, "poolToMarket", /* @__PURE__ */ new Map());
    /** BinaryMarket address (lowercase) -> market id (binary markets only) */
    __publicField(this, "addressToMarket", /* @__PURE__ */ new Map());
    /**
     *  orderKey -> BinarySide recorded from `BinaryOrderPlaced` before/after its
     *  paired base `OrderPlaced` lands (intra-tx order not guaranteed). The v2 side
     *  source — consumed (deleted) once the order row carries the side.
     */
    __publicField(this, "pendingKinds", /* @__PURE__ */ new Map());
    __publicField(this, "status", {
      mode: "init",
      snapshotBlock: 0,
      lastBlock: 0,
      headBlock: 0,
      wsConnected: false,
      watchCount: 0
    });
    __publicField(this, "version", 0);
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "cache", /* @__PURE__ */ new Map());
    __publicField(this, "subscribe", (listener) => {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    });
  }
  getVersion() {
    return this.version;
  }
  /** Bump version and notify subscribers. Call once per processed block / status change. */
  commit() {
    this.version++;
    for (const l of this.listeners)
      l();
  }
  setStatus(patch) {
    this.status = { ...this.status, ...patch };
    this.commit();
  }
  /** Memoized derived snapshot — stable reference while version is unchanged. */
  select(key, compute) {
    const hit = this.cache.get(key);
    if (hit && hit.v === this.version)
      return hit.val;
    const val = compute();
    this.cache.set(key, { v: this.version, val });
    return val;
  }
  /**
   * Merge a snapshot's rows into the store (upsert by key; does not commit).
   *
   *  Watches are per-scope, so hydration must NOT clear other scopes' state —
   *  watching market B leaves market A's rows untouched. A row the store
   *  already holds is overwritten by the incoming snapshot row (the indexer is
   *  at least as current for anything at/below the seam block), EXCEPT that a
   *  locally-witnessed OPEN order missing from the snapshot is kept: the live
   *  reducer put it there from a real on-chain OrderPlaced the indexer just
   *  hasn't surfaced yet (e.g. an order placed seconds ago), and blanking it
   *  would flicker it out of "open orders". Events past the seam are replayed
   *  by the watch's backfill either way.
   */
  mergeSnapshot(input) {
    for (const m of input.markets)
      this.indexMarket(m);
    for (const f of input.fills)
      this.fills.set(f.id, f);
    for (const o of input.orders)
      this.orders.set(orderKey(o.pool, o.orderId), o);
    this.prunePerPool();
  }
  /**
   *  Drop one pool's fills + orders + funding rows (a watch was released). The market row
   *  is kept — it's a few hundred bytes of metadata and keeps `getLiveMarkets` stable for
   *  list views.
   */
  purgePool(pool) {
    const p = pool.toLowerCase();
    for (const [id2, f] of this.fills)
      if (f.pool === p)
        this.fills.delete(id2);
    for (const [id2, o] of this.orders)
      if (o.pool === p)
        this.orders.delete(id2);
    for (const [id2, u] of this.fundingUpdates)
      if (u.pool === p)
        this.fundingUpdates.delete(id2);
  }
  /** Register a market + its reverse lookups. */
  indexMarket(m) {
    this.markets.set(m.id, m);
    this.poolToMarket.set(m.poolAddress.toLowerCase(), m.id);
    if (m.marketType === "BINARY")
      this.addressToMarket.set(m.marketAddress.toLowerCase(), m.id);
  }
  /** Keep only the most recent MAX_FILLS_PER_POOL fills and MAX_FUNDING_PER_POOL funding rows per pool. */
  prunePerPool() {
    const byPool = /* @__PURE__ */ new Map();
    for (const f of this.fills.values()) {
      const arr = byPool.get(f.pool) ?? [];
      arr.push(f);
      byPool.set(f.pool, arr);
    }
    for (const arr of byPool.values()) {
      if (arr.length <= MAX_FILLS_PER_POOL)
        continue;
      arr.sort(cmpFillDesc);
      for (const f of arr.slice(MAX_FILLS_PER_POOL))
        this.fills.delete(f.id);
    }
    const fundingByPool = /* @__PURE__ */ new Map();
    for (const u of this.fundingUpdates.values()) {
      const arr = fundingByPool.get(u.pool) ?? [];
      arr.push(u);
      fundingByPool.set(u.pool, arr);
    }
    for (const arr of fundingByPool.values()) {
      if (arr.length <= MAX_FUNDING_PER_POOL)
        continue;
      arr.sort(cmpFundingDesc);
      for (const u of arr.slice(MAX_FUNDING_PER_POOL))
        this.fundingUpdates.delete(u.id);
    }
  }
  // ---- selectors (return Hasura-compatible row shapes) ----
  /**
   *  Resolve a fill's maker/taker owner + side from the order join. Live fills
   *  carry these as undefined (taker isn't known at OrderFilled time; maker is
   *  only filled when its resting order was witnessed live), so we back-join to
   *  the order book — populated from the snapshot's open-orders + live events.
   */
  enrichFill(f) {
    if (f.maker && f.makerSide && f.taker && f.takerSide && f.kind && f.takerIsBid !== void 0)
      return f;
    const mo = this.orders.get(f.makerOrder_id);
    const to = this.orders.get(f.takerOrder_id);
    if (!mo && !to)
      return f;
    const makerSide = f.makerSide ?? (mo == null ? void 0 : mo.side);
    const takerSide = f.takerSide ?? (to == null ? void 0 : to.side);
    return {
      ...f,
      maker: f.maker ?? (mo == null ? void 0 : mo.owner),
      makerSide,
      taker: f.taker ?? (to == null ? void 0 : to.owner),
      takerSide,
      // The taker's book direction — the tape's aggressor side on spot, where
      // there is no YES/NO takerSide to derive it from.
      takerIsBid: f.takerIsBid ?? (to == null ? void 0 : to.isBid),
      // Mirror the indexer's PendingTakerFill back-fill: classify the fill once
      // both binary sides are known (fillKind needs both). Spot fills have no
      // side → kind stays undefined. Without this, live fills carried
      // kind=undefined forever while snapshot fills had a real kind.
      kind: f.kind ?? (makerSide && takerSide ? fillKind(takerSide, makerSide) : void 0)
    };
  }
  recentFills(pool, limit) {
    const p = pool.toLowerCase();
    return this.select(`fills:${p}:${limit}`, () => [...this.fills.values()].filter((f) => f.pool === p).sort(cmpFillDesc).slice(0, limit).map((f) => this.enrichFill(f)));
  }
  userFills(pool, user, limit) {
    const u = user.toLowerCase();
    const p = (pool == null ? void 0 : pool.toLowerCase()) ?? null;
    return this.select(`ufills:${p ?? "*"}:${u}:${limit}`, () => [...this.fills.values()].filter((f) => {
      var _a, _b, _c;
      return (p === null || f.pool === p) && // Maker is denormalized; taker is usually unresolved on the fill, so
      // also match via the takerOrder → order owner join.
      (((_a = f.maker) == null ? void 0 : _a.toLowerCase()) === u || ((_b = f.taker) == null ? void 0 : _b.toLowerCase()) === u || ((_c = this.orders.get(f.takerOrder_id)) == null ? void 0 : _c.owner.toLowerCase()) === u);
    }).sort(cmpFillDesc).slice(0, limit).map((f) => this.enrichFill(f)));
  }
  /**
   *  Funding settlements the tail has seen for a pool, OLDEST FIRST (chart order).
   *
   *  The tail's counterpart to the indexed `FundingRateUpdate` series: splice these onto
   *  the tail of a one-shot query to extend a chart past the snapshot block, rather than
   *  only overwriting the market row's latest value.
   *
   *  Oldest-first here, unlike `recentFills` — a funding chart consumes a series in time
   *  order, whereas a trade tape wants newest-first.
   *
   *  Two rows on this list carry less than their indexed equivalents, and deliberately:
   *  `intervalsAccrued` needs `n` from the parameter-epoch series and the covered span
   *  needs the settlement anchor, neither of which the tail has. They arrive with the
   *  indexed row a moment later rather than being guessed at here.
   */
  fundingUpdatesFor(pool, limit = 500) {
    const p = pool.toLowerCase();
    return this.select(`funding:${p}:${limit}`, () => [...this.fundingUpdates.values()].filter((f) => f.pool === p).sort((a, b) => a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : Number(BigInt(a.blockNumber) - BigInt(b.blockNumber))).slice(-limit));
  }
  /** All known markets (memoized — stable reference between mutations). */
  allMarkets() {
    return this.select("markets:all", () => [...this.markets.values()]);
  }
  marketByPool(pool) {
    const id2 = this.poolToMarket.get(pool.toLowerCase());
    return this.select(`mpool:${pool.toLowerCase()}`, () => id2 ? this.markets.get(id2) ?? null : null);
  }
  /** Only binary markets have a BinaryMarket contract address. */
  marketByAddress(addr) {
    const id2 = this.addressToMarket.get(addr.toLowerCase());
    return this.select(`maddr:${addr.toLowerCase()}`, () => {
      const m = id2 ? this.markets.get(id2) : void 0;
      return m && m.marketType === "BINARY" ? m : null;
    });
  }
  userOrders(pool, user, limit) {
    const p = pool.toLowerCase();
    const u = user.toLowerCase();
    return this.select(`uorders:${p}:${u}:${limit}`, () => [...this.orders.values()].filter((o) => o.pool === p && o.owner.toLowerCase() === u).sort((a, b) => Number(b.createdAt) - Number(a.createdAt)).slice(0, limit));
  }
  /**
   *  The locally-materialized RESTING book for a pool, aggregated by price level
   *  — the zero-round-trip mirror of the on-chain `getBookLevels`. Prices are in
   *  the book's native terms (YES terms for binary, quote-per-base for spot).
   *  Only orders witnessed as rested and still open count, matching the chain.
   */
  bookLevels(pool, depth) {
    var _a;
    const p = pool.toLowerCase();
    const currentMarketId = (_a = this.marketByPool(p)) == null ? void 0 : _a.id;
    return this.select(`book:${p}:${depth}`, () => {
      if (currentMarketId == null)
        return { bids: [], asks: [] };
      const nowNs = BigInt(Math.floor(Date.now() / 1e3)) * 1000000000n;
      const bids = /* @__PURE__ */ new Map();
      const asks = /* @__PURE__ */ new Map();
      for (const o of this.orders.values()) {
        if (o.pool !== p || o.market_id !== currentMarketId || o.status !== "Open" || !o.rested)
          continue;
        if (isExpired(o.expireTimestampNs, nowNs))
          continue;
        const qty = BigInt(o.quantityRemaining);
        if (qty <= 0n)
          continue;
        const side = o.isBid ? bids : asks;
        side.set(o.price, (side.get(o.price) ?? 0n) + qty);
      }
      const toLevels = (m, bestFirst) => [...m.entries()].map(([price, quantity]) => ({ price: BigInt(price), quantity })).sort((a, b) => bestFirst(a.price, b.price)).slice(0, depth);
      return {
        bids: toLevels(bids, (a, b) => a === b ? 0 : a > b ? -1 : 1),
        // highest first
        asks: toLevels(asks, (a, b) => a === b ? 0 : a < b ? -1 : 1)
        // lowest first
      };
    });
  }
  /**
   *  Resting book for a market resolved by its `marketId` (recycle-safe). A
   *  BinaryPool is reused across markets, so this resolves the market's pool and
   *  GUARDS that the pool's CURRENT binding is still this market — if `marketId`
   *  is stale (the pool moved on to a newer market), returns `null` so a stale
   *  page renders nothing rather than the successor market's liquidity.
   */
  bookLevelsByMarket(marketId, depth) {
    var _a, _b;
    const id2 = marketId.toLowerCase();
    const pool = (_b = (_a = this.markets.get(id2)) == null ? void 0 : _a.poolAddress) == null ? void 0 : _b.toLowerCase();
    if (!pool || this.poolToMarket.get(pool) !== id2)
      return null;
    return this.bookLevels(pool, depth);
  }
  getStatus() {
    return this.select("status", () => this.status);
  }
};
function cmpFillDesc(a, b) {
  const dt = Number(b.timestamp) - Number(a.timestamp);
  return dt !== 0 ? dt : b.logIndex - a.logIndex;
}
function cmpFundingDesc(a, b) {
  if (a.blockNumber === b.blockNumber)
    return b.logIndex - a.logIndex;
  return Number(BigInt(b.blockNumber) - BigInt(a.blockNumber));
}

// node_modules/@somnia-chain/markets-sdk/dist/ids.js
var IDX_BITS = 8n;
var NONCE_BITS = 64n;
var POOL_SHIFT = IDX_BITS + NONCE_BITS;
var IDX_MASK = (1n << IDX_BITS) - 1n;
var NONCE_MASK = (1n << NONCE_BITS) - 1n;
function outcomeId(pool, nonce, idx) {
  const n = BigInt(nonce);
  return BigInt(pool) << POOL_SHIFT | (n & NONCE_MASK) << IDX_BITS | BigInt(idx);
}
function decodeOutcomeId(id2) {
  const idx = Number(id2 & IDX_MASK);
  const nonce = id2 >> IDX_BITS & NONCE_MASK;
  const pool = `0x${(id2 >> POOL_SHIFT).toString(16).padStart(40, "0")}`;
  return { pool, nonce, idx };
}
function marketKey(outcomeId2) {
  return outcomeId2 >> IDX_BITS;
}

// node_modules/@somnia-chain/markets-sdk/dist/interval.js
function resolveIntervalSec(m) {
  const iv = m.intervalSec != null ? Number(m.intervalSec) : NaN;
  if (Number.isFinite(iv) && iv > 0)
    return iv;
  if (m.tradingStart != null && m.expiry != null) {
    const window = Number(m.expiry) - Number(m.tradingStart);
    if (Number.isFinite(window) && window > 0)
      return window;
  }
  return null;
}
function snapIntervalSec(sec, toleranceSec = 2) {
  if (!Number.isFinite(sec) || sec <= 0)
    return 0;
  if (sec < 60)
    return Math.max(1, Math.round(sec));
  const unit = sec < 3600 ? 60 : sec < 86400 ? 3600 : 86400;
  const snapped = Math.round(sec / unit) * unit;
  return Math.abs(snapped - sec) <= toleranceSec ? snapped : Math.round(sec);
}
var CADENCE_LADDER_SEC = [60, 300, 900, 3600, 14400, 86400];
var CADENCE_TOLERANCE_SEC = 5;
function snapToCadence(sec) {
  if (!Number.isFinite(sec) || sec <= 0)
    return 0;
  for (const rung of CADENCE_LADDER_SEC) {
    if (Math.abs(sec - rung) <= CADENCE_TOLERANCE_SEC)
      return rung;
  }
  return snapIntervalSec(sec);
}
function cadenceBandSec(cadenceSec) {
  if (!Number.isFinite(cadenceSec) || cadenceSec <= 0) {
    throw new RangeError(`cadenceSec must be a positive finite number, got ${cadenceSec}`);
  }
  return {
    minSec: Math.max(1, cadenceSec - CADENCE_TOLERANCE_SEC),
    maxSec: cadenceSec + CADENCE_TOLERANCE_SEC
  };
}
function formatIntervalLabel(sec) {
  if (!Number.isFinite(sec) || sec <= 0)
    return null;
  if (sec % 3600 === 0)
    return `${sec / 3600}h`;
  if (sec % 60 === 0)
    return `${sec / 60}m`;
  return `${sec}s`;
}
function marketIntervalLabel(m) {
  const sec = resolveIntervalSec(m);
  return sec != null ? formatIntervalLabel(snapToCadence(sec)) : null;
}

// node_modules/@somnia-chain/markets-sdk/dist/units.js
function toHuman(raw, decimals = DECIMALS) {
  return Number(formatUnits(BigInt(raw), decimals));
}
function toHumanString(raw, decimals = DECIMALS) {
  return formatUnits(BigInt(raw), decimals);
}
function fromHuman(human, decimals = DECIMALS) {
  if (typeof human === "number" && !Number.isFinite(human)) {
    throw new InvalidInputError(`amount must be a finite number, got ${human}`);
  }
  return parseUnits(typeof human === "number" ? humanToDecimalString(human, decimals) : human, decimals);
}
function humanToDecimalString(n, decimals) {
  var _a;
  const shortest = String(n);
  if (!shortest.includes("e") && !shortest.includes("E")) {
    const fractionDigits = ((_a = shortest.split(".")[1]) == null ? void 0 : _a.length) ?? 0;
    if (fractionDigits <= decimals)
      return shortest;
  }
  return n.toFixed(decimals);
}
function priceToProbability(rawPrice, decimals = DECIMALS) {
  return toHuman(rawPrice, decimals);
}
function probabilityToPrice(probability, decimals = DECIMALS) {
  if (!(probability >= 0 && probability <= 1)) {
    throw new InvalidInputError(`probability must be in [0, 1], got ${probability}`);
  }
  return fromHuman(probability, decimals);
}
function markYesPrice(top, lastPrice) {
  const { bestBid, bestAsk } = top;
  if (bestBid != null && bestAsk != null)
    return (bestBid + bestAsk) / 2n;
  const last = lastPrice != null ? BigInt(lastPrice) : null;
  if (last == null)
    return bestAsk ?? bestBid ?? null;
  if (bestBid != null && last < bestBid)
    return bestBid;
  if (bestAsk != null && last > bestAsk)
    return bestAsk;
  return last;
}
function binaryFillsFor(account, fills, decimals = DECIMALS) {
  var _a, _b;
  const acct = account.toLowerCase();
  const one = 10n ** BigInt(decimals);
  const out = [];
  for (const f of fills) {
    const isMaker = (f.maker ?? "").toLowerCase() === acct;
    const isTaker = (f.taker ?? "").toLowerCase() === acct || (((_a = f.takerOrder) == null ? void 0 : _a.owner) ?? "").toLowerCase() === acct;
    if (!isMaker && !isTaker)
      continue;
    const side = isMaker ? f.makerSide : ((_b = f.takerOrder) == null ? void 0 : _b.side) ?? f.takerSide;
    if (side == null)
      continue;
    const outcomeIndex = side === "BUY_NO" || side === "SELL_NO" ? 1 : 0;
    const isBuy = side === "BUY_YES" || side === "BUY_NO";
    const yesPrice = BigInt(f.fillPrice);
    const price = outcomeIndex === 1 ? one - yesPrice : yesPrice;
    out.push({ outcomeIndex, isBuy, quantity: f.quantity, price: price.toString() });
  }
  return out;
}
function binaryFillsFromPortfolio(trades, decimals = DECIMALS) {
  const one = 10n ** BigInt(decimals);
  const out = [];
  for (const t of trades) {
    if (t.side == null)
      continue;
    const outcomeIndex = t.side === "BUY_NO" || t.side === "SELL_NO" ? 1 : 0;
    const isBuy = t.side === "BUY_YES" || t.side === "BUY_NO";
    const yesPrice = BigInt(t.fillPrice);
    const price = outcomeIndex === 1 ? one - yesPrice : yesPrice;
    out.push({ outcomeIndex, isBuy, quantity: t.quantity, price: price.toString() });
  }
  return out;
}
function computeBinaryPnl(fills, balances, market, opts) {
  const decimals = market.quoteDecimals ?? DECIMALS;
  const scale = 10 ** decimals;
  const book = [
    { qty: 0, cost: 0, realized: 0 },
    { qty: 0, cost: 0, realized: 0 }
  ];
  for (const f of [...fills].reverse()) {
    const idx = f.outcomeIndex === 1 ? 1 : 0;
    const qty = Number(BigInt(f.quantity)) / scale;
    const px = Number(BigInt(f.price)) / scale;
    const b = book[idx];
    if (f.isBuy) {
      b.qty += qty;
      b.cost += qty * px;
    } else {
      const avg = b.qty > 0 ? b.cost / b.qty : 0;
      const sold = Math.min(qty, b.qty);
      b.realized += (px - avg) * sold;
      b.qty -= sold;
      b.cost -= avg * sold;
    }
  }
  const heldYes = Number(BigInt(balances.yes)) / scale;
  const heldNo = Number(BigInt(balances.no)) / scale;
  const held = [heldYes, heldNo];
  const resolved = market.winningOutcome != null || market.voided;
  const yesMarkRaw = markYesPrice((opts == null ? void 0 : opts.bookTop) ?? {}, market.lastPrice);
  const yesMark = yesMarkRaw != null ? Number(yesMarkRaw) / scale : null;
  const markFor = (idx) => {
    if (market.voided)
      return 0.5;
    if (market.winningOutcome != null)
      return market.winningOutcome === idx ? 1 : 0;
    if (yesMark == null)
      return null;
    return idx === 0 ? yesMark : 1 - yesMark;
  };
  const sidePnl = (idx) => {
    const b = book[idx];
    const avg = b.qty > 0 ? b.cost / b.qty : 0;
    const mark = markFor(idx);
    if (mark == null)
      return { realized: b.realized, unrealized: null, avgCost: avg, mark: null, value: null };
    const unrealized2 = resolved ? held[idx] * mark - avg * Math.min(held[idx], b.qty) : (mark - avg) * held[idx];
    return { realized: b.realized, unrealized: unrealized2, avgCost: avg, mark, value: held[idx] * mark };
  };
  const yes = sidePnl(0);
  const no = sidePnl(1);
  const realized = yes.realized + no.realized;
  const unrealized = yes.unrealized != null && no.unrealized != null ? yes.unrealized + no.unrealized : null;
  return {
    yes,
    no,
    realized,
    unrealized,
    total: unrealized != null ? realized + unrealized : null
  };
}
var MAX_NUDGE_STEPS = 8;
function balanceFloor(raw, decimals = DECIMALS) {
  if (raw <= 0n)
    return 0;
  let candidate = Number(formatUnits(raw, decimals));
  for (let step = 0; step < MAX_NUDGE_STEPS; step += 1) {
    let asRaw;
    try {
      asRaw = parseUnits(humanToDecimalString(candidate, decimals), decimals);
    } catch {
      return candidate * (1 - 2 * Number.EPSILON);
    }
    if (asRaw <= raw)
      return candidate;
    candidate -= Math.max(Math.abs(candidate) * Number.EPSILON, Number.MIN_VALUE);
  }
  return candidate * (1 - 2 * Number.EPSILON);
}
function floorRawBalance(raw, decimals, quantum) {
  if (raw <= 0n)
    return 0;
  let step;
  try {
    step = parseUnits(quantum, decimals);
  } catch {
    step = 0n;
  }
  if (step <= 0n)
    return balanceFloor(raw, decimals);
  return balanceFloor(raw / step * step, decimals);
}
function ceilRawAmount(raw, decimals, quantum) {
  if (raw <= 0n)
    return 0n;
  let step;
  try {
    step = parseUnits(quantum, decimals);
  } catch {
    step = 0n;
  }
  if (step <= 0n)
    return raw;
  return (raw + step - 1n) / step * step;
}
function upProbability(rawYes, decimals) {
  if (rawYes == null || decimals == null)
    return null;
  const probability = priceToProbability(rawYes, decimals);
  return Number.isFinite(probability) ? probability : null;
}
function upPercent(rawYes, decimals) {
  const probability = upProbability(rawYes, decimals);
  return probability == null ? null : Math.round(probability * 100);
}

// node_modules/@somnia-chain/markets-sdk/dist/derivedReads.js
function levelsToCross(book, side) {
  switch (side) {
    case "BUY_YES":
      return book.yesAsks;
    case "SELL_YES":
      return book.yesBids;
    case "BUY_NO":
      return book.noAsks;
    case "SELL_NO":
      return book.noBids;
  }
}
function bookMid(book, side) {
  var _a, _b;
  const isNo = side === "BUY_NO" || side === "SELL_NO";
  const bids = isNo ? book.noBids : book.yesBids;
  const asks = isNo ? book.noAsks : book.yesAsks;
  const bestBid = (_a = bids[0]) == null ? void 0 : _a.price;
  const bestAsk = (_b = asks[0]) == null ? void 0 : _b.price;
  if (bestBid == null || bestAsk == null)
    return null;
  return (bestBid + bestAsk) / 2n;
}
function quoteBinaryOrderOverBook(book, side, quantity, oneCollateral) {
  const levels = levelsToCross(book, side);
  let remaining = quantity > 0n ? quantity : 0n;
  let cost = 0n;
  let filled = 0n;
  let levelsConsumed = 0;
  for (const lvl of levels) {
    if (remaining <= 0n)
      break;
    const take = lvl.quantity < remaining ? lvl.quantity : remaining;
    if (take <= 0n)
      continue;
    cost += take * lvl.price / oneCollateral;
    filled += take;
    remaining -= take;
    levelsConsumed++;
  }
  const avgPrice = filled > 0n ? cost * oneCollateral / filled : 0n;
  const mid = bookMid(book, side);
  const isBuy = side === "BUY_YES" || side === "BUY_NO";
  const slippageVsMid = mid != null && filled > 0n ? isBuy ? avgPrice - mid : mid - avgPrice : 0n;
  return {
    avgPrice,
    cost,
    filledQuantity: filled,
    wouldRest: quantity > filled ? quantity - filled : 0n,
    levelsConsumed,
    slippageVsMid
  };
}
function marketStats24hFromCandles(candles, nowSec) {
  const cutoff = nowSec - 86400;
  const win = candles.filter((c) => Number(c.bucketStart) >= cutoff);
  const first = win[0];
  const last = win[win.length - 1];
  if (first === void 0 || last === void 0) {
    return {
      volume24h: 0n,
      baseVolume24h: 0n,
      trades24h: 0,
      priceChange24h: 0n,
      high24h: null,
      low24h: null,
      openPrice24h: null
    };
  }
  let volume24h = 0n;
  let baseVolume24h = 0n;
  let trades24h = 0;
  let high = BigInt(first.high);
  let low = BigInt(first.low);
  for (const c of win) {
    volume24h += BigInt(c.quoteVolume);
    baseVolume24h += BigInt(c.baseVolume);
    trades24h += c.tradeCount;
    const h = BigInt(c.high);
    const l = BigInt(c.low);
    if (h > high)
      high = h;
    if (l < low)
      low = l;
  }
  const openPrice24h = BigInt(first.openPrice);
  const closeLast = BigInt(last.closePrice);
  return {
    volume24h,
    baseVolume24h,
    trades24h,
    priceChange24h: closeLast - openPrice24h,
    high24h: high,
    low24h: low,
    openPrice24h
  };
}
function pnlEventsFor(account, fills, routerActions) {
  var _a, _b;
  const acct = account.toLowerCase();
  const out = [];
  for (const f of fills) {
    const isMaker = (f.maker ?? "").toLowerCase() === acct;
    const isTaker = (f.taker ?? "").toLowerCase() === acct || (((_a = f.takerOrder) == null ? void 0 : _a.owner) ?? "").toLowerCase() === acct;
    if (!isMaker && !isTaker)
      continue;
    const side = isMaker ? f.makerSide : ((_b = f.takerOrder) == null ? void 0 : _b.side) ?? f.takerSide;
    if (side == null)
      continue;
    const outcomeIndex = side === "BUY_NO" || side === "SELL_NO" ? 1 : 0;
    const isBuy = side === "BUY_YES" || side === "BUY_NO";
    out.push({
      kind: isBuy ? "buy" : "sell",
      outcomeIndex,
      quantity: BigInt(f.quantity),
      price: BigInt(f.fillPrice),
      // YES-terms; inverted per-outcome in the fold
      ts: Number(f.timestamp)
    });
  }
  for (const a of routerActions) {
    if (a.account.toLowerCase() !== acct)
      continue;
    if (a.kind === "MintCompleteSet")
      out.push({ kind: "mint", outcomeIndex: 0, quantity: BigInt(a.amount), price: 0n, ts: Number(a.timestamp) });
    else if (a.kind === "MergeCompleteSet")
      out.push({ kind: "merge", outcomeIndex: 0, quantity: BigInt(a.amount), price: 0n, ts: Number(a.timestamp) });
  }
  out.sort((x, y) => x.ts - y.ts);
  return out.map(({ ts: _ts, ...e }) => e);
}
function computePositionPnL(events, balances, market, oneCollateral, opts) {
  const book = [
    { qty: 0n, cost: 0n, realized: 0n },
    { qty: 0n, cost: 0n, realized: 0n }
  ];
  const applyBuy = (idx, qty, price) => {
    book[idx].qty += qty;
    book[idx].cost += qty * price / oneCollateral;
  };
  const applySell = (idx, qty, price) => {
    const b = book[idx];
    const avg = b.qty > 0n ? b.cost * oneCollateral / b.qty : 0n;
    const sold = qty < b.qty ? qty : b.qty;
    const proceeds = sold * price / oneCollateral;
    const costOut = sold * avg / oneCollateral;
    b.realized += proceeds - costOut;
    b.qty -= sold;
    b.cost -= costOut;
  };
  for (const e of events) {
    if (e.kind === "mint") {
      const each = oneCollateral / 2n;
      applyBuy(0, e.quantity, each);
      applyBuy(1, e.quantity, each);
      continue;
    }
    if (e.kind === "merge") {
      const each = oneCollateral / 2n;
      applySell(0, e.quantity, each);
      applySell(1, e.quantity, each);
      continue;
    }
    const price = e.outcomeIndex === 1 ? oneCollateral - e.price : e.price;
    if (e.kind === "buy")
      applyBuy(e.outcomeIndex, e.quantity, price);
    else
      applySell(e.outcomeIndex, e.quantity, price);
  }
  const held = [balances.balanceYes, balances.balanceNo];
  const yesMark = markYesPrice((opts == null ? void 0 : opts.bookTop) ?? {}, market.lastPrice);
  const markFor = (idx) => {
    if (market.voided)
      return oneCollateral / 2n;
    if (market.winningOutcome != null)
      return market.winningOutcome === idx ? oneCollateral : 0n;
    if (yesMark == null)
      return null;
    return idx === 0 ? yesMark : oneCollateral - yesMark;
  };
  const legFor = (idx) => {
    const b = book[idx];
    const balance = held[idx];
    const avgCost2 = b.qty > 0n ? b.cost * oneCollateral / b.qty : 0n;
    const costBasis2 = balance * avgCost2 / oneCollateral;
    const markPrice = markFor(idx);
    const markValue2 = markPrice != null ? balance * markPrice / oneCollateral : null;
    return {
      balance,
      costBasis: costBasis2,
      // A held-nothing leg has no rate to quote, even if the book remembers one
      // from fills whose tokens have since left the account.
      avgCost: balance > 0n ? avgCost2 : 0n,
      markPrice,
      markValue: markValue2,
      unrealizedPnl: markValue2 != null ? markValue2 - costBasis2 : null,
      realizedPnl: b.realized
    };
  };
  const yes = legFor(0);
  const no = legFor(1);
  const costBasis = yes.costBasis + no.costBasis;
  const markValue = yes.markValue != null && no.markValue != null ? yes.markValue + no.markValue : null;
  const realizedPnl = yes.realizedPnl + no.realizedPnl;
  const totalHeld = held[0] + held[1];
  const avgCost = totalHeld > 0n ? costBasis * oneCollateral / totalHeld : 0n;
  return {
    balanceYes: balances.balanceYes,
    balanceNo: balances.balanceNo,
    costBasis,
    avgCost,
    markValue,
    unrealizedPnl: markValue != null ? markValue - costBasis : null,
    realizedPnl,
    outcomes: { yes, no }
  };
}
function estPayoutFor(input) {
  if (input.voided)
    return input.amount / 2n;
  if (input.winningOutcome != null && input.winningOutcome === input.outcomeIdx) {
    const fee = input.settlementFeeBps < 0n ? 0n : input.settlementFeeBps;
    return input.amount * (10000n - fee) / 10000n;
  }
  return 0n;
}
function claimableFrom(inputs) {
  const out = [];
  for (const i of inputs) {
    if (i.amount <= 0n)
      continue;
    const isWinner = i.winningOutcome != null && i.winningOutcome === i.outcomeIdx;
    if (!i.voided && !isWinner)
      continue;
    out.push({
      marketId: i.marketId,
      // The type promises a lowercased pool; enforce it rather than relying on
      // the indexer wiring happening to feed lowercase rows.
      pool: i.pool.toLowerCase(),
      outcomeIdx: i.outcomeIdx,
      amount: i.amount,
      estPayout: estPayoutFor(i),
      status: i.status
    });
  }
  return out;
}
var BPS_DENOMINATOR = 10000n;
var DEFAULT_SLIPPAGE_BPS = 300n;
var DEFAULT_SLIPPAGE_MIN_TICKS = 10n;
function slippageForCrossing(price, tickSize, opts) {
  const bps = (opts == null ? void 0 : opts.slippageBps) ?? DEFAULT_SLIPPAGE_BPS;
  const minTicks = (opts == null ? void 0 : opts.slippageMinTicks) ?? DEFAULT_SLIPPAGE_MIN_TICKS;
  const percent = price * bps / BPS_DENOMINATOR;
  const floor = minTicks * tickSize;
  return percent > floor ? percent : floor;
}
function quoteBinaryStakeOverBook(book, side, stake, oneCollateral, params) {
  const { tickSize, lotSize } = params;
  if (tickSize <= 0n || lotSize <= 0n || oneCollateral <= 0n || stake <= 0n)
    return null;
  const levels = side === "BUY_YES" ? book.yesAsks : book.noAsks;
  let quantity = 0n;
  let limit = 0n;
  for (const level of levels) {
    const { price, quantity: available } = level;
    if (price <= 0n || price >= oneCollateral || available <= 0n)
      continue;
    const maxQuantity = stake * oneCollateral / price;
    if (maxQuantity <= quantity)
      break;
    const headroom = maxQuantity - quantity;
    const take = available < headroom ? available : headroom;
    quantity += take;
    limit = price;
    if (take < available)
      break;
  }
  if (quantity <= 0n || limit <= 0n)
    return null;
  const maxPrice = oneCollateral - tickSize;
  const paddedRaw = limit + slippageForCrossing(limit, tickSize, params);
  const alignedUp = (paddedRaw + tickSize - 1n) / tickSize * tickSize;
  const paddedLimit = alignedUp > maxPrice ? maxPrice : alignedUp;
  if (paddedLimit <= 0n)
    return null;
  const affordable = stake * oneCollateral / paddedLimit;
  const capped = affordable < quantity ? affordable : quantity;
  const finalQuantity = capped / lotSize * lotSize;
  if (finalQuantity <= 0n || finalQuantity < (params.minQuantity ?? 0n))
    return null;
  return {
    side,
    yesPrice: side === "BUY_YES" ? paddedLimit : oneCollateral - paddedLimit,
    limitPrice: paddedLimit,
    quantity: finalQuantity,
    escrow: (finalQuantity * paddedLimit + oneCollateral - 1n) / oneCollateral
  };
}
function quoteBinarySellOverBook(book, side, quantity, oneCollateral, params) {
  var _a;
  const { tickSize, lotSize } = params;
  if (tickSize <= 0n || lotSize <= 0n || oneCollateral <= 0n || quantity <= 0n)
    return null;
  const bestBid = (_a = (side === "SELL_YES" ? book.yesBids : book.noBids)[0]) == null ? void 0 : _a.price;
  if (bestBid == null || bestBid <= 0n)
    return null;
  const slip = slippageForCrossing(bestBid, tickSize, params);
  const floorRaw = bestBid > slip ? bestBid - slip : tickSize;
  const aligned = floorRaw / tickSize * tickSize;
  const floor = aligned < tickSize ? tickSize : aligned;
  const yesPrice = side === "SELL_YES" ? floor : oneCollateral - floor;
  if (yesPrice <= 0n || yesPrice >= oneCollateral)
    return null;
  const lotQuantity = quantity / lotSize * lotSize;
  if (lotQuantity <= 0n || lotQuantity < (params.minQuantity ?? 0n))
    return null;
  const bids = side === "SELL_YES" ? book.yesBids : book.noBids;
  let fillableQuantity = 0n;
  let estProceeds = 0n;
  for (const { price, quantity: available } of bids) {
    if (price < floor)
      break;
    if (price >= oneCollateral || available <= 0n)
      continue;
    const headroom = lotQuantity - fillableQuantity;
    if (headroom <= 0n)
      break;
    const take = available < headroom ? available : headroom;
    fillableQuantity += take;
    estProceeds += take * price / oneCollateral;
  }
  return { side, yesPrice, limitPrice: floor, quantity: lotQuantity, fillableQuantity, estProceeds };
}
function midYesPrice(bestYesBid, bestYesAsk) {
  if (bestYesBid !== void 0 && bestYesAsk !== void 0) {
    return (bestYesBid + bestYesAsk) / 2n;
  }
  return bestYesAsk ?? bestYesBid;
}
function averageEntryPrice(input) {
  const { trades, outcomeIndex, oneShare } = input;
  const isYes = outcomeIndex === 0;
  const buySide = isYes ? "BUY_YES" : "BUY_NO";
  let weightedCost = 0n;
  let totalQuantity = 0n;
  for (const trade of trades) {
    if (trade.side !== buySide)
      continue;
    let quantity;
    let yesPrice;
    try {
      quantity = BigInt(trade.quantity);
      yesPrice = BigInt(trade.fillPrice);
    } catch {
      continue;
    }
    if (quantity <= 0n)
      continue;
    weightedCost += (isYes ? yesPrice : oneShare - yesPrice) * quantity;
    totalQuantity += quantity;
  }
  if (totalQuantity <= 0n)
    return null;
  return weightedCost / totalQuantity;
}
function outcomeMarkPrice(input) {
  const { outcomeIndex, yesMid, oneShare } = input;
  if (yesMid === void 0)
    return void 0;
  return outcomeIndex === 0 ? yesMid : oneShare - yesMid;
}
function markOutcomePosition(input) {
  const { balance, markPrice, avgEntry, oneShare } = input;
  const value = balance * markPrice / oneShare;
  if (avgEntry === null || avgEntry <= 0n) {
    return { upnl: null, upnlFraction: null, value };
  }
  return {
    upnl: balance * (markPrice - avgEntry) / oneShare,
    upnlFraction: Number(markPrice - avgEntry) / Number(avgEntry),
    value
  };
}
var RESOLVED_STATUSES = /* @__PURE__ */ new Set(["Resolved", "Finalized"]);
function positionMarkState(input) {
  const { status, voided, winningOutcome, outcomeIndex, expirySec, nowSec } = input;
  if (voided || status === "Voided")
    return "voided";
  if (RESOLVED_STATUSES.has(status)) {
    if (winningOutcome == null)
      return "settling";
    return winningOutcome === outcomeIndex ? "won" : "lost";
  }
  return Number.isFinite(expirySec) && expirySec <= nowSec ? "settling" : "live";
}

// node_modules/@somnia-chain/markets-sdk/dist/binary/portfolio.js
async function getOutcomeBalances(account, marketAddress, indexerUrl) {
  var _a, _b;
  const acct = account.toLowerCase();
  const mkt = marketAddress.toLowerCase();
  const data = await gqlRequest(OutcomeBalancesQuery, { acct, mkt }, indexerUrl);
  const yes = ((_a = data.OutcomeBalance.find((b) => b.outcomeIndex === 0)) == null ? void 0 : _a.balance) ?? "0";
  const no = ((_b = data.OutcomeBalance.find((b) => b.outcomeIndex === 1)) == null ? void 0 : _b.balance) ?? "0";
  return { yes, no };
}
function computeOpenPositionsPnL(account, positions, fills, routerActions, bookTops) {
  if (positions.length === 0)
    return [];
  const marketById = /* @__PURE__ */ new Map();
  const balByMarket = /* @__PURE__ */ new Map();
  for (const p of positions) {
    const id2 = p.market.id.toLowerCase();
    marketById.set(id2, p.market);
    const b = balByMarket.get(id2) ?? { yes: 0n, no: 0n };
    if (p.outcomeIndex === 0)
      b.yes = BigInt(p.balance);
    else
      b.no = BigInt(p.balance);
    balByMarket.set(id2, b);
  }
  const fillsByMarket = /* @__PURE__ */ new Map();
  for (const f of fills) {
    const key = f.market.toLowerCase();
    const arr = fillsByMarket.get(key);
    if (arr)
      arr.push(f);
    else
      fillsByMarket.set(key, [f]);
  }
  const actionsByMarket = /* @__PURE__ */ new Map();
  for (const a of routerActions) {
    if (a.market == null)
      continue;
    const key = a.market.toLowerCase();
    const arr = actionsByMarket.get(key);
    if (arr)
      arr.push(a);
    else
      actionsByMarket.set(key, [a]);
  }
  const out = [];
  for (const [id2, market] of marketById) {
    const marketFills = fillsByMarket.get(id2) ?? [];
    const marketActions = actionsByMarket.get(id2) ?? [];
    const events = pnlEventsFor(account, marketFills, marketActions);
    const bal = balByMarket.get(id2) ?? { yes: 0n, no: 0n };
    const oneCollateral = 10n ** BigInt(market.quoteDecimals);
    const bt = bookTops[id2];
    const bookTop = bt ? {
      bestBid: bt.bestBid != null ? BigInt(bt.bestBid) : void 0,
      bestAsk: bt.bestAsk != null ? BigInt(bt.bestAsk) : void 0
    } : void 0;
    const pnl = computePositionPnL(
      events,
      { balanceYes: bal.yes, balanceNo: bal.no },
      // Normalise PortfolioMarket's optional `winningOutcome` to the required
      // nullable computePositionPnL Picks.
      {
        quoteDecimals: market.quoteDecimals,
        lastPrice: market.lastPrice,
        winningOutcome: market.winningOutcome ?? null,
        voided: market.voided
      },
      oneCollateral,
      bookTop ? { bookTop } : void 0
    );
    out.push({ market, ...pnl });
  }
  return out;
}
var DEFAULT_TRADES_LIMIT = 50;
async function getPortfolio(account, opts = {}, indexerUrl) {
  const acct = account.toLowerCase();
  const fillWhere = {
    market: { marketType: { _eq: "BINARY" } },
    _or: [{ maker: { _eq: acct } }, { taker: { _eq: acct } }]
  };
  if (opts.since != null)
    fillWhere.timestamp = { _gte: opts.since };
  const tradesLimit = opts.tradesLimit ?? DEFAULT_TRADES_LIMIT;
  const data = await gqlRequest(PortfolioQuery, { acct, fillWhere, ordersLimit: opts.ordersLimit ?? 200, tradesLimit }, indexerUrl);
  const trades = narrowIndexerInvariant(data.ClobFill.map((f) => {
    var _a, _b;
    const asMaker = (f.maker ?? "").toLowerCase() === acct;
    return {
      id: f.id,
      fillPrice: f.fillPrice,
      quantity: f.quantity,
      timestamp: f.timestamp,
      txHash: f.txHash,
      asMaker,
      side: asMaker ? f.makerSide : ((_a = f.takerOrder) == null ? void 0 : _a.side) ?? null,
      counterparty: asMaker ? ((_b = f.takerOrder) == null ? void 0 : _b.owner) ?? null : f.maker ?? null,
      market: f.market
    };
  }));
  return {
    account: acct,
    // Stamp the cadence label onto each position's / order's market (same as
    // trades above) so an ACTIVE position row can show its contract duration
    // ("15m" / "1h") — the reported DEX-1880 gap.
    positions: narrowIndexerInvariant(data.OutcomeBalance.map((p) => ({
      ...p,
      market: p.market ? { ...p.market, interval: marketIntervalLabel(p.market) } : null
    }))),
    openOrders: narrowIndexerInvariant(data.ClobOrder.map((o) => ({
      ...o,
      market: o.market ? { ...o.market, interval: marketIntervalLabel(o.market) } : null
    }))),
    trades,
    // Newest-first page: a FULL page means older fills were dropped, not that trading stopped.
    // `tradesLimit: 0` asks for no trades at all, so an empty list there is complete, not cut.
    tradesTruncated: tradesLimit > 0 && trades.length >= tradesLimit
  };
}
var PortfolioMarketFields = graphql(`
  fragment PortfolioMarketFields on Market {
    id
    marketAddress
    poolAddress
    asset
    question
    status: clobStatus
    lastPrice
    strike
    expiry
    winningOutcome
    voided
    quoteDecimals
    intervalSec
  }
`);
async function getVaultBalance(p, client) {
  return client.readContract({
    address: p.vault,
    abi: erc20VaultReadAbi,
    functionName: "getWithdrawableBalance",
    args: [p.owner, p.token]
  });
}
async function getOutcomeBalance(p, client) {
  return client.readContract({
    address: p.outcomeToken,
    abi: erc6909Abi,
    functionName: "balanceOf",
    args: [p.account, p.id]
  });
}
async function getVaultPayoutFallbacks(owner, opts = {}, indexerUrl) {
  const where = { owner: { _eq: owner.toLowerCase() } };
  if (opts.token != null)
    where.token = { _eq: opts.token.toLowerCase() };
  const data = await gqlRequest(VaultPayoutFallbacksQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.VaultPayoutFallback;
}
var PortfolioQuery = graphql(`
  query Portfolio($acct: String!, $fillWhere: Fill_bool_exp!, $ordersLimit: Int, $tradesLimit: Int) {
    OutcomeBalance(
      where: { account: { _eq: $acct }, balance: { _gt: "0" } }
      order_by: { balance: desc }
      limit: 200
    ) {
      outcomeIndex
      tokenId
      balance
      market {
        ...PortfolioMarketFields
      }
    }
    ClobOrder: Order(
      where: {
        owner: { _eq: $acct }
        status: { _eq: "Open" }
        market: { marketType: { _eq: "BINARY" } }
      }
      order_by: { placedAtTimestamp: desc }
      limit: $ordersLimit
    ) {
      id
      orderId
      side
      price
      quantityRemaining
      filledQuantity
      fullQuantity
      placedAtTimestamp
      placedTxHash
      market {
        ...PortfolioMarketFields
      }
    }
    ClobFill: Fill(where: $fillWhere, order_by: { timestamp: desc }, limit: $tradesLimit) {
      id
      fillPrice
      quantity
      timestamp
      txHash
      maker
      makerSide
      takerOrder {
        owner
        side
      }
      market {
        marketAddress
        asset
        quoteDecimals
      }
    }
  }
`);
var OutcomeBalancesQuery = graphql(`
  query OutcomeBalances($acct: String!, $mkt: String!) {
        OutcomeBalance(where: {account: {_eq: $acct}, market: {marketAddress: {_eq: $mkt}}}) { outcomeIndex balance }
      }
`);
var VaultPayoutFallbacksQuery = graphql(`
  query VaultPayoutFallbacks($where: VaultPayoutFallback_bool_exp!, $limit: Int, $offset: Int) {
         VaultPayoutFallback(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
           id owner token amount market: market_id timestamp txHash
         }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/balances.js
async function getErc20Balance(token, account, client) {
  return client.readContract({
    address: token,
    abi: erc20ReadAbi,
    functionName: "balanceOf",
    args: [account]
  });
}
async function getErc20Metadata(token, client) {
  const p = { address: token, abi: erc20ReadAbi };
  const [symbol, name, decimals] = await Promise.all([
    client.readContract({ ...p, functionName: "symbol" }),
    client.readContract({ ...p, functionName: "name" }),
    client.readContract({ ...p, functionName: "decimals" })
  ]);
  return { symbol, name, decimals: Number(decimals) };
}
async function getErc20Allowance(token, owner, spender, client) {
  return client.readContract({
    address: token,
    abi: erc20ReadAbi,
    functionName: "allowance",
    args: [owner, spender]
  });
}
async function getBalances(tokens, account, client) {
  return Promise.all(tokens.map((t) => t.id === void 0 ? getErc20Balance(t.token, account, client) : getOutcomeBalance({ outcomeToken: t.token, account, id: t.id }, client)));
}
async function cachedErc20Decimals(token, client, fallback) {
  let perClient = _decimalsCache.get(client);
  if (!perClient) {
    perClient = /* @__PURE__ */ new Map();
    _decimalsCache.set(client, perClient);
  }
  const key = token.toLowerCase();
  const hit = perClient.get(key);
  if (hit !== void 0)
    return hit;
  try {
    const d = Number(await client.readContract({
      address: token,
      abi: erc20ReadAbi,
      functionName: "decimals"
    }));
    perClient.set(key, d);
    return d;
  } catch {
    return fallback;
  }
}
var _decimalsCache = /* @__PURE__ */ new WeakMap();

// node_modules/@somnia-chain/markets-sdk/dist/markets.js
function isBinaryMarket(m) {
  return m.marketType === "BINARY";
}
function isSpotMarket(m) {
  return m.marketType === "SPOT";
}
function isPerpMarket(m) {
  return m.marketType === "PERP";
}
var MarketFields = graphql(`
  fragment MarketFields on Market {
    id
    marketType
    poolAddress
    lastPrice
    lastTradeAt
    cumulativeBaseVolume
    cumulativeQuoteVolume
    tradeCount
    baseDecimals
    quoteDecimals
    createdAtTimestamp
    createdAtBlock
    baseToken
    quoteToken
    baseSymbol
    quoteSymbol
    baseIsNative
    tickSize
    lotSize
    minQuantity
    markPrice
    rawMidpoint
    markPriceUpdatedAt
    stopRegistry
    marginBank
    initialMarginBps
    fundingRate
    cumulativeFundingPerUnit
    indexPrice
    fundingUpdatedAt
    fundingWindowSec
    fundingIntervalSec
    openInterest
    openInterestUpdatedAt
    marketId
    marketAddress
    yesTokenId
    noTokenId
    collateral
    asset
    question
    oracleQuestion
    oracleQuestionId
    status: clobStatus
    strike
    tradingStart
    expiry
    winningOutcome
    payoutNumerators
    payoutDenominator
    resolvedAtBlock
    resolvedAtTimestamp
    createdByTx
    creator
    voided
    backing
    nonce
    finalized
    netBacking
    context
    intervalSec
    operatorId
    venueId
    voidPolicy
  }
`);
var MARKET_FIELDS = MarketFields.toString().replace(/^\s*fragment MarketFields on Market \{|\}\s*$/g, "");
var asAddress = (s) => s;
var asHex = (s) => s;
var lower0x = (s) => s.toLowerCase();
var asAddressOrNull = (s) => s == null ? null : asAddress(s);
var asHexOrNull = (s) => s == null ? null : asHex(s);
function toMarket(r) {
  const base = {
    id: r.id,
    poolAddress: asAddress(r.poolAddress),
    lastPrice: r.lastPrice,
    lastTradeAt: r.lastTradeAt,
    cumulativeBaseVolume: r.cumulativeBaseVolume,
    cumulativeQuoteVolume: r.cumulativeQuoteVolume,
    tradeCount: r.tradeCount,
    baseDecimals: r.baseDecimals,
    quoteDecimals: r.quoteDecimals,
    createdAtTimestamp: r.createdAtTimestamp,
    createdAtBlock: r.createdAtBlock
  };
  switch (r.marketType) {
    case "BINARY":
      return {
        ...base,
        marketType: "BINARY",
        marketId: asHex(r.marketId ?? unreachable("BINARY row missing marketId")),
        marketAddress: asAddress(r.marketAddress ?? unreachable("BINARY row missing marketAddress")),
        yesTokenId: r.yesTokenId ?? unreachable("BINARY row missing yesTokenId"),
        noTokenId: r.noTokenId ?? unreachable("BINARY row missing noTokenId"),
        collateral: asAddress(r.collateral ?? unreachable("BINARY row missing collateral")),
        asset: r.asset ?? unreachable("BINARY row missing asset"),
        question: r.question ?? unreachable("BINARY row missing question"),
        status: r.status ?? unreachable("BINARY row missing status"),
        oracleQuestion: r.oracleQuestion,
        oracleQuestionId: r.oracleQuestionId,
        strike: r.strike ?? unreachable("BINARY row missing strike"),
        tradingStart: r.tradingStart ?? unreachable("BINARY row missing tradingStart"),
        expiry: r.expiry ?? unreachable("BINARY row missing expiry"),
        winningOutcome: r.winningOutcome,
        payoutNumerators: r.payoutNumerators,
        payoutDenominator: r.payoutDenominator,
        resolvedAtBlock: r.resolvedAtBlock,
        resolvedAtTimestamp: r.resolvedAtTimestamp,
        createdByTx: asHexOrNull(r.createdByTx),
        creator: asAddressOrNull(r.creator),
        voided: r.voided,
        backing: r.backing,
        nonce: r.nonce,
        finalized: r.finalized,
        netBacking: r.netBacking,
        context: asHexOrNull(r.context),
        intervalSec: r.intervalSec,
        // Stamp the derived timeframe label so every list/point read serves
        // `interval` ("15m"/"1h"/"4h") ready-to-render — the single place the
        // `intervalSec → label` mapping lives (see interval.ts).
        interval: marketIntervalLabel(r),
        // Stamp the derived resolution mode — the single place the strike-0
        // sentinel is read (see binaryResolutionMode).
        mode: binaryResolutionMode(r.strike),
        operatorId: r.operatorId,
        venueId: asHexOrNull(r.venueId),
        voidPolicy: r.voidPolicy
      };
    case "SPOT":
      return {
        ...base,
        marketType: "SPOT",
        baseToken: asAddress(r.baseToken ?? unreachable("SPOT row missing baseToken")),
        quoteToken: asAddress(r.quoteToken ?? unreachable("SPOT row missing quoteToken")),
        baseSymbol: r.baseSymbol,
        quoteSymbol: r.quoteSymbol,
        baseIsNative: r.baseIsNative ?? unreachable("SPOT row missing baseIsNative"),
        tickSize: r.tickSize ?? unreachable("SPOT row missing tickSize"),
        lotSize: r.lotSize ?? unreachable("SPOT row missing lotSize"),
        minQuantity: r.minQuantity ?? unreachable("SPOT row missing minQuantity"),
        markPrice: r.markPrice,
        rawMidpoint: r.rawMidpoint,
        markPriceUpdatedAt: r.markPriceUpdatedAt,
        stopRegistry: asAddressOrNull(r.stopRegistry)
      };
    case "PERP":
      return {
        ...base,
        marketType: "PERP",
        baseToken: asAddress(r.baseToken ?? unreachable("PERP row missing baseToken")),
        quoteToken: asAddress(r.quoteToken ?? unreachable("PERP row missing quoteToken")),
        baseSymbol: r.baseSymbol,
        quoteSymbol: r.quoteSymbol,
        baseIsNative: r.baseIsNative ?? unreachable("PERP row missing baseIsNative"),
        tickSize: r.tickSize ?? unreachable("PERP row missing tickSize"),
        lotSize: r.lotSize ?? unreachable("PERP row missing lotSize"),
        minQuantity: r.minQuantity ?? unreachable("PERP row missing minQuantity"),
        marginBank: asAddress(r.marginBank ?? unreachable("PERP row missing marginBank")),
        initialMarginBps: r.initialMarginBps ?? unreachable("PERP row missing initialMarginBps"),
        stopRegistry: asAddressOrNull(r.stopRegistry),
        markPrice: r.markPrice,
        markPriceUpdatedAt: r.markPriceUpdatedAt,
        fundingRate: r.fundingRate,
        cumulativeFundingPerUnit: r.cumulativeFundingPerUnit,
        indexPrice: r.indexPrice,
        fundingUpdatedAt: r.fundingUpdatedAt,
        fundingWindowSec: r.fundingWindowSec,
        fundingIntervalSec: r.fundingIntervalSec,
        openInterest: r.openInterest,
        openInterestUpdatedAt: r.openInterestUpdatedAt
      };
    default:
      return unreachable(`unknown marketType ${String(r.marketType)}`);
  }
}
function toMarkets(rows) {
  const out = [];
  for (const r of rows) {
    try {
      out.push(toMarket(r));
    } catch (e) {
      if (!(e instanceof InvariantError))
        throw e;
    }
  }
  return out;
}
function binaryResolutionMode(strike) {
  return strike == null || strike === "0" || strike === 0n ? "reference" : "fixed";
}
async function listMarkets(opts = {}, indexerUrl) {
  const where = {};
  if (opts.marketType)
    where.marketType = { _eq: opts.marketType };
  const data = await gqlRequest(MarketsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return toMarkets(data.Market);
}
var RegistryMarketsQuery = graphql(`
  query RegistryMarkets($where: Market_bool_exp!, $limit: Int, $offset: Int) {
    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit, offset: $offset) {
      ...MarketFields
    }
  }
`);
async function listRegistryMarkets(indexerUrl) {
  const where = {
    _or: [{ marketType: { _neq: "BINARY" } }, { finalized: { _eq: false } }]
  };
  const out = [];
  const PAGE = 500;
  for (let offset = 0; ; offset += PAGE) {
    const data = await gqlRequest(RegistryMarketsQuery, { where, limit: PAGE, offset }, indexerUrl);
    out.push(...toMarkets(data.Market));
    if (data.Market.length < PAGE)
      break;
  }
  return out;
}
function marketCountWhere(opts) {
  const where = {};
  if (opts.marketType)
    where.marketType = { _eq: opts.marketType };
  return where;
}
async function countMarkets(opts = {}, indexerUrl, headers) {
  return aggregateCount("Market", "Market_bool_exp", marketCountWhere(opts), indexerUrl, headers);
}
async function countMarketsBounded(opts = {}, indexerUrl, headers) {
  return aggregateCountBounded("Market", "Market_bool_exp", marketCountWhere(opts), indexerUrl, headers);
}
async function getMarket(id2, indexerUrl) {
  const data = await gqlRequest(MarketByPkQuery, { id: id2 }, indexerUrl);
  return data.Market_by_pk ? toMarket(data.Market_by_pk) : null;
}
async function getMarketByAddress(marketAddress, indexerUrl) {
  var _a;
  const data = await gqlRequest(MarketByAddressQuery, { a: marketAddress.toLowerCase() }, indexerUrl);
  return ((_a = data.Market) == null ? void 0 : _a[0]) ? toMarket(data.Market[0]) : null;
}
async function getBinaryMarketByAddress(marketAddress, indexerUrl) {
  const m = await getMarketByAddress(marketAddress, indexerUrl);
  return m && isBinaryMarket(m) ? m : null;
}
async function listBinaryMarkets(opts = {}, indexerUrl) {
  const where = applyBinaryFilter({ marketType: { _eq: "BINARY" } }, opts);
  const orderBy = binaryOrderBy(opts.orderBy, { createdAtTimestamp: "desc" });
  const data = await gqlRequest(BinaryMarketsQuery, { where, orderBy, limit: opts.limit ?? 50 }, indexerUrl);
  return toMarkets(data.Market).filter(isBinaryMarket);
}
async function listBinaryVenueIds(indexerUrl) {
  const data = await gqlRequest(BinaryOriginPairsQuery, {}, indexerUrl);
  return data.Market.filter((m) => m.venueId != null && m.operatorId != null);
}
async function listBinaryAssets(indexerUrl) {
  const data = await gqlRequest(BinaryAssetsQuery, {}, indexerUrl);
  return data.Market.map((m) => m.asset).filter((a) => a != null && a.length > 0);
}
function binaryMarketCountWhere(opts) {
  const now = String(opts.nowSec ?? Math.floor(Date.now() / 1e3));
  const expiry = opts.phase === "live" ? { _gt: now } : { _lte: now };
  return applyBinaryFilter({ marketType: { _eq: "BINARY" }, expiry }, opts);
}
async function countBinaryMarkets(opts, indexerUrl, headers) {
  return aggregateCount("Market", "Market_bool_exp", binaryMarketCountWhere(opts), indexerUrl, headers);
}
async function countBinaryMarketsBounded(opts, indexerUrl, headers) {
  return aggregateCountBounded("Market", "Market_bool_exp", binaryMarketCountWhere(opts), indexerUrl, headers);
}
async function getBinaryMarket(id2, indexerUrl) {
  const m = await getMarket(id2, indexerUrl);
  return m && isBinaryMarket(m) ? m : null;
}
async function getMarketFees(marketId, indexerUrl) {
  const data = await gqlRequest(MarketFeesQuery, { id: marketId.toLowerCase() }, indexerUrl);
  return data.MarketVenue_by_pk;
}
async function listSpotMarkets(opts = {}, indexerUrl) {
  const where = { marketType: { _eq: "SPOT" } };
  if (opts.baseSymbol != null)
    where.baseSymbol = { _eq: opts.baseSymbol };
  if (opts.quoteSymbol != null)
    where.quoteSymbol = { _eq: opts.quoteSymbol };
  const data = await gqlRequest(SpotMarketsQuery, { where, limit: opts.limit ?? 50 }, indexerUrl);
  return toMarkets(data.Market).filter(isSpotMarket);
}
async function getSpotMarket(id2, indexerUrl) {
  const m = await getMarket(id2.toLowerCase(), indexerUrl);
  return m && isSpotMarket(m) ? m : null;
}
async function getMarketStatusHistory(marketId, indexerUrl) {
  const data = await gqlRequest(MarketStatusHistoryQuery, { id: marketId.toLowerCase() }, indexerUrl);
  return data.MarketStatusUpdate;
}
async function listPerpMarkets(opts = {}, indexerUrl) {
  const where = { marketType: { _eq: "PERP" } };
  if (opts.baseSymbol != null)
    where.baseSymbol = { _eq: opts.baseSymbol };
  if (opts.quoteSymbol != null)
    where.quoteSymbol = { _eq: opts.quoteSymbol };
  const data = await gqlRequest(PerpMarketsQuery, { where, limit: opts.limit ?? 50 }, indexerUrl);
  return toMarkets(data.Market).filter(isPerpMarket);
}
async function getPerpMarket(id2, indexerUrl) {
  const m = await getMarket(id2.toLowerCase(), indexerUrl);
  return m && isPerpMarket(m) ? m : null;
}
async function listLiveBinaryMarkets(filter = {}, indexerUrl) {
  const now = String(filter.nowSec ?? Math.floor(Date.now() / 1e3));
  const where = applyBinaryFilter({ marketType: { _eq: "BINARY" }, expiry: { _gt: now } }, filter);
  const orderBy = binaryOrderBy(filter.orderBy, { expiry: "asc" });
  const data = await gqlRequest(LiveBinaryMarketsQuery, { where, orderBy, limit: filter.limit ?? 50, offset: filter.offset ?? 0 }, indexerUrl);
  return toMarkets(data.Market).filter(isBinaryMarket);
}
async function listPastBinaryMarkets(opts = {}, indexerUrl) {
  const now = String(opts.nowSec ?? Math.floor(Date.now() / 1e3));
  const where = applyBinaryFilter({ marketType: { _eq: "BINARY" }, expiry: { _lte: now } }, opts);
  const data = await gqlRequest(PastBinaryMarketsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return toMarkets(data.Market).filter(isBinaryMarket);
}
function boundaryPrice(m, openingPrices) {
  if (m.mode === "reference") {
    const answered = openingPrices[m.id.toLowerCase()];
    return answered ? { raw: answered, posted: true } : null;
  }
  return { raw: m.strike, posted: false };
}
async function getOpeningPrices(marketIds, indexerUrl) {
  const out = {};
  const ids = marketIds.map((m) => m.toLowerCase());
  if (ids.length === 0)
    return out;
  const links = await gqlRequest(OpeningRefsQuery, { ids }, indexerUrl);
  const marketToQid = /* @__PURE__ */ new Map();
  const qids = /* @__PURE__ */ new Set();
  for (const l of links.MarketReferenceLink) {
    marketToQid.set(l.market.toLowerCase(), String(l.referenceQuestionId));
    qids.add(String(l.referenceQuestionId));
  }
  if (qids.size === 0)
    return out;
  const answers = await gqlRequest(OracleAnswersByQidQuery, { qids: [...qids] }, indexerUrl);
  const qToVal = /* @__PURE__ */ new Map();
  for (const a of answers.OracleAnswer)
    qToVal.set(String(a.id), a.numericValue);
  for (const [market, qid] of marketToQid)
    out[market] = qToVal.get(qid) ?? null;
  return out;
}
async function getResolutionPrices(marketIds, indexerUrl) {
  const out = {};
  const ids = marketIds.map((m) => m.toLowerCase());
  if (ids.length === 0)
    return out;
  const rows = await gqlRequest(ResolutionQidsQuery, { ids }, indexerUrl);
  const marketToQid = /* @__PURE__ */ new Map();
  const qids = /* @__PURE__ */ new Set();
  for (const r of rows.Market) {
    if (r.oracleQuestionId == null || r.oracleQuestionId === "")
      continue;
    marketToQid.set(r.id.toLowerCase(), String(r.oracleQuestionId));
    qids.add(String(r.oracleQuestionId));
  }
  if (qids.size === 0)
    return out;
  const answers = await gqlRequest(OracleAnswersByQidQuery, { qids: [...qids] }, indexerUrl);
  const qToVal = /* @__PURE__ */ new Map();
  for (const a of answers.OracleAnswer)
    qToVal.set(String(a.id), a.voided ? null : a.numericValue);
  for (const [market, qid] of marketToQid)
    out[market] = qToVal.get(qid) ?? null;
  return out;
}
function binaryOrderBy(orderBy, fallback) {
  switch (orderBy) {
    case "newest":
      return { createdAtTimestamp: "desc" };
    case "closingSoon":
      return { expiry: "asc" };
    case "volume":
      return { cumulativeQuoteVolume: "desc" };
    case "tradeCount":
      return { tradeCount: "desc" };
    default:
      return fallback;
  }
}
function applyBinaryFilter(where, f) {
  var _a;
  if (f.operatorId != null)
    where.operatorId = { _eq: f.operatorId };
  if (f.venueId != null)
    where.venueId = { _eq: f.venueId.toLowerCase() };
  if (f.asset != null)
    where.asset = { _eq: f.asset };
  if (f.intervalSec != null) {
    const { minSec, maxSec } = cadenceBandSec(Number(f.intervalSec));
    where.intervalSec = { _gte: String(minSec), _lte: String(maxSec) };
  }
  if (f.status != null)
    where.clobStatus = { _eq: f.status };
  if (f.creator != null)
    where.creator = { _eq: f.creator.toLowerCase() };
  const needle = (_a = f.search) == null ? void 0 : _a.trim();
  if (needle) {
    const pattern = `%${needle}%`;
    where._or = [{ asset: { _ilike: pattern } }, { question: { _ilike: pattern } }];
  }
  return where;
}
var MarketsQuery = graphql(`
  query Markets($where: Market_bool_exp!, $limit: Int, $offset: Int) {
    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit, offset: $offset) {
      ...MarketFields
    }
  }
`);
var MarketByPkQuery = graphql(`
  query MarketByPk($id: String!) {
    Market_by_pk(id: $id) {
      ...MarketFields
    }
  }
`);
var MarketByAddressQuery = graphql(`
  query MarketByAddress($a: String!) {
    Market(
      where: { marketAddress: { _eq: $a } }
      order_by: { createdAtTimestamp: desc }
      limit: 1
    ) {
      ...MarketFields
    }
  }
`);
var BinaryMarketsQuery = graphql(`
  query BinaryMarkets($where: Market_bool_exp!, $orderBy: [Market_order_by!], $limit: Int) {
    Market(where: $where, order_by: $orderBy, limit: $limit) {
      ...MarketFields
    }
  }
`);
var SpotMarketsQuery = graphql(`
  query SpotMarkets($where: Market_bool_exp!, $limit: Int) {
    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit) {
      ...MarketFields
    }
  }
`);
var PerpMarketsQuery = graphql(`
  query PerpMarkets($where: Market_bool_exp!, $limit: Int) {
    Market(where: $where, order_by: { createdAtTimestamp: desc }, limit: $limit) {
      ...MarketFields
    }
  }
`);
var LiveBinaryMarketsQuery = graphql(`
  query LiveBinaryMarkets(
    $where: Market_bool_exp!
    $orderBy: [Market_order_by!]
    $limit: Int!
    $offset: Int!
  ) {
    Market(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...MarketFields
    }
  }
`);
var PastBinaryMarketsQuery = graphql(`
  query PastBinaryMarkets($where: Market_bool_exp!, $limit: Int!, $offset: Int!) {
    Market(where: $where, order_by: { expiry: desc }, limit: $limit, offset: $offset) {
      ...MarketFields
    }
  }
`);
var BinaryOriginPairsQuery = graphql(`
  query BinaryOriginPairs {
         Market(
           distinct_on: [operatorId, venueId],
           where: {marketType: {_eq: "BINARY"}, operatorId: {_is_null: false}, venueId: {_is_null: false}},
           order_by: [{operatorId: asc}, {venueId: asc}]
         ) {
           operatorId
           venueId
         }
       }
`);
var BinaryAssetsQuery = graphql(`
  query BinaryAssets {
         Market(distinct_on: asset, where: {marketType: {_eq: "BINARY"}, asset: {_is_null: false}}, order_by: {asset: asc}) {
           asset
         }
       }
`);
var MarketFeesQuery = graphql(`
  query MarketFees($id: String!) {
         MarketVenue_by_pk(id: $id) {
           operatorId venueId feeRecipient
           makerFeeBps takerFeeBps maxBuilderFeeBps routingFeeBps settlementFeeBps settlementFeesCollected
         }
       }
`);
var MarketStatusHistoryQuery = graphql(`
  query MarketStatusHistory($id: String!) {
         MarketStatusUpdate(where: {market_id: {_eq: $id}}, order_by: {timestamp: asc}) {
           oldStatus newStatus blockNumber timestamp txHash
         }
       }
`);
var OracleAnswersByQidQuery = graphql(`
  query OracleAnswersByQid($qids: [String!]) {
         OracleAnswer(where: {id: {_in: $qids}}) { id numericValue voided }
       }
`);
var ResolutionQidsQuery = graphql(`
  query ResolutionQids($ids: [String!]) {
         Market(where: {id: {_in: $ids}}) { id oracleQuestionId }
       }
`);
var OpeningRefsQuery = graphql(`
  query OpeningRefs($ids: [String!]) {
         MarketReferenceLink(where: {market_id: {_in: $ids}}) { market: market_id referenceQuestionId }
       }
`);
async function getOnchainResolutionPrice(marketId, sources, client) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(marketId)) {
    throw new InvalidInputError(`getOnchainResolutionPrice takes the bytes32 marketId — got ${marketId}`);
  }
  const rec = await client.readContract({
    address: sources.module,
    abi: binaryModuleReadAbi,
    functionName: "markets",
    args: [marketId]
  });
  const oracleQuestionId = rec[0];
  const adapter = rec[6];
  if (oracleQuestionId === 0n || /^0x0{40}$/.test(adapter))
    return null;
  const a = { address: adapter, abi: oracleAdapterReadAbi };
  const revertIsAbsence = (e) => {
    if (e instanceof ContractRevertError)
      return null;
    throw e;
  };
  const [answer, scale] = await Promise.all([
    client.readContract({ ...a, functionName: "pullNumericAnswer", args: [oracleQuestionId] }).catch(revertIsAbsence),
    client.readContract({ ...a, functionName: "PRICE_DECIMALS" }).catch(revertIsAbsence)
  ]);
  if (answer == null)
    return null;
  const [numericValue, voided] = answer;
  return {
    numericValue: numericValue.toString(),
    decimals: scale != null ? Number(scale) : sources.fallbackDecimals ?? 2,
    voided,
    adapter,
    oracleQuestionId: oracleQuestionId.toString()
  };
}
async function getMarketOnchain(marketId, sources, client) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(marketId)) {
    throw new InvalidInputError("getMarketOnchain now takes the bytes32 marketId (0.13.0 breaking change) — got a non-32-byte value. Resolve the id via listBinaryMarkets / the indexer instead of passing a contract address.");
  }
  const pc = client;
  const [rec, nonce] = await Promise.all([
    pc.readContract({
      address: sources.module,
      abi: binaryModuleReadAbi,
      functionName: "markets",
      args: [marketId]
    }),
    pc.readContract({
      address: sources.module,
      abi: binaryModuleReadAbi,
      functionName: "marketNonce",
      args: [marketId]
    })
  ]);
  const collateral = rec[3];
  const marketAddress = rec[8];
  const pool = rec[9];
  const yesId = rec[10];
  const noId = rec[11];
  const expiry = rec[13];
  if (/^0x0{40}$/.test(marketAddress)) {
    throw new InvalidInputError(`unknown marketId ${marketId} on the module`);
  }
  const m = { address: marketAddress, abi: binaryMarketReadAbi2 };
  const [outcomeToken, status, poolBacking, payoutNumerators, isResolved, isVoided, decimals, voidPolicy] = await Promise.all([
    pc.readContract({ ...m, functionName: "outcomeToken" }),
    pc.readContract({ ...m, functionName: "status" }),
    pc.readContract({ ...m, functionName: "backing" }),
    pc.readContract({ ...m, functionName: "payoutNumerators" }),
    pc.readContract({ ...m, functionName: "isResolved" }),
    pc.readContract({ ...m, functionName: "isVoided" }),
    cachedErc20Decimals(collateral, pc, DECIMALS),
    // Snapshot-generation markets only — pre-policy clones lack the selector.
    pc.readContract({ ...m, functionName: "voidPolicy" }).then((v) => Number(v), () => null)
  ]);
  const vec = payoutNumerators ?? [];
  let winningOutcome = 0;
  for (let i = 1; i < vec.length; i++) {
    if ((vec[i] ?? 0n) > (vec[winningOutcome] ?? 0n))
      winningOutcome = i;
  }
  let backing = poolBacking;
  let finalized = false;
  if (sources.settlement) {
    const record = await pc.readContract({
      address: sources.settlement,
      abi: binarySettlementAbi,
      functionName: "getSettlement",
      args: [marketKey(yesId)]
    });
    if (record.finalized) {
      finalized = true;
      backing = record.backing;
    }
  }
  return {
    marketAddress,
    outcomeToken,
    yesId,
    noId,
    pool,
    nonce,
    collateral,
    status: Number(status),
    backing,
    finalized,
    expiry,
    decimals,
    winningOutcome: Number(winningOutcome),
    isResolved,
    isVoided,
    voidPolicy
  };
}
async function getPoolCreator(pool, module, client) {
  return client.readContract({
    address: module,
    abi: binaryModuleReadAbi,
    functionName: "poolCreator",
    args: [pool]
  });
}
async function getContractMeta(address, opts, client) {
  const zero = "0x0000000000000000000000000000000000000000";
  const [owner, impl, balance] = await Promise.all([
    client.readContract({ address, abi: _ownableAbi, functionName: "owner" }).catch(() => null),
    opts.proxy ? client.getStorageAt({ address, slot: _EIP1967_IMPL_SLOT }).then((raw) => {
      if (!raw || raw.length < 42)
        return null;
      const addr = `0x${raw.slice(-40)}`;
      return addr.toLowerCase() === zero ? null : addr;
    }).catch(() => null) : Promise.resolve(null),
    client.getBalance({ address }).catch(() => 0n)
  ]);
  return { owner, impl, balance };
}
var _ownableAbi = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }
];
var _EIP1967_IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

// node_modules/@somnia-chain/markets-sdk/dist/logTopics.js
function topic0Set(abi) {
  const out = /* @__PURE__ */ new Set();
  for (const item of abi) {
    if (item.type !== "event")
      continue;
    out.add(toEventSelector(item));
  }
  return out;
}
function isKnownTopic0(index, topics) {
  const topic0 = topics == null ? void 0 : topics[0];
  return topic0 !== void 0 && index.has(topic0);
}

// node_modules/@somnia-chain/markets-sdk/dist/contractErrorsAbi.js
var contractErrorsAbi = [
  { type: "error", name: "AccessControlBadConfirmation", inputs: [] },
  { type: "error", name: "AccessControlUnauthorizedAccount", inputs: [{ name: "account", type: "address" }, { name: "neededRole", type: "bytes32" }] },
  { type: "error", name: "AccountNotFlat", inputs: [] },
  { type: "error", name: "AdapterNotApproved", inputs: [] },
  { type: "error", name: "AddressEmptyCode", inputs: [{ name: "target", type: "address" }] },
  { type: "error", name: "AddressIsRegisteredBidder", inputs: [] },
  { type: "error", name: "AdlBadBankruptcyPrice", inputs: [] },
  { type: "error", name: "AdlCounterpartySameSide", inputs: [] },
  { type: "error", name: "AdlFlipNotAllowed", inputs: [] },
  { type: "error", name: "AdlGasFloorRequiresScanCap", inputs: [] },
  { type: "error", name: "AdlRankerInvalidPrice", inputs: [] },
  { type: "error", name: "AdlRankerNotSet", inputs: [] },
  { type: "error", name: "AdlSelfSettle", inputs: [] },
  { type: "error", name: "AdlSessionWindowNotSet", inputs: [] },
  { type: "error", name: "AdlZeroNotional", inputs: [] },
  { type: "error", name: "AllocatorAlreadyInitialised", inputs: [] },
  { type: "error", name: "AllocatorNotAtZeroIndex", inputs: [] },
  { type: "error", name: "AllocatorZeroFree", inputs: [] },
  { type: "error", name: "AlreadyArmed", inputs: [] },
  { type: "error", name: "AlreadyClaimed", inputs: [] },
  { type: "error", name: "AlreadyFinalized", inputs: [] },
  { type: "error", name: "AlreadyInitialised", inputs: [] },
  { type: "error", name: "AlreadyLinked", inputs: [] },
  { type: "error", name: "AlreadyRetired", inputs: [] },
  { type: "error", name: "AlreadySubscribed", inputs: [] },
  { type: "error", name: "AmendOldOrderGone", inputs: [{ name: "oldOrderId", type: "uint128" }] },
  { type: "error", name: "AmendReplacementRejected", inputs: [{ name: "requestIndex", type: "uint256" }, { name: "reason", type: "uint8" }] },
  { type: "error", name: "ArrayLengthMismatch", inputs: [] },
  { type: "error", name: "BackingMismatch", inputs: [{ name: "expected", type: "uint256" }, { name: "received", type: "uint256" }] },
  { type: "error", name: "BackingOverflow", inputs: [] },
  { type: "error", name: "BaseTokenAlreadyHasPool", inputs: [{ name: "baseToken", type: "address" }] },
  { type: "error", name: "BatchGasGapNotSet", inputs: [] },
  { type: "error", name: "BatchLiquidationDisabled", inputs: [] },
  { type: "error", name: "BatchTooLarge", inputs: [] },
  { type: "error", name: "BidderAddressReserved", inputs: [] },
  { type: "error", name: "BidderAlreadyRegistered", inputs: [] },
  { type: "error", name: "BidderCannotBeIsolated", inputs: [] },
  { type: "error", name: "BidderNotAContract", inputs: [] },
  { type: "error", name: "BidderNotRegistered", inputs: [] },
  { type: "error", name: "BidderQuoteInProgress", inputs: [] },
  { type: "error", name: "BinaryClobFactoryNotSet", inputs: [] },
  { type: "error", name: "BlockInPast", inputs: [] },
  { type: "error", name: "BooksNotEmpty", inputs: [] },
  { type: "error", name: "BothFeedsUnavailable", inputs: [] },
  { type: "error", name: "BoundaryNotAligned", inputs: [] },
  { type: "error", name: "BoundaryNotFuture", inputs: [] },
  { type: "error", name: "BudgetExhausted", inputs: [] },
  { type: "error", name: "BuilderAddressReserved", inputs: [] },
  { type: "error", name: "BuilderCodesNotSupported", inputs: [] },
  { type: "error", name: "BuilderFeeExceedsApproval", inputs: [] },
  { type: "error", name: "BuilderFeeExceedsCap", inputs: [] },
  { type: "error", name: "BuilderNotApproved", inputs: [] },
  { type: "error", name: "CallerInManualVaultMode", inputs: [{ name: "legIndex", type: "uint256" }, { name: "pool", type: "address" }] },
  { type: "error", name: "CallerIsChild", inputs: [] },
  { type: "error", name: "CallerIsMain", inputs: [] },
  { type: "error", name: "CampaignInactive", inputs: [] },
  { type: "error", name: "CannotLinkSelf", inputs: [] },
  { type: "error", name: "CannotStoreZeroOrder", inputs: [] },
  { type: "error", name: "CaptureStepsExhausted", inputs: [] },
  { type: "error", name: "CaptureTooEarly", inputs: [] },
  { type: "error", name: "ChainStillTriggerable", inputs: [] },
  { type: "error", name: "ChargeableExceedsDeficit", inputs: [] },
  { type: "error", name: "ChargeableExceedsLosses", inputs: [] },
  { type: "error", name: "CircuitBandExceedsInitialMargin", inputs: [] },
  { type: "error", name: "CircuitBreakerTriggered", inputs: [] },
  { type: "error", name: "CloseAlreadyCaptured", inputs: [] },
  { type: "error", name: "CloseNotCaptured", inputs: [] },
  { type: "error", name: "CloseOutMarginExceedsBalance", inputs: [] },
  { type: "error", name: "CollateralMismatch", inputs: [{ name: "pool", type: "address" }] },
  { type: "error", name: "CollateralNotWNative", inputs: [] },
  { type: "error", name: "CollateralTokenMismatch", inputs: [] },
  { type: "error", name: "ContextTooLong", inputs: [] },
  { type: "error", name: "CreditRecipientInDebt", inputs: [] },
  { type: "error", name: "DeadlineExpired", inputs: [{ name: "deadline", type: "uint64" }, { name: "currentTs", type: "uint64" }] },
  { type: "error", name: "DryRunDifference", inputs: [] },
  { type: "error", name: "DuplicateTier", inputs: [] },
  { type: "error", name: "EMANotInitialized", inputs: [] },
  { type: "error", name: "EmptyBatch", inputs: [] },
  { type: "error", name: "EmptyCallData", inputs: [] },
  { type: "error", name: "EmptyFilter", inputs: [] },
  { type: "error", name: "EmptyOrderBatch", inputs: [] },
  { type: "error", name: "EmptySelectors", inputs: [] },
  { type: "error", name: "ERC1967InvalidImplementation", inputs: [{ name: "implementation", type: "address" }] },
  { type: "error", name: "ERC1967NonPayable", inputs: [] },
  { type: "error", name: "ERC20InsufficientAllowance", inputs: [{ name: "spender", type: "address" }, { name: "allowance", type: "uint256" }, { name: "needed", type: "uint256" }] },
  { type: "error", name: "ERC20InsufficientBalance", inputs: [{ name: "sender", type: "address" }, { name: "balance", type: "uint256" }, { name: "needed", type: "uint256" }] },
  { type: "error", name: "ERC20InvalidApprover", inputs: [{ name: "approver", type: "address" }] },
  { type: "error", name: "ERC20InvalidReceiver", inputs: [{ name: "receiver", type: "address" }] },
  { type: "error", name: "ERC20InvalidSender", inputs: [{ name: "sender", type: "address" }] },
  { type: "error", name: "ERC20InvalidSpender", inputs: [{ name: "spender", type: "address" }] },
  { type: "error", name: "EthRefundFailed", inputs: [] },
  { type: "error", name: "ExceedsBalance", inputs: [] },
  { type: "error", name: "ExceedsWithdrawableBalance", inputs: [] },
  { type: "error", name: "ExcessiveInput", inputs: [{ name: "spent", type: "uint256" }, { name: "maxAllowed", type: "uint256" }] },
  { type: "error", name: "ExpiredOrderMustBeCancelled", inputs: [{ name: "orderId", type: "uint128" }] },
  { type: "error", name: "FailedCall", inputs: [] },
  { type: "error", name: "FailedDeployment", inputs: [] },
  { type: "error", name: "FaucetCapExceeded", inputs: [] },
  { type: "error", name: "FeedsDiverged", inputs: [{ name: "primaryPrice", type: "uint256" }, { name: "secondaryPrice", type: "uint256" }] },
  { type: "error", name: "FeeParamsTooLong", inputs: [] },
  { type: "error", name: "FeeRecipientNotSet", inputs: [] },
  { type: "error", name: "FeeRecipientRequired", inputs: [] },
  { type: "error", name: "FeeTooHigh", inputs: [] },
  { type: "error", name: "FillOrKillNotFillable", inputs: [] },
  { type: "error", name: "FillPriceOutsideBand", inputs: [] },
  { type: "error", name: "FillPriceOverflow", inputs: [] },
  { type: "error", name: "FinalTokenMismatch", inputs: [{ name: "expected", type: "address" }, { name: "actual", type: "address" }] },
  { type: "error", name: "FirstRollAlreadyArmed", inputs: [] },
  { type: "error", name: "FreshMarketRequired", inputs: [] },
  { type: "error", name: "FundedPrincipalOverflow", inputs: [] },
  { type: "error", name: "FundingCapExceedsMarginBand", inputs: [] },
  { type: "error", name: "FundingRecipientInDebt", inputs: [] },
  { type: "error", name: "GasLimitExceeded", inputs: [] },
  { type: "error", name: "GasLimitZero", inputs: [] },
  { type: "error", name: "HandlerZeroAddress", inputs: [] },
  { type: "error", name: "ImmediateOrCancelNoFill", inputs: [] },
  { type: "error", name: "InconsistentMinQuantityAndLotSize", inputs: [] },
  { type: "error", name: "IncorrectDryRun", inputs: [] },
  { type: "error", name: "IncorrectOrder", inputs: [] },
  { type: "error", name: "IncorrectSender", inputs: [{ name: "sender", type: "address" }, { name: "expected", type: "address" }] },
  { type: "error", name: "IndexOutOfBounds", inputs: [] },
  { type: "error", name: "InputEqualsOutput", inputs: [] },
  { type: "error", name: "InsufficientActivationBalance", inputs: [] },
  { type: "error", name: "InsufficientBacking", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [{ name: "balance", type: "uint256" }, { name: "needed", type: "uint256" }] },
  { type: "error", name: "InsufficientCollateral", inputs: [] },
  { type: "error", name: "InsufficientCreateValue", inputs: [] },
  { type: "error", name: "InsufficientCredit", inputs: [] },
  { type: "error", name: "InsufficientGasForBatch", inputs: [{ name: "gasAvailable", type: "uint256" }, { name: "gasRequired", type: "uint256" }] },
  { type: "error", name: "InsufficientGasForPayout", inputs: [{ name: "gasLeft", type: "uint256" }] },
  { type: "error", name: "InsufficientLegInput", inputs: [{ name: "legIndex", type: "uint256" }, { name: "available", type: "uint256" }, { name: "required", type: "uint256" }] },
  { type: "error", name: "InsufficientMargin", inputs: [] },
  { type: "error", name: "InsufficientMarginAfterWithdrawal", inputs: [] },
  { type: "error", name: "InsufficientMarginAtCreation", inputs: [] },
  { type: "error", name: "InsufficientMarginForOrder", inputs: [] },
  { type: "error", name: "InsufficientOperatorDeposit", inputs: [{ name: "operatorId", type: "uint32" }, { name: "required", type: "uint256" }, { name: "available", type: "uint256" }] },
  { type: "error", name: "InsufficientOutput", inputs: [{ name: "received", type: "uint256" }, { name: "minRequired", type: "uint256" }] },
  { type: "error", name: "InsufficientPermission", inputs: [] },
  { type: "error", name: "InsufficientSomiPayment", inputs: [] },
  { type: "error", name: "InsufficientVaultBalance", inputs: [] },
  { type: "error", name: "InsuranceFundCandidateHasDebt", inputs: [] },
  { type: "error", name: "InsuranceFundCandidateHasPositions", inputs: [] },
  { type: "error", name: "InsuranceFundCannotTrade", inputs: [] },
  { type: "error", name: "InsuranceFundFeeRecipientConflict", inputs: [] },
  { type: "error", name: "InsuranceFundNotSet", inputs: [] },
  { type: "error", name: "InvalidAdapter", inputs: [] },
  { type: "error", name: "InvalidAddress", inputs: [] },
  { type: "error", name: "InvalidAdlRankerContract", inputs: [] },
  { type: "error", name: "InvalidAdlRankerOrdering", inputs: [] },
  { type: "error", name: "InvalidAmount", inputs: [] },
  { type: "error", name: "InvalidAsset", inputs: [] },
  { type: "error", name: "InvalidBaseToken", inputs: [] },
  { type: "error", name: "InvalidBidderAddress", inputs: [] },
  { type: "error", name: "InvalidBuilder", inputs: [] },
  { type: "error", name: "InvalidCircuitBreakerParameters", inputs: [] },
  { type: "error", name: "InvalidConfig", inputs: [] },
  { type: "error", name: "InvalidCreator", inputs: [{ name: "creator", type: "address" }] },
  { type: "error", name: "InvalidCreditCapBps", inputs: [] },
  { type: "error", name: "InvalidCreditGranterContract", inputs: [] },
  { type: "error", name: "InvalidDepositOrWithdrawal", inputs: [] },
  { type: "error", name: "InvalidDeviationBps", inputs: [] },
  { type: "error", name: "InvalidDynamicIMFParameters", inputs: [] },
  { type: "error", name: "InvalidFeeRecipient", inputs: [] },
  { type: "error", name: "InvalidFundingParameters", inputs: [] },
  { type: "error", name: "InvalidFundingPayer", inputs: [] },
  { type: "error", name: "InvalidGasBufferBps", inputs: [] },
  { type: "error", name: "InvalidGasParameters", inputs: [] },
  { type: "error", name: "InvalidInitialization", inputs: [] },
  { type: "error", name: "InvalidInsuranceFundContract", inputs: [] },
  { type: "error", name: "InvalidIntervalSeconds", inputs: [] },
  { type: "error", name: "InvalidLegQuantity", inputs: [{ name: "legIndex", type: "uint256" }] },
  { type: "error", name: "InvalidLeverage", inputs: [] },
  { type: "error", name: "InvalidLimitPrice", inputs: [] },
  { type: "error", name: "InvalidLinkedWalletRegistryContract", inputs: [] },
  { type: "error", name: "InvalidLiquidationEngineContract", inputs: [] },
  { type: "error", name: "InvalidLotSize", inputs: [] },
  { type: "error", name: "InvalidMarginBank", inputs: [] },
  { type: "error", name: "InvalidMarginParameters", inputs: [] },
  { type: "error", name: "InvalidMarketExpiry", inputs: [] },
  { type: "error", name: "InvalidMarketIndex", inputs: [] },
  { type: "error", name: "InvalidMaxChildren", inputs: [] },
  { type: "error", name: "InvalidMaxFeePerGas", inputs: [] },
  { type: "error", name: "InvalidMaxLegs", inputs: [] },
  { type: "error", name: "InvalidMidpointEmaParameters", inputs: [] },
  { type: "error", name: "InvalidMinQuantity", inputs: [] },
  { type: "error", name: "InvalidMinStopDistance", inputs: [] },
  { type: "error", name: "InvalidMsgValue", inputs: [{ name: "expected", type: "uint256" }, { name: "actual", type: "uint256" }] },
  { type: "error", name: "InvalidOperator", inputs: [] },
  { type: "error", name: "InvalidOperatorPermissionsRegistry", inputs: [] },
  { type: "error", name: "InvalidOrderOwner", inputs: [] },
  { type: "error", name: "InvalidOrderPair", inputs: [] },
  { type: "error", name: "InvalidOutcomeIndex", inputs: [] },
  { type: "error", name: "InvalidOutcomeToken", inputs: [] },
  { type: "error", name: "InvalidOwner", inputs: [] },
  { type: "error", name: "InvalidParameter", inputs: [] },
  { type: "error", name: "InvalidParameters", inputs: [] },
  { type: "error", name: "InvalidPaymasterData", inputs: [] },
  { type: "error", name: "InvalidPayoutVector", inputs: [] },
  { type: "error", name: "InvalidPerpPool", inputs: [] },
  { type: "error", name: "InvalidPerpPoolFactory", inputs: [] },
  { type: "error", name: "InvalidPerpPoolFactoryContract", inputs: [] },
  { type: "error", name: "InvalidPolicy", inputs: [] },
  { type: "error", name: "InvalidPool", inputs: [] },
  { type: "error", name: "InvalidPrice", inputs: [] },
  { type: "error", name: "InvalidPrice", inputs: [{ name: "price", type: "uint256" }, { name: "tickSize", type: "uint256" }] },
  { type: "error", name: "InvalidQuantity", inputs: [{ name: "quantity", type: "uint256" }, { name: "constraint", type: "uint256" }] },
  { type: "error", name: "InvalidReceiver", inputs: [] },
  { type: "error", name: "InvalidRegistry", inputs: [] },
  { type: "error", name: "InvalidSeriesConfig", inputs: [] },
  { type: "error", name: "InvalidSettlement", inputs: [] },
  { type: "error", name: "InvalidSettlementWindow", inputs: [] },
  { type: "error", name: "InvalidSlippage", inputs: [] },
  { type: "error", name: "InvalidSlippageTolerance", inputs: [] },
  { type: "error", name: "InvalidSomiPaymentPerOrder", inputs: [] },
  { type: "error", name: "InvalidSpotPool", inputs: [] },
  { type: "error", name: "InvalidSpotPoolRegistry", inputs: [] },
  { type: "error", name: "InvalidTakerSide", inputs: [] },
  { type: "error", name: "InvalidTickSize", inputs: [] },
  { type: "error", name: "InvalidTier", inputs: [] },
  { type: "error", name: "InvalidTokenAddress", inputs: [{ name: "token", type: "address" }] },
  { type: "error", name: "InvalidTradingWindow", inputs: [] },
  { type: "error", name: "InvalidTriggerPrice", inputs: [] },
  { type: "error", name: "InvalidUnlinkGuard", inputs: [] },
  { type: "error", name: "InvalidVenueFeeParams", inputs: [] },
  { type: "error", name: "InvalidVenueSignature", inputs: [] },
  { type: "error", name: "InvalidVenueVoidPolicy", inputs: [{ name: "policy", type: "uint256" }] },
  { type: "error", name: "InvalidVoidPolicy", inputs: [] },
  { type: "error", name: "IsolatedMarketBlocked", inputs: [] },
  { type: "error", name: "IsolatedSpansMultipleMarkets", inputs: [] },
  { type: "error", name: "KickoffOutOfRange", inputs: [{ name: "seriesId", type: "uint32" }] },
  { type: "error", name: "LegFillFailed", inputs: [{ name: "legIndex", type: "uint256" }] },
  { type: "error", name: "LegInputOverflow", inputs: [{ name: "legIndex", type: "uint256" }, { name: "runningInputAmount", type: "uint256" }] },
  { type: "error", name: "LegPlacementRejected", inputs: [{ name: "legIndex", type: "uint256" }, { name: "reason", type: "bytes" }] },
  { type: "error", name: "LegPlacementRevertedWithoutReason", inputs: [{ name: "legIndex", type: "uint256" }] },
  { type: "error", name: "LengthMismatch", inputs: [] },
  { type: "error", name: "LimitPriceIncompatibleWithTrigger", inputs: [] },
  { type: "error", name: "LinkedListCorrupted", inputs: [] },
  { type: "error", name: "LinkedListEmptyKey", inputs: [] },
  { type: "error", name: "LinkedListNodeAlreadyExists", inputs: [] },
  { type: "error", name: "LinkedWalletFundingDisabled", inputs: [] },
  { type: "error", name: "LiquidationEngineNotSet", inputs: [] },
  { type: "error", name: "MainFundedAccountCannotBeCredited", inputs: [] },
  { type: "error", name: "MainnetDeploymentForbidden", inputs: [] },
  { type: "error", name: "MarginBankMismatch", inputs: [] },
  { type: "error", name: "MarginBankNotSet", inputs: [] },
  { type: "error", name: "MarketAlreadyAdded", inputs: [] },
  { type: "error", name: "MarketDeployFailed", inputs: [] },
  { type: "error", name: "MarketExpiryInPast", inputs: [] },
  { type: "error", name: "MarketNotFinalizedYet", inputs: [] },
  { type: "error", name: "MarketNotSettled", inputs: [] },
  { type: "error", name: "MarketNotSettled", inputs: [{ name: "marketId", type: "bytes32" }] },
  { type: "error", name: "MarketRestricted", inputs: [] },
  { type: "error", name: "MarketTypeMismatch", inputs: [{ name: "expected", type: "bytes4" }, { name: "actual", type: "bytes4" }] },
  { type: "error", name: "MarketTypeReserved", inputs: [] },
  { type: "error", name: "MarkPriceUnavailable", inputs: [] },
  { type: "error", name: "MaxChildrenReached", inputs: [] },
  { type: "error", name: "MaxPositionSizeExceeded", inputs: [] },
  { type: "error", name: "MaxTiersAboveCeiling", inputs: [] },
  { type: "error", name: "MaxTiersBelowActive", inputs: [] },
  { type: "error", name: "MetadataAlreadySet", inputs: [] },
  { type: "error", name: "MigrationSubsNotArmed", inputs: [] },
  { type: "error", name: "MinQuantityMustEqualLotSize", inputs: [] },
  { type: "error", name: "ModuleTypeMismatch", inputs: [{ name: "expected", type: "bytes4" }, { name: "actual", type: "bytes4" }] },
  { type: "error", name: "MustBeSentFromZeroAddress", inputs: [] },
  { type: "error", name: "NativeAmountMismatch", inputs: [] },
  { type: "error", name: "NativeInputNotSupportedInAutoPullMode", inputs: [] },
  { type: "error", name: "NativeIntermediateUnsupported", inputs: [{ name: "legIndex", type: "uint256" }] },
  { type: "error", name: "NativePayoutFailed", inputs: [] },
  { type: "error", name: "NativeRefundExceedsInput", inputs: [{ name: "refund", type: "uint256" }, { name: "forwarded", type: "uint256" }] },
  { type: "error", name: "NativeRefundFailed", inputs: [] },
  { type: "error", name: "NativeTokenTransferFailed", inputs: [] },
  { type: "error", name: "NativeTransferFailed", inputs: [] },
  { type: "error", name: "NativeWithdrawFailed", inputs: [] },
  { type: "error", name: "NoActiveSubscription", inputs: [] },
  { type: "error", name: "NoBadDebt", inputs: [] },
  { type: "error", name: "NoCreditToReclaim", inputs: [] },
  { type: "error", name: "NoFundedPrincipal", inputs: [] },
  { type: "error", name: "NoOpenPosition", inputs: [] },
  { type: "error", name: "NoPositionToFlatten", inputs: [] },
  { type: "error", name: "NoPrecompile", inputs: [] },
  { type: "error", name: "NoProposalPending", inputs: [] },
  { type: "error", name: "NoReducingPositionAtCreation", inputs: [] },
  { type: "error", name: "NoSponsorSigner", inputs: [{ name: "operatorId", type: "uint32" }] },
  { type: "error", name: "NoStateChange", inputs: [] },
  { type: "error", name: "NotALinkedChild", inputs: [] },
  { type: "error", name: "NotArmed", inputs: [] },
  { type: "error", name: "NotASideHolder", inputs: [] },
  { type: "error", name: "NotASpotPool", inputs: [{ name: "pool", type: "address" }] },
  { type: "error", name: "NotAuthorizedAdapter", inputs: [] },
  { type: "error", name: "NotEntryPoint", inputs: [] },
  { type: "error", name: "NotExpired", inputs: [] },
  { type: "error", name: "NotFinalized", inputs: [] },
  { type: "error", name: "NothingOwed", inputs: [] },
  { type: "error", name: "NothingToAdopt", inputs: [] },
  { type: "error", name: "NothingToClaim", inputs: [] },
  { type: "error", name: "NothingToReturn", inputs: [] },
  { type: "error", name: "NotIdPool", inputs: [] },
  { type: "error", name: "NotInitializing", inputs: [] },
  { type: "error", name: "NotLinked", inputs: [] },
  { type: "error", name: "NotLiquidatable", inputs: [] },
  { type: "error", name: "NotModule", inputs: [] },
  { type: "error", name: "NotOperatorOwner", inputs: [] },
  { type: "error", name: "NotOperatorOwner", inputs: [{ name: "operatorId", type: "uint32" }, { name: "caller", type: "address" }] },
  { type: "error", name: "NotOracle", inputs: [] },
  { type: "error", name: "NotOwner", inputs: [] },
  { type: "error", name: "NotQuiesced", inputs: [] },
  { type: "error", name: "NotReactivity", inputs: [] },
  { type: "error", name: "NotReceiver", inputs: [] },
  { type: "error", name: "NotRegistrar", inputs: [] },
  { type: "error", name: "NotSettlement", inputs: [] },
  { type: "error", name: "OnlyAdmin", inputs: [] },
  { type: "error", name: "OnlyAgentPlatform", inputs: [] },
  { type: "error", name: "OnlyApprovedContracts", inputs: [] },
  { type: "error", name: "OnlyCreditGranter", inputs: [] },
  { type: "error", name: "OnlyFundingPayer", inputs: [] },
  { type: "error", name: "OnlyLiquidationEngine", inputs: [] },
  { type: "error", name: "OnlyMarginBank", inputs: [] },
  { type: "error", name: "OnlyPerpPool", inputs: [] },
  { type: "error", name: "OnlyPrecompile", inputs: [] },
  { type: "error", name: "OnlyReactivityPrecompile", inputs: [] },
  { type: "error", name: "OnlySelf", inputs: [] },
  { type: "error", name: "OpeningOrderRequiresQuantity", inputs: [] },
  { type: "error", name: "OpenInterestCapExceeded", inputs: [] },
  { type: "error", name: "OperatorDisabled", inputs: [] },
  { type: "error", name: "OperatorIdReserved", inputs: [] },
  { type: "error", name: "OperatorNotActive", inputs: [{ name: "operatorId", type: "uint32" }] },
  { type: "error", name: "OracleNotAnswered", inputs: [] },
  { type: "error", name: "OracleNotInitialized", inputs: [] },
  { type: "error", name: "OraclePriceStale", inputs: [] },
  { type: "error", name: "OrderAlreadyExpired", inputs: [] },
  { type: "error", name: "OrderAlreadyLinked", inputs: [] },
  { type: "error", name: "OrderDoesNotExist", inputs: [] },
  { type: "error", name: "OrderExpiryBeyondMarket", inputs: [] },
  { type: "error", name: "OrderIdMismatch", inputs: [] },
  { type: "error", name: "OrderInfoIdMismatch", inputs: [] },
  { type: "error", name: "OutcomeCountMismatch", inputs: [] },
  { type: "error", name: "OutcomeTokenNotSet", inputs: [] },
  { type: "error", name: "OutcomeTransferFailed", inputs: [] },
  { type: "error", name: "OwnableInvalidOwner", inputs: [{ name: "owner", type: "address" }] },
  { type: "error", name: "OwnableUnauthorizedAccount", inputs: [{ name: "account", type: "address" }] },
  { type: "error", name: "OwnerMismatch", inputs: [] },
  { type: "error", name: "PendingOwnerOnly", inputs: [] },
  { type: "error", name: "PermitTokenMismatch", inputs: [] },
  { type: "error", name: "PerpPoolAlreadyRegistered", inputs: [] },
  { type: "error", name: "PerpPoolHasActivePositions", inputs: [] },
  { type: "error", name: "PerpPoolNotFromFactory", inputs: [] },
  { type: "error", name: "PerpPoolNotRegistered", inputs: [] },
  { type: "error", name: "PerpPoolWrongMarginBank", inputs: [] },
  { type: "error", name: "PerUserOrderIndexInconsistency", inputs: [] },
  { type: "error", name: "PlacementRevertedWithoutReason", inputs: [{ name: "isBid", type: "bool" }, { name: "quoteIndex", type: "uint256" }] },
  { type: "error", name: "PlacementRevertedWithoutReason", inputs: [{ name: "isBid", type: "bool" }, { name: "userData", type: "uint64" }] },
  { type: "error", name: "PokeTooSoon", inputs: [] },
  { type: "error", name: "PoolAlreadyReleased", inputs: [] },
  { type: "error", name: "PoolBooksNotEmpty", inputs: [] },
  { type: "error", name: "PoolCreatorUnknown", inputs: [{ name: "pool", type: "address" }] },
  { type: "error", name: "PoolIndexOutOfBounds", inputs: [] },
  { type: "error", name: "PoolNotApproved", inputs: [] },
  { type: "error", name: "PoolNotRegistered", inputs: [{ name: "legIndex", type: "uint256" }, { name: "pool", type: "address" }] },
  { type: "error", name: "PoolStateUnchanged", inputs: [] },
  { type: "error", name: "PositionBelowMinQuantity", inputs: [] },
  { type: "error", name: "PostOnlyWouldCross", inputs: [] },
  { type: "error", name: "PredecessorAlreadyAdopted", inputs: [{ name: "prior", type: "address" }] },
  { type: "error", name: "PriceNotAlignedToTickSize", inputs: [] },
  { type: "error", name: "PriceOutOfBounds", inputs: [] },
  { type: "error", name: "PriceOverflow", inputs: [] },
  { type: "error", name: "PriceTooLarge", inputs: [] },
  { type: "error", name: "PrimaryEqualsSecondary", inputs: [] },
  { type: "error", name: "PriorFundingPayerOutstanding", inputs: [{ name: "outstandingPayer", type: "address" }] },
  { type: "error", name: "QuantityBelowMinimum", inputs: [] },
  { type: "error", name: "QuantityBelowMinimum", inputs: [{ name: "quantity", type: "uint256" }, { name: "minimum", type: "uint256" }] },
  { type: "error", name: "QuantityNotAlignedToLotSize", inputs: [] },
  { type: "error", name: "QuestionNotFinal", inputs: [] },
  { type: "error", name: "QueueEmpty", inputs: [] },
  { type: "error", name: "RankerNotLinkAware", inputs: [] },
  { type: "error", name: "RecoveryAmountInvalid", inputs: [{ name: "amount", type: "uint256" }, { name: "balance", type: "uint256" }] },
  { type: "error", name: "RecoveryDestinationZero", inputs: [] },
  { type: "error", name: "RecoveryRateLimited", inputs: [] },
  { type: "error", name: "RecoveryTokenIsNative", inputs: [] },
  { type: "error", name: "RedeemAuthExpired", inputs: [] },
  { type: "error", name: "RedeemNonceUsed", inputs: [] },
  { type: "error", name: "RedeemSignatureInvalid", inputs: [] },
  { type: "error", name: "ReduceOnlyBudgetExceeded", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "RefundFailed", inputs: [] },
  { type: "error", name: "RegistryNotApprovedByOwner", inputs: [] },
  { type: "error", name: "RegistryRequiredForGroupMode", inputs: [] },
  { type: "error", name: "RenounceDisabled", inputs: [] },
  { type: "error", name: "ReviveTooSoon", inputs: [] },
  { type: "error", name: "RouteEmpty", inputs: [] },
  { type: "error", name: "RouterBuilderCodesNotSupportedOnPool", inputs: [{ name: "legIndex", type: "uint256" }, { name: "pool", type: "address" }] },
  { type: "error", name: "RouterBuilderFeeExceedsPoolCap", inputs: [{ name: "legIndex", type: "uint256" }, { name: "pool", type: "address" }, { name: "builderFeeBpsTimes1k", type: "uint96" }, { name: "maxBuilderFeeBpsTimes1k", type: "uint256" }] },
  { type: "error", name: "RouterBuilderFeeWithoutBuilder", inputs: [{ name: "builderFeeBpsTimes1k", type: "uint96" }] },
  { type: "error", name: "RouterBuilderIsPool", inputs: [{ name: "legIndex", type: "uint256" }, { name: "pool", type: "address" }] },
  { type: "error", name: "RouterBuilderIsRouter", inputs: [] },
  { type: "error", name: "RouterBuilderNotApproved", inputs: [{ name: "legIndex", type: "uint256" }, { name: "pool", type: "address" }, { name: "builderFeeBpsTimes1k", type: "uint96" }, { name: "approved", type: "uint256" }] },
  { type: "error", name: "RouterInvalidLegPrice", inputs: [{ name: "legIndex", type: "uint256" }, { name: "priceLimit", type: "uint256" }, { name: "tickSize", type: "uint256" }] },
  { type: "error", name: "RouterMarketQuoteInvalidPriceLimit", inputs: [{ name: "legIndex", type: "uint256" }, { name: "providedPriceLimit", type: "uint256" }] },
  { type: "error", name: "RouterNotApprovedAsOperator", inputs: [{ name: "legIndex", type: "uint256" }, { name: "pool", type: "address" }] },
  { type: "error", name: "RouterQuantityBelowMinimum", inputs: [{ name: "legIndex", type: "uint256" }, { name: "quantity", type: "uint256" }, { name: "minQuantity", type: "uint256" }] },
  { type: "error", name: "RouterQuantityNotLotAligned", inputs: [{ name: "legIndex", type: "uint256" }, { name: "quantity", type: "uint256" }, { name: "lotSize", type: "uint256" }] },
  { type: "error", name: "RouterQuoteInputZero", inputs: [] },
  { type: "error", name: "RouterQuoteOutputZero", inputs: [] },
  { type: "error", name: "RouteTokenMismatch", inputs: [{ name: "legIndex", type: "uint256" }, { name: "expected", type: "address" }, { name: "actualBase", type: "address" }, { name: "actualQuote", type: "address" }] },
  { type: "error", name: "RouteTooLong", inputs: [{ name: "maxLegs", type: "uint256" }] },
  { type: "error", name: "SafeCastOverflowedIntDowncast", inputs: [{ name: "bits", type: "uint8" }, { name: "value", type: "int256" }] },
  { type: "error", name: "SafeCastOverflowedUintDowncast", inputs: [{ name: "bits", type: "uint8" }, { name: "value", type: "uint256" }] },
  { type: "error", name: "SafeERC20FailedOperation", inputs: [{ name: "token", type: "address" }] },
  { type: "error", name: "SelfMatchCancelTaker", inputs: [] },
  { type: "error", name: "SeriesAlreadyLive", inputs: [] },
  { type: "error", name: "SeriesIdOutOfRange", inputs: [{ name: "seriesId", type: "uint32" }] },
  { type: "error", name: "SeriesNotStalled", inputs: [] },
  { type: "error", name: "SettlementAlreadySet", inputs: [] },
  { type: "error", name: "SettlementNotSet", inputs: [] },
  { type: "error", name: "SettlementWindowOpen", inputs: [] },
  { type: "error", name: "SideHolderIndexOutOfBounds", inputs: [] },
  { type: "error", name: "SimulatedFeedRevert", inputs: [] },
  { type: "error", name: "StaleMarketId", inputs: [{ name: "marketId", type: "bytes32" }] },
  { type: "error", name: "StalePrice", inputs: [] },
  { type: "error", name: "SubscriptionAlreadyActive", inputs: [] },
  { type: "error", name: "SubscriptionStillActive", inputs: [] },
  { type: "error", name: "SymbolIndexOutOfRange", inputs: [{ name: "symbolIndex", type: "uint256" }] },
  { type: "error", name: "SymbolLengthUnsupported", inputs: [{ name: "length", type: "uint256" }] },
  { type: "error", name: "SymbolMismatch", inputs: [{ name: "expected", type: "string" }, { name: "actual", type: "string" }] },
  { type: "error", name: "SymbolNotInitialized", inputs: [{ name: "symbolIndex", type: "uint256" }] },
  { type: "error", name: "SymbolStalePrice", inputs: [{ name: "symbolIndex", type: "uint256" }] },
  { type: "error", name: "TakeoverPriceOutOfRange", inputs: [] },
  { type: "error", name: "TakeoverPriceOverflow", inputs: [] },
  { type: "error", name: "TakerFillWouldMintBadDebt", inputs: [] },
  { type: "error", name: "TierBalanceInsufficient", inputs: [] },
  { type: "error", name: "TimestampInPast", inputs: [] },
  { type: "error", name: "TokenZero", inputs: [] },
  { type: "error", name: "TooManyMarkets", inputs: [] },
  { type: "error", name: "TooManyMarketsForQuestion", inputs: [] },
  { type: "error", name: "TooManyRestingOrders", inputs: [] },
  { type: "error", name: "TradingNotActive", inputs: [] },
  { type: "error", name: "TransferRecipientReserved", inputs: [] },
  { type: "error", name: "TransferSourceAndDestinationSame", inputs: [] },
  { type: "error", name: "TriggerTooCloseToEma", inputs: [] },
  { type: "error", name: "Unauthorized", inputs: [] },
  { type: "error", name: "UnderpaidScheduleFee", inputs: [] },
  { type: "error", name: "UnderpaidSchedulingCost", inputs: [] },
  { type: "error", name: "UnexpectedFillPair", inputs: [{ name: "takerKind", type: "uint8" }, { name: "makerKind", type: "uint8" }] },
  { type: "error", name: "UnexpectedNativeDeposit", inputs: [] },
  { type: "error", name: "UnknownFire", inputs: [] },
  { type: "error", name: "UnknownMarket", inputs: [] },
  { type: "error", name: "UnknownMarketType", inputs: [{ name: "marketType", type: "bytes4" }] },
  { type: "error", name: "UnknownOperator", inputs: [] },
  { type: "error", name: "UnknownOracleQuestion", inputs: [] },
  { type: "error", name: "UnknownReader", inputs: [{ name: "reader", type: "address" }] },
  { type: "error", name: "UnknownSeries", inputs: [] },
  { type: "error", name: "UnknownSeriesSelector", inputs: [{ name: "selector", type: "bytes4" }] },
  { type: "error", name: "UnknownSymbol", inputs: [{ name: "symbol", type: "string" }] },
  { type: "error", name: "UnknownVenue", inputs: [] },
  { type: "error", name: "UnlinkBlockedByGuard", inputs: [] },
  { type: "error", name: "UnsponsoredSelector", inputs: [{ name: "selector", type: "bytes4" }] },
  { type: "error", name: "UnsubscribeFailed", inputs: [] },
  { type: "error", name: "UnsupportedFeeParamsVersion", inputs: [{ name: "version", type: "uint8" }] },
  { type: "error", name: "UseBinaryPlacement", inputs: [] },
  { type: "error", name: "UseDepositNative", inputs: [] },
  { type: "error", name: "UseFundNative", inputs: [] },
  { type: "error", name: "UUPSUnauthorizedCallContext", inputs: [] },
  { type: "error", name: "UUPSUnsupportedProxiableUUID", inputs: [{ name: "slot", type: "bytes32" }] },
  { type: "error", name: "VenueAuthExpired", inputs: [] },
  { type: "error", name: "VenueCreationDisabled", inputs: [] },
  { type: "error", name: "VenueFeeAboveHardCap", inputs: [] },
  { type: "error", name: "VenueIdRequired", inputs: [] },
  { type: "error", name: "VenueMismatch", inputs: [] },
  { type: "error", name: "VenueNonceUsed", inputs: [] },
  { type: "error", name: "VenuePolicyDenied", inputs: [] },
  { type: "error", name: "VenueSignerUnset", inputs: [] },
  { type: "error", name: "VoucherAccountCannotBeMainFunded", inputs: [] },
  { type: "error", name: "VoucherAccountLeverageLocked", inputs: [] },
  { type: "error", name: "VoucherLeverageCapNotSet", inputs: [] },
  { type: "error", name: "VoucherMarketNotAllowed", inputs: [] },
  { type: "error", name: "VwapOverflow", inputs: [] },
  { type: "error", name: "WithdrawalBelowCreditFloor", inputs: [] },
  { type: "error", name: "WithdrawalBelowFundedPrincipal", inputs: [] },
  { type: "error", name: "WithdrawalExceedsDeposit", inputs: [{ name: "operatorId", type: "uint32" }, { name: "requested", type: "uint256" }, { name: "available", type: "uint256" }] },
  { type: "error", name: "WithdrawalFailed", inputs: [] },
  { type: "error", name: "WithdrawFailed", inputs: [] },
  { type: "error", name: "WrongEmitter", inputs: [] },
  { type: "error", name: "WrongEvent", inputs: [] },
  { type: "error", name: "WrongReserveAttached", inputs: [] },
  { type: "error", name: "WrongStatus", inputs: [{ name: "expected", type: "uint8" }, { name: "actual", type: "uint8" }] },
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "ZeroAgentOracle", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] },
  { type: "error", name: "ZeroCollateralFillsAllowed", inputs: [] },
  { type: "error", name: "ZeroDeposit", inputs: [] },
  { type: "error", name: "ZeroEntryPoint", inputs: [] },
  { type: "error", name: "ZeroImpl", inputs: [] },
  { type: "error", name: "ZeroModule", inputs: [] },
  { type: "error", name: "ZeroOrder", inputs: [] },
  { type: "error", name: "ZeroOrderIndex", inputs: [] },
  { type: "error", name: "ZeroOwner", inputs: [] },
  { type: "error", name: "ZeroPrimary", inputs: [] },
  { type: "error", name: "ZeroPriority", inputs: [] },
  { type: "error", name: "ZeroQuoteFillsAllowed", inputs: [] },
  { type: "error", name: "ZeroReader", inputs: [] }
];

// node_modules/@somnia-chain/markets-sdk/dist/revert.js
function findRevertData(value) {
  const seen = /* @__PURE__ */ new Set();
  let node = value;
  for (let depth = 0; node != null && depth < 10; depth += 1) {
    if (seen.has(node))
      break;
    seen.add(node);
    const rec = node;
    for (const key of ["data", "raw"]) {
      const candidate = rec[key];
      if (isHex(candidate))
        return candidate;
      if (candidate != null && typeof candidate === "object") {
        const inner = candidate.data;
        if (isHex(inner))
          return inner;
      }
    }
    node = rec.cause ?? rec.error;
  }
  return void 0;
}
function findRevertReason(value) {
  const seen = /* @__PURE__ */ new Set();
  let node = value;
  for (let depth = 0; node != null && depth < 10; depth += 1) {
    if (seen.has(node))
      break;
    seen.add(node);
    const rec = node;
    for (const key of ["reason", "shortMessage", "message"]) {
      const candidate = rec[key];
      if (typeof candidate !== "string" || candidate.length === 0)
        continue;
      const stripped = stripRevertPrefix(candidate);
      if (stripped.length > 0 && stripped.toLowerCase() !== "execution reverted")
        return stripped;
    }
    node = rec.cause ?? rec.error;
  }
  return void 0;
}
function stripRevertPrefix(message) {
  return message.replace(/^\s*(execution\s+)?reverted:?\s*/i, "").trim();
}
function isRevert(value) {
  if (findRevertData(value) !== void 0)
    return true;
  const seen = /* @__PURE__ */ new Set();
  let node = value;
  for (let depth = 0; node != null && depth < 10; depth += 1) {
    if (seen.has(node))
      break;
    seen.add(node);
    const rec = node;
    const name = typeof rec.name === "string" ? rec.name : "";
    if (name === "ContractFunctionRevertedError" || name === "RawContractError")
      return true;
    for (const key of ["message", "shortMessage", "reason"]) {
      const text = rec[key];
      if (typeof text === "string" && /revert/i.test(text))
        return true;
    }
    node = rec.cause ?? rec.error;
  }
  return false;
}
function decodeRevert(caught, context = {}) {
  if (caught instanceof ContractRevertError) {
    if (context.address === void 0 && context.functionName === void 0)
      return caught;
    return new ContractRevertError({
      errorName: caught.errorName,
      args: caught.args,
      reason: caught.reason,
      data: caught.data,
      address: caught.address ?? context.address,
      functionName: caught.functionName ?? context.functionName
    }, { cause: caught.cause });
  }
  const data = findRevertData(caught);
  if (data !== void 0 && data !== "0x") {
    try {
      const decoded = decodeErrorResult({ abi: contractErrorsAbi, data });
      return new ContractRevertError({
        errorName: decoded.errorName,
        args: decoded.args ?? [],
        data,
        address: context.address,
        functionName: context.functionName
      }, { cause: caught });
    } catch {
    }
  }
  const reason = findRevertReason(caught);
  return new ContractRevertError({ reason, data, address: context.address, functionName: context.functionName }, { cause: caught });
}
function toSdkError(caught, operation, context = {}) {
  if (caught instanceof ContractRevertError || caught instanceof RpcError)
    return caught;
  if (isRevert(caught))
    return decodeRevert(caught, context);
  const detail = (caught == null ? void 0 : caught.shortMessage) ?? (caught == null ? void 0 : caught.message) ?? String(caught);
  return new RpcError(operation, detail, { cause: caught });
}

// node_modules/@somnia-chain/markets-sdk/dist/client.js
var WS_REQUEST_TIMEOUT_MS = 4e3;
function makePublicClient(chain, wsRpcUrl) {
  const raw = createPublicClient({
    chain,
    transport: webSocket(wsRpcUrl, { timeout: WS_REQUEST_TIMEOUT_MS })
  });
  return { raw, decorated: withTypedReadErrors(raw) };
}
function withTypedReadErrors(client) {
  const decorated = {};
  if (typeof client.readContract === "function") {
    const readContract = client.readContract.bind(client);
    decorated.readContract = async (args) => {
      try {
        return await readContract(args);
      } catch (e) {
        const { address, functionName } = args;
        throw toSdkError(e, `readContract ${functionName ?? "?"}`, { address, functionName });
      }
    };
  }
  if (typeof client.call === "function") {
    const call = client.call.bind(client);
    decorated.call = async (args) => {
      try {
        return await call(args);
      } catch (e) {
        throw toSdkError(e, "eth_call", { address: args.to });
      }
    };
  }
  if (typeof client.multicall === "function") {
    const multicall = client.multicall.bind(client);
    decorated.multicall = async (args) => {
      var _a, _b;
      try {
        return await multicall(args);
      } catch (e) {
        if (e instanceof ChainDoesNotSupportContract)
          throw e;
        throw toSdkError(e, "multicall", {
          address: (_b = (_a = args.contracts) == null ? void 0 : _a[0]) == null ? void 0 : _b.address
        });
      }
    };
  }
  return { ...client, ...decorated };
}

// node_modules/@somnia-chain/markets-sdk/dist/debug.js
var DISABLED_SPAN = { id: 0, name: "" };
function makeDebug(sink) {
  if (!sink) {
    return {
      enabled: false,
      log: () => {
      },
      warn: () => {
      },
      span: (_name, fn) => fn(DISABLED_SPAN),
      annotate: () => {
      },
      traced: (_name, fn) => (...args) => fn(DISABLED_SPAN, ...args),
      tracedObject: (_prefix, target) => target
    };
  }
  let nextId = 1;
  const emit = (e) => {
    try {
      sink(e);
    } catch {
    }
  };
  function span(name, fn, parent, data) {
    const id2 = nextId++;
    emit({
      kind: "span",
      phase: "start",
      id: id2,
      ...parent && parent.id !== 0 ? { parentId: parent.id } : {},
      name,
      ...data ? { data } : {}
    });
    const t0 = performance.now();
    const end = (error) => emit({
      kind: "span",
      phase: "end",
      id: id2,
      name,
      durationMs: performance.now() - t0,
      ...error !== void 0 ? { error } : {}
    });
    try {
      const out = fn({ id: id2, name });
      if (out instanceof Promise) {
        return out.then((r) => {
          end();
          return r;
        }, (e) => {
          end(e ?? new Error("rejected"));
          throw e;
        });
      }
      end();
      return out;
    } catch (e) {
      end(e ?? new Error("thrown"));
      throw e;
    }
  }
  const callData = (...args) => {
    if (args.length === 0)
      return void 0;
    const [first] = args;
    if (typeof first === "object" && first !== null)
      return { params: first };
    return { args };
  };
  const traced = (name, fn, data) => (...args) => span(name, (s) => fn(s, ...args), void 0, data == null ? void 0 : data(...args));
  function tracedObject(prefix, target) {
    const wrapped = /* @__PURE__ */ new Map();
    return new Proxy(target, {
      get(t, prop, receiver) {
        const value = Reflect.get(t, prop, receiver);
        if (typeof prop !== "string" || typeof value !== "function")
          return value;
        let fn = wrapped.get(prop);
        if (!fn) {
          fn = traced(`${prefix}.${prop}`, (_s, ...args) => Reflect.apply(value, t, args), callData);
          wrapped.set(prop, fn);
        }
        return fn;
      }
    });
  }
  return {
    enabled: true,
    log: (scope, message, data) => emit({ kind: "log", level: "debug", scope, message, ...data ? { data } : {} }),
    warn: (scope, message, data) => emit({ kind: "log", level: "warn", scope, message, ...data ? { data } : {} }),
    span,
    annotate: (s, data) => {
      if (s.id !== 0)
        emit({ kind: "span", phase: "annotate", id: s.id, name: s.name, data });
    },
    traced,
    tracedObject
  };
}
function consoleDebugSink(opts) {
  const prefix = (opts == null ? void 0 : opts.prefix) ?? "[sdk]";
  const depths = /* @__PURE__ */ new Map();
  const pad = (depth) => "  ".repeat(depth);
  const rest = (data) => data === void 0 ? [] : [data];
  return (e) => {
    if (e.kind === "log") {
      const print = e.level === "warn" ? console.warn : console.debug;
      print(`${prefix} ${e.scope} ${e.message}`, ...rest(e.data));
      return;
    }
    if (e.phase === "start") {
      const depth2 = e.parentId === void 0 ? 0 : (depths.get(e.parentId) ?? 0) + 1;
      depths.set(e.id, depth2);
      console.debug(`${prefix} ${pad(depth2)}▶ ${e.name}`, ...rest(e.data));
      return;
    }
    if (e.phase === "annotate") {
      console.debug(`${prefix} ${pad((depths.get(e.id) ?? 0) + 1)}· ${e.name}`, e.data);
      return;
    }
    const depth = depths.get(e.id) ?? 0;
    depths.delete(e.id);
    const line = `${prefix} ${pad(depth)}◀ ${e.name} ${e.durationMs.toFixed(1)}ms`;
    if (e.error === void 0)
      console.debug(line);
    else
      console.warn(line, e.error);
  };
}
function debugCollector() {
  const events = [];
  return {
    events,
    sink: (e) => events.push(e),
    starts: (name) => events.filter((e) => e.kind === "span" && e.phase === "start" && (name === void 0 || e.name === name)),
    ends: (name) => events.filter((e) => e.kind === "span" && e.phase === "end" && (name === void 0 || e.name === name)),
    annotations: (name) => events.filter((e) => e.kind === "span" && e.phase === "annotate" && (name === void 0 || e.name === name)),
    logs: (scope) => events.filter((e) => e.kind === "log" && (scope === void 0 || e.scope === scope))
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/eventsAbi.js
var orderBookEventsAbi = [
  {
    type: "event",
    name: "OrderPlaced",
    inputs: [
      { name: "orderId", type: "uint128", indexed: true },
      {
        name: "placedOrder",
        type: "tuple",
        indexed: false,
        components: [
          { name: "orderId", type: "uint128" },
          { name: "isBid", type: "bool" },
          { name: "owner", type: "address" },
          { name: "userData", type: "uint64" },
          { name: "price", type: "uint256" },
          { name: "fullQuantity", type: "uint256" },
          { name: "quantityRemaining", type: "uint256" },
          { name: "expireTimestampNs", type: "uint64" }
        ]
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OrderRested",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  },
  {
    type: "event",
    name: "OrderCancelled",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  },
  {
    type: "event",
    name: "OrderExpired",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  },
  {
    type: "event",
    name: "OrderReduced",
    inputs: [
      { name: "orderId", type: "uint128", indexed: true },
      { name: "newQuantity", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OrderFilled",
    inputs: [
      { name: "takerOrderId", type: "uint128", indexed: true },
      { name: "makerOrderId", type: "uint128", indexed: true },
      { name: "quantityFilled", type: "uint256", indexed: false },
      { name: "takerRemainingQuantity", type: "uint256", indexed: false },
      { name: "makerRemainingQuantity", type: "uint256", indexed: false },
      { name: "fillPrice", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  // Protocol-initiated maker removals in the base matching loop (same-owner
  // self-match with CancelMaker / the perps exceeds-position guard). Emitted by
  // newer OrderBook deployments (perp pools today); terminal like OrderCancelled.
  //
  // `OrderCancelledPreFill` is the BASE pre-fill-guard event: the matching loop
  // emits it for EVERY pre-fill removal, and a pool's reason tag rides alongside
  // it. Subscribing the base event is what makes the set complete — chasing the
  // reason tags one at a time is how these logs went undecodable, and a log whose
  // topic0 is absent here is discarded by the live tail before decoding, leaving
  // the order `Open` forever and showing phantom depth in the book.
  {
    type: "event",
    name: "OrderCancelledSelfMatch",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  },
  {
    type: "event",
    name: "MakerOrderCancelledExceedsPosition",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  },
  {
    type: "event",
    name: "OrderCancelledPreFill",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  }
];
var spotPoolEventsAbi = [
  {
    type: "event",
    name: "MarkPriceUpdated",
    inputs: [
      { name: "asset", type: "address", indexed: true },
      { name: "markPrice", type: "uint256", indexed: false },
      { name: "rawMidpoint", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OrderBookParametersUpdated",
    inputs: [
      {
        name: "newParameters",
        type: "tuple",
        indexed: false,
        components: [
          { name: "tickSize", type: "uint256" },
          { name: "minQuantity", type: "uint256" },
          { name: "lotSize", type: "uint256" }
        ]
      }
    ],
    anonymous: false
  }
];
var perpPoolEventsAbi = [
  {
    type: "event",
    // 5-arg. The 3-arg form declared here previously was never emitted by any deployed
    // pool, so `watchEvent` filtered on a topic0 that never appeared and the live
    // funding tail silently never fired.
    name: "FundingUpdated",
    inputs: [
      { name: "fundingRate", type: "int256", indexed: false },
      { name: "cumulativeFundingPerUnit", type: "int256", indexed: false },
      { name: "indexPrice", type: "uint256", indexed: false },
      // UNCLAMPED interval span; accrual is capped at n = window / interval.
      { name: "intervalsSettled", type: "uint64", indexed: false },
      // 0 is a SENTINEL for a stale/reverting mark feed, not a price.
      { name: "markPrice", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OpenInterestUpdated",
    // ONE total, not a (long, short) pair — the contract keeps a single counter because
    // the short side is provably equal in a matched CLOB. The two-arg form declared here
    // previously was a different topic0, so this subscription never matched either.
    inputs: [{ name: "openInterest", type: "uint256", indexed: false }],
    anonymous: false
  },
  // The perps reason tags emitted alongside the base `OrderCancelledPreFill` when
  // the pre-fill guard pulls a maker. `_onMakerOrderCancelledPreFill` is a THREE-way
  // branch: negative equity (F-4), an unreadable mark, else exceeds-position (the
  // sibling tag on the OrderBook ABI above). All terminal. Declaring all three keeps
  // this ABI in step with the deployed PerpPool and with the indexer's handlers.
  {
    type: "event",
    name: "MakerOrderCancelledNegativeEquity",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  },
  {
    type: "event",
    name: "MakerOrderCancelledStaleMark",
    inputs: [{ name: "orderId", type: "uint128", indexed: true }],
    anonymous: false
  }
];
var marketCreatorEventsAbi = [
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "marketId", type: "bytes32", indexed: true },
      { name: "market", type: "address", indexed: true },
      { name: "pool", type: "address", indexed: true },
      { name: "yesId", type: "uint256", indexed: false },
      { name: "noId", type: "uint256", indexed: false },
      { name: "collateral", type: "address", indexed: false },
      { name: "asset", type: "string", indexed: false },
      { name: "strike", type: "uint256", indexed: false },
      { name: "tradingStart", type: "uint64", indexed: false },
      { name: "expiry", type: "uint64", indexed: false },
      { name: "oracleQuestionId", type: "uint256", indexed: false },
      { name: "question", type: "string", indexed: false },
      { name: "intervalSec", type: "uint64", indexed: false }
    ],
    anonymous: false
  }
];
var binaryModuleEventsAbi = [
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "marketId", type: "bytes32", indexed: true },
      { name: "market", type: "address", indexed: true },
      { name: "pool", type: "address", indexed: true },
      { name: "oracleQuestionId", type: "uint256", indexed: false },
      { name: "operatorId", type: "uint32", indexed: false },
      { name: "venueId", type: "bytes32", indexed: false },
      { name: "creator", type: "address", indexed: false },
      { name: "collateral", type: "address", indexed: false },
      { name: "yesId", type: "uint256", indexed: false },
      { name: "noId", type: "uint256", indexed: false },
      // Settlement-extraction v2: the pool's market nonce (1 fresh, ++ on recycle)
      // — part of the outcome-id encoding + the pool→market binding key.
      { name: "nonce", type: "uint64", indexed: false },
      { name: "outcomeSlotCount", type: "uint8", indexed: false },
      { name: "marketType", type: "uint8", indexed: false },
      { name: "tradingStart", type: "uint64", indexed: false },
      { name: "expiry", type: "uint64", indexed: false },
      { name: "voidPolicy", type: "uint8", indexed: false },
      { name: "asset", type: "string", indexed: false },
      { name: "strike", type: "uint256", indexed: false },
      { name: "question", type: "string", indexed: false },
      { name: "context", type: "bytes", indexed: false }
    ],
    anonymous: false
  },
  // Settlement-extraction v2 module lifecycle. `MarketFinalized` fires when a
  // market's backing + resolution snapshot are swept to the settlement singleton
  // (the redemption home). `PoolReleased` fires when the finalized, drained pool
  // is returned to its creator's free list — it CLOSES the pool→market binding
  // (the pool may next be recycled onto a different market). Both carry the pool
  // so the tail can flip the binding. Signatures mirror BinaryMarketsModule.
  {
    type: "event",
    name: "MarketFinalized",
    inputs: [
      { name: "marketId", type: "bytes32", indexed: true },
      { name: "pool", type: "address", indexed: true },
      { name: "marketKey", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PoolReleased",
    inputs: [
      { name: "marketId", type: "bytes32", indexed: true },
      { name: "pool", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true }
    ],
    anonymous: false
  }
];
var binaryPoolEventsAbi = [
  {
    type: "event",
    name: "BinaryOrderPlaced",
    inputs: [
      { name: "orderId", type: "uint128", indexed: true },
      // OrderKind enum: 0 BUY_YES · 1 SELL_YES · 2 BUY_NO · 3 SELL_NO.
      { name: "kind", type: "uint8", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PoolFinalized",
    inputs: [
      { name: "marketNonce", type: "uint64", indexed: true },
      { name: "backing", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PoolRecycled",
    inputs: [
      { name: "marketNonce", type: "uint64", indexed: true },
      { name: "market", type: "address", indexed: true }
    ],
    anonymous: false
  }
];
var binarySettlementEventsAbi = [
  {
    type: "event",
    name: "MarketFinalized",
    inputs: [
      { name: "marketKey", type: "uint256", indexed: true },
      { name: "pool", type: "address", indexed: true },
      { name: "nonce", type: "uint64", indexed: false },
      { name: "collateralToken", type: "address", indexed: false },
      { name: "netBacking", type: "uint256", indexed: false },
      { name: "voided", type: "bool", indexed: false },
      { name: "winningOutcome", type: "uint8", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SettlementFeeCharged",
    inputs: [
      { name: "marketKey", type: "uint256", indexed: true },
      { name: "feeRecipient", type: "address", indexed: true },
      { name: "grossBacking", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Redeemed",
    inputs: [
      { name: "marketKey", type: "uint256", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "outcomeIdx", type: "uint8", indexed: false },
      { name: "amountBurned", type: "uint256", indexed: false },
      { name: "collateralOut", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PayoutOwed",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwedClaimed",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
];
var binaryMarketEventsAbi = [
  {
    type: "event",
    name: "StatusChanged",
    inputs: [
      { name: "oldStatus", type: "uint8", indexed: true },
      { name: "newStatus", type: "uint8", indexed: true }
    ],
    anonymous: false
  },
  {
    // Settlement v3: BinaryMarket emits the payout VECTOR + denominator, not a single
    // indexed winner. The live-tail reducer derives winningOutcome as argmax(vector).
    type: "event",
    name: "Resolved",
    inputs: [
      { name: "payoutDenominator", type: "uint32", indexed: false },
      { name: "payoutNumerators", type: "uint256[]", indexed: false }
    ],
    anonymous: false
  },
  { type: "event", name: "Voided", inputs: [], anonymous: false },
  // BinaryPool: a YES+NO pair minted from collateral → backing += amount.
  {
    type: "event",
    name: "SetMinted",
    inputs: [
      { name: "payer", type: "address", indexed: true },
      { name: "yesTo", type: "address", indexed: true },
      { name: "noTo", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  // BinaryPool: a YES+NO pair burned back to collateral → backing -= amount (floor 0).
  {
    type: "event",
    name: "SetBurned",
    inputs: [
      { name: "holder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
  // v2: the pool no longer emits `Redeemed` / `SettlementFeeCharged` — redemption
  // + the fee skim moved to the BinarySettlement singleton (see
  // `binarySettlementEventsAbi`). The pool's live backing is instead zeroed by
  // `PoolFinalized` (in `binaryPoolEventsAbi`) when the market finalizes.
];
var liveEventsAbi = [
  ...orderBookEventsAbi,
  ...spotPoolEventsAbi,
  ...perpPoolEventsAbi,
  ...marketCreatorEventsAbi,
  ...binaryModuleEventsAbi,
  ...binaryMarketEventsAbi,
  ...binaryPoolEventsAbi,
  ...binarySettlementEventsAbi
];

// node_modules/@somnia-chain/markets-sdk/dist/writer.js
function farFutureNs() {
  return BigInt(Math.floor(Date.now() / 1e3) + 50 * 365 * 24 * 3600) * 1000000000n;
}
var ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
var ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
var ORDER_KIND = {
  BUY_YES: 0,
  SELL_YES: 1,
  BUY_NO: 2,
  SELL_NO: 3
};
function toUnsigned(call, description) {
  return {
    to: call.address,
    data: encodeFunctionData({ abi: call.abi, functionName: call.functionName, args: call.args }),
    value: call.value ?? 0n,
    description
  };
}
function approvalCall(token, spender, description) {
  return toUnsigned({ address: token, abi: erc20WriteAbi, functionName: "approve", args: [spender, maxUint256], gas: 0n }, description);
}
var ORDER_BOOK_TOPIC0 = topic0Set(orderBookEventsAbi);
var ORDER_BOOK_EVENT_BY_TOPIC0 = new Map(orderBookEventsAbi.map((e) => [toEventSelector(e), e]));
function poolEvents(receipt, pool) {
  const target = pool.toLowerCase();
  const out = [];
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== target)
      continue;
    const item = ORDER_BOOK_EVENT_BY_TOPIC0.get(log.topics[0]);
    if (item === void 0)
      continue;
    try {
      out.push(decodeEventLog({ abi: [item], data: log.data, topics: log.topics }));
    } catch {
      continue;
    }
  }
  return out;
}
function toOrderFill(args) {
  return {
    takerOrderId: args.takerOrderId,
    makerOrderId: args.makerOrderId,
    quantityFilled: args.quantityFilled,
    takerRemainingQuantity: args.takerRemainingQuantity,
    makerRemainingQuantity: args.makerRemainingQuantity,
    fillPrice: args.fillPrice
  };
}
function decodeBatchAmendResult({ hash, receipt }, { pool, amendmentCount }) {
  const placedIds = [];
  const fills = [];
  for (const { eventName, args } of poolEvents(receipt, pool)) {
    if (eventName === "OrderPlaced") {
      placedIds.push(args.orderId);
    } else if (eventName === "OrderFilled") {
      fills.push(toOrderFill(args));
    }
  }
  const newOrderIds = new Array(amendmentCount).fill(0n);
  for (let i = 0; i < amendmentCount; i++) {
    const id2 = placedIds[i];
    if (id2 === void 0)
      break;
    newOrderIds[i] = id2;
  }
  return { hash, receipt, newOrderIds, fills };
}
function decodeAmendResult({ hash, receipt }, { pool }) {
  let newOrderId = 0n;
  const fills = [];
  for (const { eventName, args } of poolEvents(receipt, pool)) {
    if (eventName === "OrderPlaced" && newOrderId === 0n) {
      newOrderId = args.orderId;
    } else if (eventName === "OrderFilled") {
      fills.push(toOrderFill(args));
    }
  }
  return { hash, receipt, newOrderId, fills };
}
function createWriter(config, deps) {
  const dbg = deps.dbg ?? makeDebug();
  const decimals = config.decimals ?? DECIMALS;
  const oneBase = 10n ** BigInt(decimals);
  const defaultGas = config.gas ?? DEFAULT_GAS;
  const { chain } = deps.getConfig();
  const fees = deps.getConfig().fees ?? DEFAULT_FEES;
  const addresses = () => deps.getConfig().addresses ?? {};
  const { localAccount, walletClient, from, fromAddress } = resolveSigner(config, "createTrader", {
    nonceManager
  });
  const wallet = () => walletClient ?? unreachable("no external wallet client after signer validation");
  const publicClient = config.publicClient ? withTypedReadErrors(config.publicClient) : deps.getClient();
  const nonces = (localAccount == null ? void 0 : localAccount.nonceManager) ?? nonceManager;
  const waitReceipt = (hash) => waitReceiptViaHeads(publicClient, hash);
  async function confirm(hash) {
    const receipt = await waitReceipt(hash);
    return { hash, receipt };
  }
  async function signCall(signer, to, data, gas, value) {
    const nonce = await nonces.consume({ address: fromAddress, chainId: chain.id, client: publicClient });
    return signer.signTransaction({
      type: "eip1559",
      chainId: chain.id,
      to,
      data,
      gas,
      nonce,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      ...value !== void 0 ? { value } : {}
    });
  }
  let realtimeSupported = true;
  async function broadcast(serialized, call) {
    const context = { address: call == null ? void 0 : call.address, functionName: call == null ? void 0 : call.functionName };
    return broadcastSigned(publicClient, serialized, {
      label: "@somnia-chain/markets-sdk",
      retryCount: 0,
      isRealtimeSupported: () => realtimeSupported,
      onRealtimeUnsupported: () => {
        realtimeSupported = false;
      },
      onRejected: () => nonces.reset({ address: fromAddress, chainId: chain.id }),
      decorateError: (e, method) => toSdkError(e, method, context),
      waitReceipt
    });
  }
  async function revertErrorForReceipt(receipt, call) {
    const context = { address: call.address, functionName: call.functionName };
    try {
      await publicClient.call({
        to: call.address,
        data: encodeFunctionData({ abi: call.abi, functionName: call.functionName, args: call.args }),
        account: from,
        blockNumber: receipt.blockNumber,
        ...call.value !== void 0 ? { value: call.value } : {}
      });
    } catch (replayed) {
      const decoded = decodeRevert(replayed, context);
      if (decoded.errorName !== void 0 || decoded.reason !== void 0)
        return decoded;
    }
    return new ContractRevertError({
      ...context,
      reason: `transaction ${receipt.transactionHash} reverted (no revert data recoverable)`
    });
  }
  const execute = dbg.traced("trade.execute", async (s, w) => {
    if (localAccount) {
      const data = encodeFunctionData({ abi: w.abi, functionName: w.functionName, args: w.args });
      const serialized = await dbg.span("trade.signCall", () => signCall(localAccount, w.address, data, w.gas ?? defaultGas, w.value), s);
      const receipt = await dbg.span("trade.broadcast", () => broadcast(serialized, w), s);
      dbg.annotate(s, { hash: receipt.transactionHash });
      if (receipt.status === "reverted")
        throw await revertErrorForReceipt(receipt, w);
      return { hash: receipt.transactionHash, receipt };
    }
    const hash = await (async () => {
      try {
        return await wallet().writeContract({
          address: w.address,
          abi: w.abi,
          functionName: w.functionName,
          args: w.args,
          account: from,
          chain,
          gas: w.gas ?? defaultGas,
          maxFeePerGas: fees.maxFeePerGas,
          maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
          ...w.value !== void 0 ? { value: w.value } : {}
        });
      } catch (e) {
        throw toSdkError(e, "writeContract", { address: w.address, functionName: w.functionName });
      }
    })();
    dbg.annotate(s, { hash });
    const result2 = await dbg.span("trade.confirm", () => confirm(hash), s);
    if (result2.receipt.status === "reverted")
      throw await revertErrorForReceipt(result2.receipt, w);
    return result2;
  }, (w) => ({ functionName: w.functionName, address: w.address }));
  function decodeOrderResult({ hash, receipt }) {
    let orderId;
    const fills = [];
    for (const log of receipt.logs) {
      if (!isKnownTopic0(ORDER_BOOK_TOPIC0, log.topics))
        continue;
      let decoded;
      try {
        decoded = decodeEventLog({ abi: orderBookEventsAbi, data: log.data, topics: log.topics });
      } catch {
        continue;
      }
      if (decoded.eventName === "OrderPlaced") {
        orderId = decoded.args.orderId;
      } else if (decoded.eventName === "OrderFilled") {
        fills.push({
          takerOrderId: decoded.args.takerOrderId,
          makerOrderId: decoded.args.makerOrderId,
          quantityFilled: decoded.args.quantityFilled,
          takerRemainingQuantity: decoded.args.takerRemainingQuantity,
          makerRemainingQuantity: decoded.args.makerRemainingQuantity,
          fillPrice: decoded.args.fillPrice
        });
      }
    }
    return { hash, receipt, orderId, fills };
  }
  async function executeOrder(w) {
    return decodeOrderResult(await execute(w));
  }
  const poolTokensCache = /* @__PURE__ */ new Map();
  async function poolTokens(pool, nonceOverride) {
    const read = { address: pool, abi: binaryPoolTokensAbi };
    const nonce = nonceOverride ?? await publicClient.readContract({ ...read, functionName: "marketNonce" });
    const key = `${pool.toLowerCase()}:${nonce}`;
    const hit = poolTokensCache.get(key);
    if (hit)
      return hit;
    const [outcomeToken, collateral] = await Promise.all([
      publicClient.readContract({ ...read, functionName: "outcomeToken" }),
      publicClient.readContract({ ...read, functionName: "collateralToken" })
    ]);
    const t = {
      outcomeToken,
      yesId: outcomeId(pool, nonce, 0),
      noId: outcomeId(pool, nonce, 1),
      collateral
    };
    poolTokensCache.set(key, t);
    return t;
  }
  async function tokens(p) {
    if (p.outcomeToken && p.yesId !== void 0 && p.noId !== void 0 && p.collateral) {
      return { outcomeToken: p.outcomeToken, yesId: p.yesId, noId: p.noId, collateral: p.collateral };
    }
    const t = await poolTokens(p.pool);
    return {
      outcomeToken: p.outcomeToken ?? t.outcomeToken,
      yesId: p.yesId ?? t.yesId,
      noId: p.noId ?? t.noId,
      collateral: p.collateral ?? t.collateral
    };
  }
  async function marketExpiryNs(pool) {
    return await publicClient.readContract({
      address: pool,
      abi: binaryPoolReadAbi,
      functionName: "marketExpiryNs"
    });
  }
  function escrow(p, { outcomeToken, yesId, noId, collateral }) {
    switch (p.side) {
      case "BUY_YES":
        return { kind: "erc20", token: collateral, amount: (p.quantity * p.price + oneBase - 1n) / oneBase };
      case "BUY_NO":
        return { kind: "erc20", token: collateral, amount: (p.quantity * (oneBase - p.price) + oneBase - 1n) / oneBase };
      case "SELL_YES":
        return { kind: "erc6909", outcomeToken, id: yesId, amount: p.quantity };
      case "SELL_NO":
        return { kind: "erc6909", outcomeToken, id: noId, amount: p.quantity };
    }
  }
  const approvedPairs = /* @__PURE__ */ new Set();
  const pairKey = (token, spender) => `${token.toLowerCase()}:${spender.toLowerCase()}`;
  async function approveIfNeeded(token, spender, amount, gas) {
    if (amount === 0n)
      return;
    const key = pairKey(token, spender);
    if (approvedPairs.has(key))
      return;
    const allowance = await publicClient.readContract({
      address: token,
      abi: erc20WriteAbi,
      functionName: "allowance",
      args: [fromAddress, spender]
    });
    if (allowance >= amount) {
      approvedPairs.add(key);
      return;
    }
    await execute({ address: token, abi: erc20WriteAbi, functionName: "approve", args: [spender, maxUint256], gas });
    approvedPairs.add(key);
  }
  const operatorPairs = /* @__PURE__ */ new Set();
  async function ensureOperator(outcomeToken, spender, gas) {
    const key = pairKey(outcomeToken, spender);
    if (operatorPairs.has(key))
      return;
    const isOperator = await publicClient.readContract({
      address: outcomeToken,
      abi: erc6909Abi,
      functionName: "isOperator",
      args: [fromAddress, spender]
    });
    if (isOperator) {
      operatorPairs.add(key);
      return;
    }
    await execute({ address: outcomeToken, abi: erc6909Abi, functionName: "setOperator", args: [spender, true], gas });
    operatorPairs.add(key);
  }
  function clearApprovalCache(token, spender) {
    if (token && spender) {
      approvedPairs.delete(pairKey(token, spender));
      operatorPairs.delete(pairKey(token, spender));
    } else {
      approvedPairs.clear();
      operatorPairs.clear();
    }
  }
  async function poolCollateral(pool, override) {
    return override ?? (await poolTokens(pool)).collateral;
  }
  const perpBankCache = /* @__PURE__ */ new Map();
  const bankCollateralCache = /* @__PURE__ */ new Map();
  async function resolveMarginBank(p) {
    if (p.marginBank)
      return p.marginBank;
    if (!p.pool) {
      throw new InvalidInputError("pass marginBank or pool (PerpMarket.marginBank has it)");
    }
    const key = p.pool.toLowerCase();
    const hit = perpBankCache.get(key);
    if (hit)
      return hit;
    const bank = await publicClient.readContract({
      address: p.pool,
      abi: perpPoolWriteAbi,
      functionName: "marginBank"
    });
    perpBankCache.set(key, bank);
    return bank;
  }
  async function bankCollateral(bank, override) {
    if (override)
      return override;
    const key = bank.toLowerCase();
    const hit = bankCollateralCache.get(key);
    if (hit)
      return hit;
    const cfg = await publicClient.readContract({
      address: bank,
      abi: marginBankReadAbi,
      functionName: "getSystemConfig"
    });
    bankCollateralCache.set(key, cfg.collateralToken);
    return cfg.collateralToken;
  }
  function resolveRouter(override) {
    const router = override ?? addresses().collateralRouter;
    if (!router || router === ZERO_ADDRESS) {
      throw new NotConfiguredError("a deployed CollateralRouter", "this environment");
    }
    return router;
  }
  function resolveModule(override) {
    const module = override ?? addresses().binaryModule;
    if (!module || module === ZERO_ADDRESS) {
      throw new NotConfiguredError("addresses.binaryModule", "this write");
    }
    return module;
  }
  function resolveSettlement(override) {
    const settlement = override ?? addresses().binarySettlement;
    if (!settlement || settlement === ZERO_ADDRESS) {
      throw new NotConfiguredError("addresses.binarySettlement", "this settlement call (absent on pre-v2 deploys)");
    }
    return settlement;
  }
  function resolveOperatorRegistry(override, attempting = "an operator grant") {
    const registry = override ?? addresses().operatorPermissionsRegistry;
    if (!registry || registry === ZERO_ADDRESS) {
      throw new NotConfiguredError("operatorRegistry or addresses.operatorPermissionsRegistry", attempting);
    }
    return registry;
  }
  let _settlementOutcomeToken;
  async function settlementOutcomeToken(settlement) {
    if (_settlementOutcomeToken)
      return _settlementOutcomeToken;
    _settlementOutcomeToken = await publicClient.readContract({
      address: settlement,
      abi: binarySettlementAbi,
      functionName: "outcomeToken"
    });
    return _settlementOutcomeToken;
  }
  return {
    execute,
    executeOrder,
    poolTokens,
    tokens,
    marketExpiryNs,
    escrow,
    approveIfNeeded,
    ensureOperator,
    clearApprovalCache,
    poolCollateral,
    resolveMarginBank,
    bankCollateral,
    resolveRouter,
    resolveModule,
    resolveSettlement,
    resolveOperatorRegistry,
    settlementOutcomeToken,
    publicClient,
    addresses,
    from,
    fromAddress,
    localAccount,
    wallet,
    chain,
    defaultGas,
    oneBase,
    decimals,
    dbg
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/binary/settlement.js
async function withdrawVault(w, p) {
  if (p.amount <= 0n)
    throw new InvalidInputError("amount must be > 0");
  return w.execute({
    address: p.vault,
    abi: erc20VaultWriteAbi,
    functionName: "withdraw",
    args: [p.token, p.amount],
    gas: p.gas ?? w.defaultGas
  });
}
async function redeem(w, p) {
  const gas = p.gas ?? w.defaultGas;
  const module = w.resolveModule(p.module);
  let outcomeIdx;
  if (p.outcomeIdx !== void 0) {
    outcomeIdx = p.outcomeIdx;
  } else if (p.market) {
    const vec = await w.publicClient.readContract({
      address: p.market,
      abi: binaryMarketReadAbi,
      functionName: "payoutNumerators"
    });
    let winner = 0;
    for (let i = 1; i < vec.length; i++) {
      if ((vec[i] ?? 0n) > (vec[winner] ?? 0n))
        winner = i;
    }
    outcomeIdx = winner;
  } else {
    throw new InvalidInputError("redeem needs outcomeIdx or market to look it up");
  }
  if (p.autoApprove !== false) {
    const outcomeToken = p.outcomeToken ?? (p.market ? await w.publicClient.readContract({
      address: p.market,
      abi: binaryMarketReadAbi,
      functionName: "outcomeToken"
    }) : await w.settlementOutcomeToken(w.resolveSettlement()));
    await w.ensureOperator(outcomeToken, module, gas);
  }
  return w.execute({
    address: module,
    abi: binaryModuleWriteAbi,
    functionName: "redeem",
    args: [p.operatorId ?? 0, p.venueId ?? ZERO_BYTES32, p.marketId, outcomeIdx, p.amount],
    gas
  });
}
async function signRedeemAuth(w, p) {
  const module = w.resolveModule(p.module);
  const owner = p.owner ?? w.fromAddress;
  const operatorId = p.operatorId ?? 0;
  const venueId = p.venueId ?? ZERO_BYTES32;
  const domain = {
    name: "SomniaMarkets",
    version: "1",
    chainId: w.chain.id,
    verifyingContract: module
  };
  const types = {
    RedeemAuthorization: [
      { name: "owner", type: "address" },
      { name: "operatorId", type: "uint32" },
      { name: "venueId", type: "bytes32" },
      { name: "marketId", type: "bytes32" },
      { name: "outcomeIdx", type: "uint8" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };
  const message = {
    owner,
    operatorId,
    venueId,
    marketId: p.marketId,
    outcomeIdx: p.outcomeIdx,
    amount: p.amount,
    nonce: p.nonce,
    deadline: p.deadline
  };
  const signature = w.localAccount ? await w.localAccount.signTypedData({ domain, types, primaryType: "RedeemAuthorization", message }) : (
    // viem's signTypedData ties `message` to the literal `types` map via a
    // deeply-generic conditional; passing a runtime `as const` object trips a
    // variance gap it cannot resolve, though the shape matches exactly. Fixing
    // the signature is not ours to do — this is viem's generic, not our type.
    await w.wallet().signTypedData({
      account: w.from,
      domain,
      types,
      primaryType: "RedeemAuthorization",
      message
    })
  );
  return {
    owner,
    operatorId,
    venueId,
    marketId: p.marketId,
    outcomeIdx: p.outcomeIdx,
    amount: p.amount,
    nonce: p.nonce,
    deadline: p.deadline,
    signature
  };
}
async function redeemFor(w, p) {
  const module = w.resolveModule(p.module);
  const a = p.authorization;
  return w.execute({
    address: module,
    abi: binaryModuleWriteAbi,
    functionName: "redeemFor",
    args: [a.owner, a.nonce, a.deadline, a.signature, a.operatorId, a.venueId, a.marketId, a.outcomeIdx, a.amount],
    gas: p.gas ?? w.defaultGas
  });
}
async function redeemMany(w, p) {
  const gas = p.gas ?? w.defaultGas;
  const module = w.resolveModule(p.module);
  if (p.entries.length === 0) {
    throw new InvalidInputError("redeemMany needs at least one entry");
  }
  if (p.autoApprove !== false) {
    const outcomeToken = p.outcomeToken ?? await w.settlementOutcomeToken(w.resolveSettlement());
    await w.ensureOperator(outcomeToken, module, gas);
  }
  const marketIds = p.entries.map((e) => e.marketId);
  const outcomeIdxs = p.entries.map((e) => e.outcomeIdx);
  const amounts = p.entries.map((e) => e.amount);
  return w.execute({
    address: module,
    abi: binaryModuleWriteAbi,
    functionName: "redeemMany",
    args: [p.operatorId ?? 0, p.venueId ?? ZERO_BYTES32, marketIds, outcomeIdxs, amounts],
    gas
  });
}
async function redeemDirect(w, p) {
  const gas = p.gas ?? w.defaultGas;
  const settlement = w.resolveSettlement(p.settlement);
  const to = p.to ?? w.fromAddress;
  if (p.autoApprove !== false) {
    const outcomeToken = p.outcomeToken ?? await w.settlementOutcomeToken(settlement);
    await w.ensureOperator(outcomeToken, settlement, gas);
  }
  return w.execute({
    address: settlement,
    abi: binarySettlementAbi,
    functionName: "redeem",
    args: [p.outcomeId, p.amount, to],
    gas
  });
}
async function claimOwed(w, p) {
  return w.execute({
    address: w.resolveSettlement(p.settlement),
    abi: binarySettlementAbi,
    functionName: "claimOwed",
    args: [p.token],
    gas: p.gas ?? w.defaultGas
  });
}
async function finalizeMarket(w, p) {
  return w.execute({
    address: w.resolveModule(p.module),
    abi: binaryModuleWriteAbi,
    functionName: "finalizeMarket",
    args: [p.marketId],
    gas: p.gas ?? w.defaultGas
  });
}
async function syncSettlement(w, p) {
  return w.execute({
    address: w.resolveModule(p.module),
    abi: binaryModuleWriteAbi,
    functionName: "syncSettlement",
    args: [p.marketId],
    gas: p.gas ?? w.defaultGas
  });
}
async function releasePool(w, p) {
  return w.execute({
    address: w.resolveModule(p.module),
    abi: binaryModuleWriteAbi,
    functionName: "releasePool",
    args: [p.marketId],
    gas: p.gas ?? w.defaultGas
  });
}
async function pokeOracle(w, p) {
  return w.execute({
    address: w.resolveModule(p.module),
    abi: binaryModuleWriteAbi,
    functionName: "pokeOracle",
    args: [p.oracleQuestionId],
    gas: p.gas ?? w.defaultGas
  });
}
async function voidExpired(w, p) {
  const client = w.publicClient;
  const onchain = await getMarketOnchain(p.marketId, { module: w.resolveModule(p.module) }, client);
  if (!p.skipPreflight) {
    if (onchain.isResolved || onchain.isVoided) {
      throw new InvalidInputError(`voidExpired: market ${p.marketId} is already ${onchain.isVoided ? "voided" : "resolved"} — nothing to void`);
    }
    const [window, head] = await Promise.all([
      client.readContract({
        address: onchain.marketAddress,
        abi: binaryMarketReadAbi2,
        functionName: "settlementWindow"
      }),
      client.getBlock()
    ]);
    const gate = onchain.expiry + window;
    const now = head.timestamp;
    if (now < gate) {
      throw new InvalidInputError(`voidExpired: market ${p.marketId} is still inside its settlement window — callable at unix ${gate} (${new Date(Number(gate) * 1e3).toISOString()}), ${gate - now}s away by the chain's clock (block ts ${now}). Try pokeOracle first.`);
    }
  }
  return w.execute({
    address: onchain.marketAddress,
    abi: binaryMarketWriteAbi,
    functionName: "voidExpired",
    args: [],
    gas: p.gas ?? w.defaultGas
  });
}
async function redeemNative(w, p) {
  const router = w.resolveRouter(p.router);
  return w.execute({
    address: router,
    abi: collateralRouterWriteAbi,
    functionName: "redeemNative",
    args: [p.operatorId, p.venueId, p.marketId, p.outcomeIdx, p.amount],
    gas: p.gas ?? w.defaultGas
  });
}
async function getMarketResolution(marketId, indexerUrl) {
  var _a;
  const id2 = marketId.toLowerCase();
  const data = await gqlRequest(MarketResolutionQuery, { id: id2 }, indexerUrl);
  const reference = data.MarketReferenceLink[0] ?? null;
  const closingQid = ((_a = data.Market_by_pk) == null ? void 0 : _a.oracleQuestionId) ?? "";
  const openingQid = (reference == null ? void 0 : reference.oracleQuestionId) ?? "";
  const ans = await gqlRequest(OracleAnswersQuery, { closingQid, openingQid }, indexerUrl);
  const closingAnswer = ans.closing;
  const openingAnswer = ans.opening;
  return { events: data.MarketResolutionEvent, reference, closingAnswer, openingAnswer, oracleAnswer: closingAnswer };
}
var MarketResolutionQuery = graphql(`
  query MarketResolution($id: String!) {
         MarketResolutionEvent(where: {market_id: {_eq: $id}}, order_by: {timestamp: asc}) {
           id market: market_id kind winningOutcome: outcomeIdx payoutNumerators payoutDenominator voided blockNumber timestamp txHash
         }
         MarketReferenceLink(where: {market_id: {_eq: $id}}, limit: 1) {
           id market: market_id oracleQuestionId: referenceQuestionId pending
         }
         Market_by_pk(id: $id) { oracleQuestionId }
       }
`);
var OracleAnswersQuery = graphql(`
  query OracleAnswers($closingQid: String!, $openingQid: String!) {
         closing: OracleAnswer_by_pk(id: $closingQid) { oracleQuestionId numericValue outcomeLabel voidReason resolvedAt txHash }
         opening: OracleAnswer_by_pk(id: $openingQid) { oracleQuestionId numericValue outcomeLabel voidReason resolvedAt txHash }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/perp/portfolio.js
var PerpPortfolioMarketFields = graphql(`
  fragment PerpPortfolioMarketFields on Market {
    poolAddress
    baseSymbol
    quoteSymbol
    baseDecimals
    quoteDecimals
    tickSize
    lotSize
    minQuantity
    lastPrice
    marginBank
    initialMarginBps
    fundingRate
    indexPrice
    stopRegistry
  }
`);
async function getPerpPortfolio(account, opts = {}, indexerUrl) {
  const acct = account.toLowerCase();
  const fillWhere = {
    market: { marketType: { _eq: "PERP" } },
    _or: [{ maker: { _eq: acct } }, { taker: { _eq: acct } }]
  };
  if (opts.since != null)
    fillWhere.timestamp = { _gte: opts.since };
  const tradesLimit = opts.tradesLimit ?? DEFAULT_TRADES_LIMIT;
  const data = await gqlRequest(PerpPortfolioQuery, { acct, fillWhere, ordersLimit: opts.ordersLimit ?? 200, tradesLimit }, indexerUrl);
  const trades = narrowIndexerInvariant(data.PerpFill.map((f) => {
    const asMaker = (f.maker ?? "").toLowerCase() === acct;
    const takerIsBid = f.takerIsBid ?? false;
    return {
      id: f.id,
      fillPrice: f.fillPrice,
      quantity: f.quantity,
      quoteQuantity: f.quoteQuantity,
      timestamp: f.timestamp,
      txHash: f.txHash,
      isBid: asMaker ? !takerIsBid : takerIsBid,
      asMaker,
      counterparty: asMaker ? f.taker ?? null : f.maker ?? null,
      market: f.market
    };
  }));
  return {
    account: acct,
    openOrders: narrowIndexerInvariant(data.PerpOrder),
    trades,
    // Newest-first page: a FULL page means older fills were dropped, not that trading stopped.
    // `tradesLimit: 0` asks for no trades at all, so an empty list there is complete, not cut.
    tradesTruncated: tradesLimit > 0 && trades.length >= tradesLimit
  };
}
var PerpPortfolioQuery = graphql(`
  query PerpPortfolio(
    $acct: String!
    $fillWhere: Fill_bool_exp!
    $ordersLimit: Int
    $tradesLimit: Int
  ) {
    PerpOrder: Order(
      where: {
        owner: { _eq: $acct }
        status: { _eq: "Open" }
        market: { marketType: { _eq: "PERP" } }
      }
      order_by: { placedAtTimestamp: desc }
      limit: $ordersLimit
    ) {
      id
      orderId
      isBid
      price
      quantityRemaining
      filledQuantity
      fullQuantity
      placedAtTimestamp
      placedTxHash
      market {
        ...PerpPortfolioMarketFields
      }
    }
    PerpFill: Fill(where: $fillWhere, order_by: { timestamp: desc }, limit: $tradesLimit) {
      id
      fillPrice
      quantity
      quoteQuantity
      timestamp
      txHash
      maker
      taker
      takerIsBid
      market {
        ...PerpPortfolioMarketFields
      }
    }
  }
`);
var PerpOrderHistoryQuery = graphql(`
  query PerpOrderHistory($where: Order_bool_exp!, $orderBy: [Order_order_by!], $limit: Int, $offset: Int) {
    Order(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      id
      orderId
      isBid
      price
      quantityRemaining
      filledQuantity
      fullQuantity
      status
      rested
      expireTimestampNs
      placedAtTimestamp
      placedTxHash
      lastUpdatedAtTimestamp
      market {
        ...PerpPortfolioMarketFields
      }
    }
  }
`);
async function listPerpOrderHistory(account, opts = {}, indexerUrl) {
  const where = {
    owner: { _eq: account.toLowerCase() },
    market: { marketType: { _eq: "PERP" } }
  };
  const requested = opts.status ?? [];
  const terminal = requested.filter((st) => st !== "Open");
  where.status = terminal.length > 0 ? { _in: terminal } : { _neq: "Open" };
  if (opts.pool != null)
    where.market = { marketType: { _eq: "PERP" }, poolAddress: { _eq: opts.pool.toLowerCase() } };
  const orderBy = opts.orderBy === "placed" ? [{ placedAtTimestamp: "desc" }, { id: "desc" }] : [{ lastUpdatedAtTimestamp: "desc" }, { id: "desc" }];
  const data = await gqlRequest(PerpOrderHistoryQuery, { where, orderBy, limit: opts.limit ?? 100, offset: opts.offset ?? 0 }, indexerUrl);
  return narrowIndexerInvariant(data.Order);
}

// node_modules/@somnia-chain/markets-sdk/dist/perp/history.js
async function getFundingPayments(account, opts = {}, indexerUrl) {
  const where = { account: { _eq: account.toLowerCase() } };
  if (opts.pool != null)
    where.pool = { _eq: opts.pool.toLowerCase() };
  const data = await gqlRequest(FundingPaymentsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.FundingPayment;
}
async function getMarginEvents(account, opts = {}, indexerUrl) {
  const data = await gqlRequest(MarginEventsQuery, { account: account.toLowerCase(), limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.MarginEvent;
}
async function getLiquidations(opts = {}, indexerUrl) {
  const where = {};
  if (opts.account != null)
    where.account = { _eq: opts.account.toLowerCase() };
  if (opts.pool != null)
    where.pool = { _eq: opts.pool.toLowerCase() };
  const data = await gqlRequest(LiquidationsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.LiquidationEvent;
}
async function listFundingRateHistory(pool, opts = {}, indexerUrl) {
  const timestamp = {};
  if (opts.from != null)
    timestamp._gte = opts.from.toString();
  if (opts.to != null)
    timestamp._lt = opts.to.toString();
  const where = { pool: { _eq: pool.toLowerCase() } };
  if (Object.keys(timestamp).length > 0)
    where.timestamp = timestamp;
  const data = await gqlRequest(FundingRateHistoryQuery, {
    where,
    orderBy: [{ timestamp: opts.order ?? "desc" }],
    limit: opts.limit ?? 100,
    offset: opts.offset ?? 0
  }, indexerUrl);
  return data.FundingRateUpdate;
}
async function listFundingRateCandles(pool, intervalSeconds, opts = {}, indexerUrl) {
  const bucketStart = {};
  if (opts.from != null)
    bucketStart._gte = opts.from.toString();
  if (opts.to != null)
    bucketStart._lt = opts.to.toString();
  const where = {
    pool: { _eq: pool.toLowerCase() },
    intervalSeconds: { _eq: intervalSeconds }
  };
  if (Object.keys(bucketStart).length > 0)
    where.bucketStart = bucketStart;
  const data = await gqlRequest(FundingRateCandlesQuery, { where, limit: opts.limit ?? 500, offset: opts.offset ?? 0 }, indexerUrl);
  return data.FundingRateCandle;
}
async function getFundingRateHistory(pool, opts = {}, indexerUrl) {
  return listFundingRateHistory(pool, opts, indexerUrl);
}
async function listPerpFees(opts = {}, indexerUrl) {
  const where = {};
  if (opts.account != null)
    where.account = { _eq: opts.account.toLowerCase() };
  if (opts.pool != null)
    where.pool = { _eq: opts.pool.toLowerCase() };
  if (opts.builder != null)
    where.builder = { _eq: opts.builder.toLowerCase() };
  if (opts.kind != null)
    where.kind = { _eq: opts.kind };
  const data = await gqlRequest(PerpFeesQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.PerpFeeRecord;
}
async function getOpenInterestHistory(pool, opts = {}, indexerUrl) {
  const data = await gqlRequest(OpenInterestHistoryQuery, { pool: pool.toLowerCase(), limit: opts.limit ?? 100, offset: opts.offset ?? 0 }, indexerUrl);
  return data.OpenInterestSnapshot;
}
var FundingPaymentsQuery = graphql(`
  query FundingPayments($where: FundingPayment_bool_exp!, $limit: Int, $offset: Int) {
         FundingPayment(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
           id account pool amount timestamp txHash
         }
       }
`);
var MarginEventsQuery = graphql(`
  query MarginEvents($account: String!, $limit: Int, $offset: Int) {
         MarginEvent(where: {account: {_eq: $account}}, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
           id account kind pool amount granter timestamp txHash
         }
       }
`);
var LiquidationsQuery = graphql(`
  query Liquidations($where: LiquidationEvent_bool_exp!, $limit: Int, $offset: Int) {
         LiquidationEvent(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
           id account pool kind size price counterparty penalty
           badDebt insuranceCovered deficit coverageDeclined collateralAmount equity
           positionsProcessed stageReached marginStatusBefore marginStatusAfter
           timestamp blockNumber txHash
         }
       }
`);
var FundingRateHistoryQuery = graphql(`
  query FundingRateHistory($where: FundingRateUpdate_bool_exp!, $orderBy: [FundingRateUpdate_order_by!], $limit: Int, $offset: Int) {
         FundingRateUpdate(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
           id pool fundingRate cumulativeFundingPerUnit indexPrice markPrice
           intervalsSettled intervalsAccrued fundingWindowSec fundingIntervalSec
           spanStart spanEnd anchorResynced timestamp blockNumber txHash
         }
       }
`);
var FundingRateCandlesQuery = graphql(`
  query FundingRateCandles($where: FundingRateCandle_bool_exp!, $limit: Int, $offset: Int) {
         FundingRateCandle(where: $where, order_by: {bucketStart: desc}, limit: $limit, offset: $offset) {
           id pool intervalSeconds bucketStart
           avgFundingRate8h minFundingRate8h maxFundingRate8h coverage
           cumulativeFundingStart cumulativeFundingEnd
           fundingWindowSec fundingIntervalSec paramsChangedInBucket
           indexPriceEnd openInterestEnd updateCount
         }
       }
`);
var PerpFeesQuery = graphql(`
  query PerpFees($where: PerpFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
         PerpFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
           id account pool amount isRebate kind insurancePortion tier fillNotional builder timestamp txHash
         }
       }
`);
var OpenInterestHistoryQuery = graphql(`
  query OpenInterestHistory($pool: String!, $limit: Int, $offset: Int) {
         OpenInterestSnapshot(where: {pool: {_eq: $pool}}, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
           id pool openInterest timestamp blockNumber
         }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/perp/state.js
function perpMarkForPnl(state) {
  if (state.markPriceOk && state.markPrice > 0n) {
    return { price: state.markPrice, fromIndex: false };
  }
  return { price: state.indexPrice, fromIndex: true };
}
var PERP_STATE_READS = [
  "tryGetMarkPrice",
  "getIndexPrice",
  "getCurrentFundingRate",
  "getCumulativeFundingPerUnit",
  "getProjectedCumulativeFundingPerUnit",
  "getOpenInterest",
  "getFundingParameters",
  "getLastFundingUpdateTimestampNs",
  "getEmaPremium",
  "oracle"
];
async function getPerpState(pool, client) {
  var _a, _b;
  const p = { address: pool, abi: perpPoolReadAbi };
  const pc = client;
  const blockNumber = await pc.getBlockNumber();
  const fanOut = () => Promise.all(PERP_STATE_READS.map((functionName) => pc.readContract({ ...p, functionName, blockNumber })));
  let results;
  if (typeof pc.multicall === "function" && ((_b = (_a = pc.chain) == null ? void 0 : _a.contracts) == null ? void 0 : _b.multicall3)) {
    try {
      results = await pc.multicall({
        contracts: PERP_STATE_READS.map((functionName) => ({ ...p, functionName })),
        // A revert inside the batch must surface as a thrown SDK error, exactly as it
        // does on the readContract path — never as a silent per-call failure result.
        allowFailure: false,
        blockNumber
      });
    } catch (e) {
      if (!(e instanceof ChainDoesNotSupportContract))
        throw e;
      results = await fanOut();
    }
  } else {
    results = await fanOut();
  }
  if (results.length !== PERP_STATE_READS.length) {
    throw new Error(`getPerpState(${pool}): expected ${PERP_STATE_READS.length} reads, got ${results.length}`);
  }
  const [
    [markPriceOk, markPrice],
    [indexPrice, indexUpdatedAt],
    fundingRate,
    cumulative,
    projected,
    openInterest,
    params,
    lastFundingNs,
    emaPremium,
    oracle
    // Unchecked: both paths return `unknown[]`, so this tuple is the only thing tying
    // the results back to PERP_STATE_READS. Keep the two in the same order.
    // `getFundingParameters` returns seven uint256 fields (readsAbi.ts); only the two
    // read below are named here.
  ] = results;
  const fundingWindowSec = Number(params.fundingCalculationWindowSec);
  const fundingIntervalSec = Number(params.fundingSettlementIntervalSec);
  const lastFundingUpdateAt = BigInt(lastFundingNs) / 1000000000n;
  return {
    markPrice,
    markPriceOk,
    indexPrice,
    indexUpdatedAt,
    fundingRate,
    cumulativeFundingPerUnit: cumulative,
    projectedCumulativeFundingPerUnit: projected,
    openInterest,
    fundingWindowSec,
    fundingIntervalSec,
    lastFundingUpdateAt,
    nextFundingAt: lastFundingUpdateAt + BigInt(fundingIntervalSec),
    emaPremium,
    oracle
  };
}
async function getPerpPosition(ref, client) {
  const r = await client.readContract({
    address: ref.marginBank,
    abi: marginBankReadAbi,
    functionName: "getPosition",
    args: [ref.account, ref.pool]
  });
  return {
    size: r.size,
    avgEntryPrice: r.avgEntryPrice,
    entryFundingIndex: r.entryFundingIndex,
    lastUpdatedTimestampNs: r.lastUpdatedTimestampNs
  };
}
var PerpPositionsQuery = graphql(`
  query PerpPositions($where: PerpPosition_bool_exp!, $limit: Int, $offset: Int) {
    PerpPosition(where: $where, order_by: { updatedAt: desc }, limit: $limit, offset: $offset) {
      id
      pool
      account
      size
      isLong
      entryPriceX18
      realizedPnl
      updatedAt
      updatedAtBlock
    }
  }
`);
async function listPerpPositions(account, opts = {}, indexerUrl) {
  const where = { account: { _eq: account.toLowerCase() } };
  if (opts.pool != null)
    where.pool = { _eq: opts.pool.toLowerCase() };
  if (opts.includeFlat !== true)
    where.size = { _gt: "0" };
  const data = await gqlRequest(PerpPositionsQuery, { where, limit: opts.limit ?? 100, offset: opts.offset ?? 0 }, indexerUrl);
  return data.PerpPosition.map((p) => ({
    id: p.id,
    pool: p.pool,
    account: p.account,
    // The entity splits magnitude from direction; the SDK's position sign convention
    // is a signed size, so fold `isLong` back in here rather than exporting both.
    size: p.isLong ? p.size : (-BigInt(p.size)).toString(),
    avgEntryPrice: p.entryPriceX18 ?? null,
    lastUpdateRealizedPnl: p.realizedPnl ?? null,
    updatedAt: p.updatedAt,
    updatedAtBlock: p.updatedAtBlock ?? null
  }));
}
async function pokeFunding(w, p) {
  return w.execute({
    address: p.pool,
    abi: perpPoolWriteAbi,
    functionName: "updateFunding",
    args: [],
    gas: p.gas ?? w.defaultGas
  });
}
async function poke(w, p) {
  return w.execute({
    address: p.market,
    abi: binaryMarketWriteAbi,
    functionName: "poke",
    args: [],
    gas: p.gas ?? w.defaultGas
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/funding.js
var FUNDING_PRECISION = 1000000000000000000n;
var EIGHT_HOURS_SEC = 28800;
var ONE_HOUR_SEC = 3600;
var ONE_YEAR_SEC = 31536e3;
function normalizeFundingRate(rate, fundingWindowSec, targetSec) {
  assertWindow(fundingWindowSec);
  return rate * BigInt(Math.trunc(targetSec)) / BigInt(Math.trunc(fundingWindowSec));
}
function fundingRate8h(rate, fundingWindowSec) {
  return normalizeFundingRate(rate, fundingWindowSec, EIGHT_HOURS_SEC);
}
function fundingRate1h(rate, fundingWindowSec) {
  return normalizeFundingRate(rate, fundingWindowSec, ONE_HOUR_SEC);
}
function fundingRatePerInterval(rate, fundingWindowSec, fundingIntervalSec) {
  return normalizeFundingRate(rate, fundingWindowSec, fundingIntervalSec);
}
function annualizedFundingRate(rate, fundingWindowSec) {
  assertWindow(fundingWindowSec);
  return Number(rate) / Number(FUNDING_PRECISION) * (ONE_YEAR_SEC / fundingWindowSec);
}
function intervalsPerWindow(fundingWindowSec, fundingIntervalSec) {
  assertWindow(fundingWindowSec);
  if (!Number.isFinite(fundingIntervalSec) || fundingIntervalSec <= 0) {
    throw new RangeError(`fundingIntervalSec must be positive, got ${fundingIntervalSec}`);
  }
  return Math.floor(fundingWindowSec / fundingIntervalSec);
}
function realizedFundingPerBase(cumulativeStart, cumulativeEnd) {
  return (cumulativeEnd - cumulativeStart) / FUNDING_PRECISION;
}
function isFundingStale(lastFundingUpdateAt, fundingIntervalSec, nowSec, staleAfterIntervals = 2) {
  return nowSec - lastFundingUpdateAt > BigInt(Math.trunc(fundingIntervalSec) * staleAfterIntervals);
}
function densifyFundingBuckets(candles, intervalSeconds, from, to) {
  if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) {
    throw new RangeError(`intervalSeconds must be positive, got ${intervalSeconds}`);
  }
  const size = BigInt(Math.trunc(intervalSeconds));
  const requested = BigInt(from) / size * size;
  const end = BigInt(to);
  const bySlot = /* @__PURE__ */ new Map();
  for (const c of candles)
    bySlot.set(c.bucketStart, c);
  const oldest = candles.reduce((min, c) => {
    const at = BigInt(c.bucketStart);
    return min === void 0 || at < min ? at : min;
  }, void 0);
  const start = oldest === void 0 || oldest < requested ? requested : oldest;
  const out = [];
  for (let slot = start; slot < end; slot += size) {
    const key = slot.toString();
    const hit = bySlot.get(key);
    out.push(hit ?? {
      bucketStart: key,
      intervalSeconds,
      avgFundingRate8h: "0",
      coverage: "0",
      // Marked so a consumer can style a filled slot differently without having to
      // infer it from `coverage === "0"` — which is ambiguous, since a REAL bucket can
      // also have zero coverage after a fully-forgiven window.
      filled: true
    });
  }
  return out;
}
function buildFundingRateSeries(rows, intervalSeconds, from, to, limit) {
  const buckets = densifyFundingBuckets(rows, intervalSeconds, from, to);
  const first = buckets[0];
  return {
    buckets,
    truncated: rows.length >= limit,
    firstBucketStart: first ? Number(first.bucketStart) : null
  };
}
function assertWindow(fundingWindowSec) {
  if (!Number.isFinite(fundingWindowSec) || fundingWindowSec <= 0) {
    throw new RangeError(`fundingWindowSec must be positive, got ${fundingWindowSec} — it is the rate's denominator and cannot be defaulted`);
  }
}

// node_modules/@somnia-chain/markets-sdk/dist/perp/margin.js
var MARGIN_STATUS = [
  "Healthy",
  "MarginCall",
  "PartialLiquidation",
  "CloseOut"
];
async function getMarginAccount(marginBank, account, client) {
  const m = { address: marginBank, abi: marginBankReadAbi };
  const pc = client;
  const [state, withdrawable, health, statusRaw] = await Promise.all([
    pc.readContract({ ...m, functionName: "getAccountState", args: [account] }),
    pc.readContract({ ...m, functionName: "getWithdrawableCollateral", args: [account] }),
    pc.readContract({ ...m, functionName: "getAccountHealth", args: [account] }),
    pc.readContract({ ...m, functionName: "getMarginStatus", args: [account] })
  ]);
  const s = state;
  const [equity, imReq, mmReq, cmReq] = health;
  return {
    unlockedCollateralBalance: s.unlockedCollateralBalance,
    lockedCollateral: s.lockedCollateral,
    activePerpPools: [...s.activePerpPools],
    equity,
    withdrawable,
    imReq,
    mmReq,
    cmReq,
    marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy"
  };
}
async function getAccountHealth(marginBank, account, client) {
  const m = { address: marginBank, abi: marginBankReadAbi };
  const [health, statusRaw] = await Promise.all([
    client.readContract({ ...m, functionName: "getAccountHealth", args: [account] }),
    client.readContract({ ...m, functionName: "getMarginStatus", args: [account] })
  ]);
  const [equity, imReq, mmReq, cmReq] = health;
  return { equity, imReq, mmReq, cmReq, marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy" };
}
async function getPerpRiskParams(pool, client) {
  const p = await client.readContract({
    address: pool,
    abi: perpPoolReadAbi,
    functionName: "getPerpPoolParameters"
  });
  return {
    initialMarginBps: p.initialMarginBps,
    maintenanceMarginBps: p.maintenanceMarginBps,
    closeOutMarginBps: p.closeOutMarginBps,
    maxOpenInterest: p.maxOpenInterest,
    maxPositionSize: p.maxPositionSize,
    takerFeeBpsTimes1k: p.takerFeeBpsTimes1k,
    makerFeeBpsTimes1k: p.makerFeeBpsTimes1k,
    insuranceFundShareBps: p.insuranceFundShareBps
  };
}
async function getPerpHealthSnapshot(pool, client) {
  const [ok, s] = await client.readContract({
    address: pool,
    abi: perpPoolReadAbi,
    functionName: "tryGetHealthSnapshot"
  });
  if (!ok)
    return { priceable: false };
  return {
    priceable: true,
    oneBase: s.oneBase,
    markPrice: s.markPrice,
    projectedCumulativeFunding: s.projectedCumulativeFunding,
    effectiveImfBps: s.effectiveIMFBps,
    maintenanceMarginBps: s.maintenanceMarginBps,
    closeOutMarginBps: s.closeOutMarginBps
  };
}
async function getEffectiveImfBps(pool, client) {
  return client.readContract({
    address: pool,
    abi: perpPoolReadAbi,
    functionName: "getEffectiveIMF"
  });
}
var BPS_DENOMINATOR2 = 10000n;
var BPS_TIMES_1K_DENOMINATOR = 10000000n;
function divCeil(a, b) {
  return a === 0n ? 0n : (a - 1n) / b + 1n;
}
function divFloor(a, b) {
  const q = a / b;
  return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q;
}
function divCeilSigned(a, b) {
  const q = a / b;
  return a % b !== 0n && a < 0n === b < 0n ? q + 1n : q;
}
function abs(v) {
  return v < 0n ? -v : v;
}
function perpLiquidationPrice(p) {
  if (p.size === 0n)
    return null;
  const long = p.size > 0n;
  const perUnit = long ? BPS_DENOMINATOR2 - p.maintenanceMarginBps : BPS_DENOMINATOR2 + p.maintenanceMarginBps;
  if (perUnit === 0n)
    return null;
  const delta = divFloor((p.equity - p.mmReq) * p.oneBase * BPS_DENOMINATOR2, abs(p.size) * perUnit);
  const liq = long ? p.markPrice - delta : p.markPrice + delta;
  return liq > 0n ? liq : 0n;
}
async function getLiquidationPrice(ref, client) {
  const blockNumber = await client.getBlockNumber();
  const bank = { address: ref.marginBank, abi: marginBankReadAbi, blockNumber };
  const [position, snapshot, health] = await Promise.all([
    client.readContract({ ...bank, functionName: "getPosition", args: [ref.account, ref.pool] }),
    client.readContract({
      address: ref.pool,
      abi: perpPoolReadAbi,
      functionName: "tryGetHealthSnapshot",
      blockNumber
    }),
    client.readContract({ ...bank, functionName: "getAccountHealth", args: [ref.account] })
  ]);
  if (position.size === 0n)
    return null;
  const [ok, snap] = snapshot;
  if (!ok)
    unreachable("a non-flat position's pool cannot be unpriceable once getAccountHealth has resolved");
  const [equity, , mmReq] = health;
  return perpLiquidationPrice({
    equity,
    mmReq,
    size: position.size,
    markPrice: snap.markPrice,
    maintenanceMarginBps: snap.maintenanceMarginBps,
    oneBase: snap.oneBase
  });
}
async function getPerpLeverage(ref, client) {
  const blockNumber = await client.getBlockNumber();
  const bank = { address: ref.marginBank, abi: marginBankReadAbi, blockNumber };
  const pool = { address: ref.pool, abi: perpPoolReadAbi, blockNumber };
  const [position, snapshot, health, state, accountCap, protocolCap, creditFloor, voucherCap, voucherAllowed] = await Promise.all([
    client.readContract({ ...bank, functionName: "getPosition", args: [ref.account, ref.pool] }),
    client.readContract({ ...pool, functionName: "tryGetHealthSnapshot" }),
    client.readContract({ ...bank, functionName: "getAccountHealth", args: [ref.account] }),
    client.readContract({ ...bank, functionName: "getAccountState", args: [ref.account] }),
    client.readContract({ ...bank, functionName: "getMaxLeverage", args: [ref.account, ref.pool] }),
    client.readContract({ ...bank, functionName: "getMaxLeverageLimit" }),
    // The credit-voucher confinement, read alongside the two caps rather than left to a
    // second call. `protocolMaxLeverageX` alone overstates what a voucher-holding
    // account may OPEN at, and a consumer binding a leverage slider to it would offer
    // sizes the placement reverts on — but the confinement is gated on
    // `additionalSize > 0`, so it does not bound the position measured here. Reported,
    // not applied; see `PerpLeverage.voucherLeverageCapX` for the composition.
    client.readContract({ ...bank, functionName: "getCreditFloor", args: [ref.account] }),
    client.readContract({ ...bank, functionName: "getVoucherLeverageCap" }),
    client.readContract({ ...bank, functionName: "isVoucherMarketAllowed", args: [ref.pool] })
  ]);
  const [ok, snap] = snapshot;
  if (!ok) {
    throw new InvalidInputError(`perp pool ${ref.pool} has no fresh mark price; leverage is not defined`);
  }
  const { oneBase, markPrice, effectiveIMFBps } = snap;
  const [equity] = health;
  const positionNotional = abs(position.size) * markPrice / oneBase;
  const target = ref.pool.toLowerCase();
  const others = state.activePerpPools.filter((p) => p.toLowerCase() !== target);
  const otherNotionals = await Promise.all(others.map(async (other) => {
    const [otherSnapshot, otherPosition] = await Promise.all([
      client.readContract({ address: other, abi: perpPoolReadAbi, functionName: "tryGetHealthSnapshot", blockNumber }),
      client.readContract({ ...bank, functionName: "getPosition", args: [ref.account, other] })
    ]);
    const [otherOk, otherSnap] = otherSnapshot;
    if (!otherOk)
      unreachable(`active pool ${other} unpriceable after getAccountHealth resolved at block ${blockNumber}`);
    return abs(otherPosition.size) * otherSnap.markPrice / otherSnap.oneBase;
  }));
  const accountNotional = otherNotionals.reduce((sum, n) => sum + n, positionNotional);
  if (effectiveIMFBps <= 0n)
    unreachable("a pool's effective IMF is >= initialMarginBps, which the pool keeps > 0");
  return {
    asOfBlock: blockNumber,
    size: position.size,
    markPrice,
    positionNotional,
    accountNotional,
    equity,
    positionLeverageBps: equity > 0n ? positionNotional * BPS_DENOMINATOR2 / equity : null,
    accountLeverageBps: equity > 0n ? accountNotional * BPS_DENOMINATOR2 / equity : null,
    marketMaxLeverageBps: BPS_DENOMINATOR2 * BPS_DENOMINATOR2 / effectiveIMFBps,
    accountMaxLeverageX: accountCap,
    protocolMaxLeverageX: protocolCap,
    creditFloor,
    voucherLeverageCapX: voucherCap,
    voucherMarketAllowed: voucherAllowed
  };
}
function perpPositionAnalytics(p) {
  const absSize = abs(p.size);
  const notional = absSize * p.markPrice / p.oneBase;
  const unrealizedPnl = p.size === 0n ? 0n : (p.markPrice - p.avgEntryPrice) * p.size / p.oneBase;
  const fundingDelta = p.projectedCumulativeFunding - p.entryFundingIndex;
  const accruedFunding = divCeilSigned(p.size * fundingDelta, FUNDING_PRECISION * p.oneBase);
  const equityContribution = unrealizedPnl - accruedFunding;
  const initialMarginRequirement = divCeil(notional * p.effectiveImfBps, BPS_DENOMINATOR2);
  return {
    size: p.size,
    notional,
    unrealizedPnl,
    accruedFunding,
    equityContribution,
    initialMarginRequirement,
    maintenanceMarginRequirement: divCeil(notional * p.maintenanceMarginBps, BPS_DENOMINATOR2),
    closeOutMarginRequirement: divCeil(notional * p.closeOutMarginBps, BPS_DENOMINATOR2),
    returnOnMarginBps: initialMarginRequirement === 0n ? null : divFloor(equityContribution * BPS_DENOMINATOR2, initialMarginRequirement)
  };
}
async function getPerpPositionAnalytics(ref, client) {
  const blockNumber = await client.getBlockNumber();
  const [position, snapshot] = await Promise.all([
    client.readContract({
      address: ref.marginBank,
      abi: marginBankReadAbi,
      functionName: "getPosition",
      args: [ref.account, ref.pool],
      blockNumber
    }),
    client.readContract({
      address: ref.pool,
      abi: perpPoolReadAbi,
      functionName: "tryGetHealthSnapshot",
      blockNumber
    })
  ]);
  const [ok, snap] = snapshot;
  if (!ok)
    return { priceable: false, asOfBlock: blockNumber, pool: ref.pool };
  return {
    priceable: true,
    asOfBlock: blockNumber,
    pool: ref.pool,
    avgEntryPrice: position.avgEntryPrice,
    markPrice: snap.markPrice,
    ...perpPositionAnalytics({
      size: position.size,
      avgEntryPrice: position.avgEntryPrice,
      entryFundingIndex: position.entryFundingIndex,
      markPrice: snap.markPrice,
      projectedCumulativeFunding: snap.projectedCumulativeFunding,
      oneBase: snap.oneBase,
      effectiveImfBps: snap.effectiveIMFBps,
      maintenanceMarginBps: snap.maintenanceMarginBps,
      closeOutMarginBps: snap.closeOutMarginBps
    })
  };
}
async function listPerpPositionAnalytics(p, client) {
  const blockNumber = await client.getBlockNumber();
  const state = await client.readContract({
    address: p.marginBank,
    abi: marginBankReadAbi,
    functionName: "getAccountState",
    args: [p.account],
    blockNumber
  });
  return Promise.all(state.activePerpPools.map(async (pool) => {
    const [position, snapshot] = await Promise.all([
      client.readContract({
        address: p.marginBank,
        abi: marginBankReadAbi,
        functionName: "getPosition",
        args: [p.account, pool],
        blockNumber
      }),
      client.readContract({
        address: pool,
        abi: perpPoolReadAbi,
        functionName: "tryGetHealthSnapshot",
        blockNumber
      })
    ]);
    const [ok, snap] = snapshot;
    if (!ok)
      return { priceable: false, asOfBlock: blockNumber, pool };
    return {
      priceable: true,
      asOfBlock: blockNumber,
      pool,
      avgEntryPrice: position.avgEntryPrice,
      markPrice: snap.markPrice,
      ...perpPositionAnalytics({
        size: position.size,
        avgEntryPrice: position.avgEntryPrice,
        entryFundingIndex: position.entryFundingIndex,
        markPrice: snap.markPrice,
        projectedCumulativeFunding: snap.projectedCumulativeFunding,
        oneBase: snap.oneBase,
        effectiveImfBps: snap.effectiveIMFBps,
        maintenanceMarginBps: snap.maintenanceMarginBps,
        closeOutMarginBps: snap.closeOutMarginBps
      })
    };
  }));
}
async function getPerpSideHolders(ref, opts, client) {
  const pageSize = opts.pageSize ?? 1e3;
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new InvalidInputError(`pageSize must be a positive integer, got ${pageSize}`);
  }
  const asOfBlock = opts.blockNumber ?? await client.getBlockNumber();
  const count = BigInt(pageSize);
  const holders = [];
  for (let start = 0n; ; start += count) {
    const page = await client.readContract({
      address: ref.marginBank,
      abi: marginBankReadAbi,
      functionName: "getSideHoldersPaginated",
      args: [ref.pool, ref.isLong, start, count],
      blockNumber: asOfBlock
    });
    holders.push(...page);
    if (page.length < pageSize)
      break;
  }
  return { holders, asOfBlock };
}
function nameMarginBankRevert(err) {
  if (!(err instanceof ContractRevertError) || err.errorName !== void 0 || !isHex(err.data)) {
    return err;
  }
  try {
    const decoded = decodeErrorResult({ abi: marginBankReadAbi, data: err.data });
    return new ContractRevertError({
      errorName: decoded.errorName,
      args: decoded.args ?? [],
      data: err.data,
      address: err.address,
      functionName: err.functionName
    }, { cause: err });
  } catch {
    return err;
  }
}
async function getBankruptcyPrice(ref, opts, client) {
  try {
    return await client.readContract({
      address: ref.marginBank,
      abi: marginBankReadAbi,
      functionName: "getBankruptcyPrice",
      args: [ref.account, ref.pool],
      blockNumber: opts.blockNumber
    });
  } catch (err) {
    throw nameMarginBankRevert(err);
  }
}
function depositCall(w, bank, p) {
  return {
    address: bank,
    abi: marginBankWriteAbi,
    functionName: "deposit",
    args: [p.amount],
    gas: p.gas ?? w.defaultGas
  };
}
function assertDepositAmount(p) {
  if (p.amount <= 0n)
    throw new InvalidInputError("amount must be > 0");
}
function withdrawCall(w, bank, p) {
  return {
    address: bank,
    abi: marginBankWriteAbi,
    functionName: "withdraw",
    args: [p.amount],
    gas: p.gas ?? w.defaultGas
  };
}
async function depositMargin(w, p) {
  assertDepositAmount(p);
  const gas = p.gas ?? w.defaultGas;
  const bank = await w.resolveMarginBank(p);
  const call = depositCall(w, bank, p);
  if (p.autoApprove !== false) {
    const collateral = await w.bankCollateral(bank, p.collateral);
    await w.approveIfNeeded(collateral, bank, p.amount, gas);
  }
  return w.execute(call);
}
async function withdrawMargin(w, p) {
  const bank = await w.resolveMarginBank(p);
  return w.execute(withdrawCall(w, bank, p));
}
async function buildDepositMargin(w, p) {
  assertDepositAmount(p);
  const bank = await w.resolveMarginBank(p);
  const deposit = toUnsigned(depositCall(w, bank, p), `Deposit ${p.amount} collateral into MarginBank ${bank}`);
  if (p.autoApprove === false)
    return { deposit };
  const collateral = await w.bankCollateral(bank, p.collateral);
  return {
    deposit,
    approval: approvalCall(collateral, bank, `Approve collateral ${collateral} for MarginBank ${bank}`)
  };
}
async function buildWithdrawMargin(w, p) {
  const bank = await w.resolveMarginBank(p);
  return toUnsigned(withdrawCall(w, bank, p), `Withdraw ${p.amount} collateral from MarginBank ${bank}`);
}
async function setPerpLeverage(w, p) {
  const bank = await w.resolveMarginBank(p);
  return w.execute({
    address: bank,
    abi: marginBankWriteAbi,
    functionName: "setMaxLeverage",
    args: [p.pool, p.leverageX],
    gas: p.gas ?? w.defaultGas
  });
}
function perpOrderMarginQuote(p) {
  const sameDirection = p.positionSize === 0n || p.isBid === p.positionSize > 0n;
  const increasingQuantity = sameDirection ? p.quantity : p.quantity <= p.effectiveReducingCapacity ? 0n : p.quantity - p.effectiveReducingCapacity;
  const reducingQuantity = p.quantity - increasingQuantity;
  const initialMarginPortion = divCeil(increasingQuantity * p.price * p.effectiveImfBps, p.oneBase * BPS_DENOMINATOR2);
  const adverseGap = p.isBid ? p.price > p.markPrice ? p.price - p.markPrice : 0n : p.markPrice > p.price ? p.markPrice - p.price : 0n;
  const adverseGapPortion = divCeil(increasingQuantity * adverseGap, p.oneBase);
  const lockAmount = initialMarginPortion + adverseGapPortion;
  const voucherActive = increasingQuantity > 0n && p.creditFloor > 0n;
  const voucherBlocked = voucherActive && (!p.voucherMarketAllowed || p.voucherLeverageCapX === 0);
  const effectiveLeverage = voucherActive && !voucherBlocked && (p.accountMaxLeverageX === 0 || p.accountMaxLeverageX > p.voucherLeverageCapX) ? p.voucherLeverageCapX : p.accountMaxLeverageX;
  const cap = p.protocolMaxLeverageX > 0 && effectiveLeverage > p.protocolMaxLeverageX ? p.protocolMaxLeverageX : effectiveLeverage;
  const leverageImBps = cap === 0 ? 0n : divCeil(BPS_DENOMINATOR2, BigInt(cap));
  const appliedImBps = leverageImBps > p.effectiveImfBps ? leverageImBps : p.effectiveImfBps;
  const existingNotional = abs(p.positionSize) * p.markPrice / p.oneBase;
  const additionalNotional = increasingQuantity * p.price / p.oneBase;
  const leverageSurcharge = appliedImBps > p.effectiveImfBps && increasingQuantity > 0n ? divCeil((existingNotional + additionalNotional) * (appliedImBps - p.effectiveImfBps), BPS_DENOMINATOR2) : 0n;
  const takerRate = p.takerFeeBpsTimes1k ?? 0n;
  const makerRate = p.makerFeeBpsTimes1k ?? 0n;
  const makerCharge = makerRate > 0n ? makerRate : 0n;
  const worstCaseRate = (takerRate > makerCharge ? takerRate : makerCharge) + (p.builderFeeBpsTimes1k ?? 0n);
  const feeHeadroom = divCeil(p.quantity * p.price / p.oneBase * worstCaseRate, BPS_TIMES_1K_DENOMINATOR);
  const restrictedBlocked = p.restricted === true && increasingQuantity > 0n;
  const isolationBlocked = p.isolationAllowsMarket === false;
  const required = lockAmount + feeHeadroom + leverageSurcharge;
  const topUpRequired = p.wallet == null || increasingQuantity === 0n || voucherBlocked || p.unlockedCollateral < 0n ? 0n : required > p.unlockedCollateral ? required - p.unlockedCollateral : 0n;
  const walletCoversTopUp = topUpRequired === 0n || p.wallet != null && p.wallet.balance >= topUpRequired && p.wallet.allowance >= topUpRequired;
  const hasCollateralForLock = lockAmount === 0n || p.unlockedCollateral + topUpRequired >= lockAmount;
  const meetsInitialMargin = increasingQuantity === 0n || p.equity + topUpRequired - lockAmount >= p.imRequirement + leverageSurcharge;
  return {
    increasingQuantity,
    reducingQuantity,
    lockAmount,
    initialMarginPortion,
    adverseGapPortion,
    leverageSurcharge,
    feeHeadroom,
    topUpRequired,
    walletCoversTopUp,
    hasCollateralForLock,
    meetsInitialMargin,
    voucherBlocked,
    restrictedBlocked,
    isolationBlocked,
    sufficient: hasCollateralForLock && meetsInitialMargin && walletCoversTopUp && !voucherBlocked && !restrictedBlocked && !isolationBlocked
  };
}
async function readPerpPlacementState(p, client, blockNumber) {
  const pool = { address: p.pool, abi: perpPoolReadAbi, blockNumber };
  const bank = { address: p.marginBank, abi: marginBankReadAbi, blockNumber };
  const [ok, snap] = await client.readContract({ ...pool, functionName: "tryGetHealthSnapshot" });
  if (!ok)
    return null;
  const [capacity, state, health, leverage, leverageLimit, creditFloor, voucherCap, voucherAllowed, restricted, isolationAllowed, params, systemConfig] = await Promise.all([
    client.readContract({ ...pool, functionName: "getReducingCapacity", args: [p.account] }),
    client.readContract({ ...bank, functionName: "getAccountState", args: [p.account] }),
    client.readContract({ ...bank, functionName: "getAccountHealth", args: [p.account] }),
    client.readContract({ ...bank, functionName: "getMaxLeverage", args: [p.account, p.pool] }),
    client.readContract({ ...bank, functionName: "getMaxLeverageLimit" }),
    client.readContract({ ...bank, functionName: "getCreditFloor", args: [p.account] }),
    client.readContract({ ...bank, functionName: "getVoucherLeverageCap" }),
    client.readContract({ ...bank, functionName: "isVoucherMarketAllowed", args: [p.pool] }),
    client.readContract({ ...pool, functionName: "isRestricted" }),
    client.readContract({ ...bank, functionName: "isolationAllowsMarket", args: [p.account, p.pool] }),
    // Both callers need this: the fee rates feed the auto-pull headroom, and the max-size
    // search also takes `maxPositionSize` off it.
    client.readContract({ ...pool, functionName: "getPerpPoolParameters" }),
    // Rides in this batch rather than a third round-trip, but is skipped entirely without
    // `autoPull` — its only job here is naming the collateral token below.
    p.autoPull === true ? client.readContract({ ...bank, functionName: "getSystemConfig" }) : void 0
  ]);
  let wallet = null;
  if (systemConfig !== void 0) {
    const token = { address: systemConfig.collateralToken, abi: erc20ReadAbi, blockNumber };
    const [balance, allowance] = await Promise.all([
      client.readContract({ ...token, functionName: "balanceOf", args: [p.account] }),
      // Approval to the BANK, not the pool: the pool reaches the wallet through
      // `MarginBank.depositFor`, so the bank is the `transferFrom` spender.
      client.readContract({ ...token, functionName: "allowance", args: [p.account, p.marginBank] })
    ]);
    wallet = { balance, allowance };
  }
  const [equity, imRequirement] = health;
  return {
    oneBase: snap.oneBase,
    markPrice: snap.markPrice,
    effectiveImfBps: snap.effectiveIMFBps,
    positionSize: capacity.positionSize,
    effectiveReducingCapacity: capacity.effectiveReducingCapacity,
    equity,
    imRequirement,
    unlockedCollateral: state.unlockedCollateralBalance,
    accountMaxLeverageX: leverage,
    protocolMaxLeverageX: leverageLimit,
    creditFloor,
    voucherLeverageCapX: voucherCap,
    voucherMarketAllowed: voucherAllowed,
    restricted,
    isolationAllowsMarket: isolationAllowed,
    takerFeeBpsTimes1k: params.takerFeeBpsTimes1k,
    makerFeeBpsTimes1k: params.makerFeeBpsTimes1k,
    wallet,
    params
  };
}
async function previewPerpOrderMargin(p, client) {
  const blockNumber = await client.getBlockNumber();
  const st = await readPerpPlacementState(p, client, blockNumber);
  if (st === null)
    return { priceable: false, asOfBlock: blockNumber };
  const { params: _params, ...quoteInputs } = st;
  return {
    priceable: true,
    asOfBlock: blockNumber,
    effectiveImfBps: st.effectiveImfBps,
    markPrice: st.markPrice,
    unlockedCollateral: st.unlockedCollateral,
    equity: st.equity,
    imRequirement: st.imRequirement,
    wallet: st.wallet,
    ...perpOrderMarginQuote({
      ...quoteInputs,
      wallet: st.wallet ?? void 0,
      isBid: p.isBid,
      quantity: p.quantity,
      price: p.price,
      builderFeeBpsTimes1k: p.builderFeeBpsTimes1k
    })
  };
}
async function meetsPerpImForFill(p, client) {
  return client.readContract({
    address: p.marginBank,
    abi: marginBankReadAbi,
    functionName: "meetsIMForFill",
    args: [p.account, p.pool, p.additionalSize, p.price]
  });
}
async function getMaxPerpOrderSize(p, client) {
  if (p.price <= 0n)
    throw new InvalidInputError("price must be > 0");
  const blockNumber = await client.getBlockNumber();
  const [st, book] = await Promise.all([
    readPerpPlacementState(p, client, blockNumber),
    client.readContract({
      address: p.pool,
      abi: perpPoolReadAbi,
      functionName: "getOrderBookParameters",
      blockNumber
    })
  ]);
  if (st === null)
    return { priceable: false, asOfBlock: blockNumber };
  const { params, wallet, ...quoteInputs } = st;
  const positionSize = st.positionSize;
  const absPosition = abs(positionSize);
  const base = {
    ...quoteInputs,
    wallet: wallet ?? void 0,
    isBid: p.isBid,
    price: p.price,
    builderFeeBpsTimes1k: p.builderFeeBpsTimes1k
  };
  const quoteAt = (q) => perpOrderMarginQuote({ ...base, quantity: q });
  const withinPositionCap = (q) => {
    const newAbs = abs(positionSize + (p.isBid ? q : -q));
    return newAbs <= params.maxPositionSize || newAbs <= absPosition;
  };
  const ceiling = params.maxPositionSize + absPosition + 1n;
  const needsNoPull = (q) => quoteAt(q).topUpRequired === 0n;
  let qStar = ceiling;
  if (!needsNoPull(ceiling)) {
    let plo = 0n;
    let phi = ceiling;
    while (phi - plo > 1n) {
      const mid = plo + (phi - plo) / 2n;
      if (needsNoPull(mid))
        plo = mid;
      else
        phi = mid;
    }
    qStar = plo;
  }
  const meetsImAtBoundary = quoteAt(qStar).meetsInitialMargin;
  const fits = (q) => q <= 0n || withinPositionCap(q) && (q <= qStar || meetsImAtBoundary) && quoteAt(q).sufficient;
  let lo = 0n;
  let hi = ceiling;
  while (hi - lo > 1n) {
    const mid = lo + (hi - lo) / 2n;
    if (fits(mid))
      lo = mid;
    else
      hi = mid;
  }
  const lotSize = book.lotSize > 0n ? book.lotSize : 1n;
  const maxQuantity = lo / lotSize * lotSize;
  const at = quoteAt(maxQuantity);
  const next = maxQuantity + lotSize;
  const nextQuote = quoteAt(next);
  const limitedBy = nextQuote.isolationBlocked ? "isolated" : nextQuote.restrictedBlocked ? "restricted" : nextQuote.voucherBlocked ? "voucherBlocked" : !withinPositionCap(next) ? "maxPositionSize" : !nextQuote.walletCoversTopUp ? (
    // Balance first: it is the more fundamental shortfall, and telling a trader
    // to approve more of a token they do not hold sends them to the wrong fix.
    nextQuote.topUpRequired > ((wallet == null ? void 0 : wallet.balance) ?? 0n) ? "walletBalance" : "walletAllowance"
  ) : !nextQuote.hasCollateralForLock ? "collateral" : "initialMargin";
  return {
    priceable: true,
    asOfBlock: blockNumber,
    maxQuantity,
    unalignedMaxQuantity: lo,
    increasingQuantity: at.increasingQuantity,
    reducingQuantity: at.reducingQuantity,
    lockAmount: at.lockAmount,
    topUpRequired: at.topUpRequired,
    wallet,
    placeable: maxQuantity >= book.minQuantity && maxQuantity > 0n,
    limitedBy,
    // The EFFECTIVE grid, not `book.lotSize` — reporting a raw `0n` here would disagree
    // with the alignment `maxQuantity` actually went through, and hand the caller a
    // divisor that throws.
    lotSize,
    minQuantity: book.minQuantity,
    maxPositionSize: params.maxPositionSize,
    positionSize,
    markPrice: st.markPrice,
    effectiveImfBps: st.effectiveImfBps
  };
}
async function quoteMeetsPerpImForOrder(p, client) {
  return client.readContract({
    address: p.marginBank,
    abi: marginBankReadAbi,
    functionName: "quoteMeetsIMForOrder",
    args: [p.account, p.pool, p.additionalSize, p.price]
  });
}
async function getPerpLeverageImSurcharge(marginBank, account, client) {
  return client.readContract({
    address: marginBank,
    abi: marginBankReadAbi,
    functionName: "getLeverageImSurcharge",
    args: [account]
  });
}
async function tryGetPerpLeverageImSurcharge(marginBank, account, client) {
  try {
    return await getPerpLeverageImSurcharge(marginBank, account, client);
  } catch {
    return null;
  }
}
async function getPerpMaxLeverage(ref, opts, client) {
  try {
    return await client.readContract({
      address: ref.marginBank,
      abi: marginBankReadAbi,
      functionName: "getMaxLeverage",
      args: [ref.account, ref.pool],
      blockNumber: opts.blockNumber
    });
  } catch (err) {
    throw nameMarginBankRevert(err);
  }
}
async function quotePerpOrderTopUp(p, client) {
  return client.readContract({
    address: p.marginBank,
    abi: marginBankReadAbi,
    functionName: "quoteOrderTopUp",
    args: [p.account, p.pool, p.lockAmount, p.feeHeadroom, p.increasingQuantity, p.price]
  });
}
async function previewPerpLiquidationPrice(p, client) {
  if (p.quantity <= 0n)
    throw new InvalidInputError("quantity must be > 0");
  if (p.price <= 0n)
    throw new InvalidInputError("price must be > 0");
  const blockNumber = await client.getBlockNumber();
  const pool = { address: p.pool, abi: perpPoolReadAbi, blockNumber };
  const bank = { address: p.marginBank, abi: marginBankReadAbi, blockNumber };
  const [ok, snap] = await client.readContract({ ...pool, functionName: "tryGetHealthSnapshot" });
  if (!ok)
    return { priceable: false, asOfBlock: blockNumber };
  const [position, health, params] = await Promise.all([
    client.readContract({ ...bank, functionName: "getPosition", args: [p.account, p.pool] }),
    client.readContract({ ...bank, functionName: "getAccountHealth", args: [p.account] }),
    client.readContract({ ...pool, functionName: "getPerpPoolParameters" })
  ]);
  const { oneBase, markPrice, maintenanceMarginBps } = snap;
  const [equity, , mmReq] = health;
  const size = position.size;
  const entry = position.avgEntryPrice;
  const absSize = abs(size);
  const delta = p.isBid ? p.quantity : -p.quantity;
  let projectedSize;
  let projectedEntryPrice;
  let realizedPnl = 0n;
  if (size === 0n) {
    projectedSize = delta;
    projectedEntryPrice = p.price;
  } else if (size > 0n === delta > 0n) {
    projectedSize = size + delta;
    projectedEntryPrice = (absSize * entry + p.quantity * p.price) / (absSize + p.quantity);
  } else {
    const sign = size > 0n ? 1n : -1n;
    const closed = p.quantity <= absSize ? p.quantity : absSize;
    realizedPnl = divFloor((p.price - entry) * sign * closed, oneBase);
    projectedSize = size + delta;
    if (p.quantity > absSize) {
      projectedEntryPrice = p.price;
    } else {
      projectedEntryPrice = projectedSize === 0n ? 0n : entry;
    }
  }
  const fillNotional = p.quantity * p.price / oneBase;
  const feeBpsTimes1k = p.asMaker === true ? params.makerFeeBpsTimes1k : params.takerFeeBpsTimes1k;
  const fee = feeBpsTimes1k >= 0n ? fillNotional * feeBpsTimes1k / BPS_TIMES_1K_DENOMINATOR : -(fillNotional * -feeBpsTimes1k / BPS_TIMES_1K_DENOMINATOR);
  const uPnlBefore = (markPrice - entry) * size / oneBase;
  const uPnlAfter = (markPrice - projectedEntryPrice) * projectedSize / oneBase;
  const projectedEquity = equity - uPnlBefore + uPnlAfter + realizedPnl - fee;
  const notionalBefore = absSize * markPrice / oneBase;
  const notionalAfter = abs(projectedSize) * markPrice / oneBase;
  const mmBefore = divCeil(notionalBefore * maintenanceMarginBps, BPS_DENOMINATOR2);
  const mmAfter = divCeil(notionalAfter * maintenanceMarginBps, BPS_DENOMINATOR2);
  const projectedMmReq = mmReq - mmBefore + mmAfter;
  return {
    priceable: true,
    asOfBlock: blockNumber,
    markPrice,
    currentSize: size,
    currentLiquidationPrice: perpLiquidationPrice({
      equity,
      mmReq,
      size,
      markPrice,
      maintenanceMarginBps,
      oneBase
    }),
    projectedSize,
    projectedEntryPrice,
    realizedPnl,
    fee,
    projectedEquity,
    projectedMmReq,
    projectedLiquidationPrice: perpLiquidationPrice({
      equity: projectedEquity,
      mmReq: projectedMmReq,
      size: projectedSize,
      markPrice,
      maintenanceMarginBps,
      oneBase
    }),
    projectedPositionLeverageBps: projectedEquity > 0n ? notionalAfter * BPS_DENOMINATOR2 / projectedEquity : null
  };
}
async function previewPerpClosePnl(p, client) {
  if (p.quantity != null && p.quantity < 0n)
    throw new InvalidInputError("quantity must be >= 0");
  if (p.price != null && p.price <= 0n)
    throw new InvalidInputError("price must be > 0");
  const blockNumber = await client.getBlockNumber();
  const pool = { address: p.pool, abi: perpPoolReadAbi, blockNumber };
  const [position, snapshot, book, params] = await Promise.all([
    client.readContract({
      address: p.marginBank,
      abi: marginBankReadAbi,
      functionName: "getPosition",
      args: [p.account, p.pool],
      blockNumber
    }),
    client.readContract({ ...pool, functionName: "tryGetHealthSnapshot" }),
    client.readContract({ ...pool, functionName: "getOrderBookParameters" }),
    client.readContract({ ...pool, functionName: "getPerpPoolParameters" })
  ]);
  const [ok, snap] = snapshot;
  if (!ok)
    return { priceable: false, asOfBlock: blockNumber };
  const { oneBase, markPrice } = snap;
  const fillPrice = p.price ?? markPrice;
  const size = position.size;
  const absSize = abs(size);
  const requested = p.quantity == null || p.quantity === 0n ? absSize : p.quantity;
  const clamped = requested > absSize ? absSize : requested;
  const lotSize = book.lotSize > 0n ? book.lotSize : 1n;
  const closedQuantity = clamped / lotSize * lotSize;
  const sizeSign = size > 0n ? 1n : -1n;
  const realizedPnl = closedQuantity === 0n || size === 0n ? 0n : divFloor((fillPrice - position.avgEntryPrice) * sizeSign * closedQuantity, oneBase);
  const fundingSettled = size === 0n ? 0n : divCeilSigned(size * (snap.projectedCumulativeFunding - position.entryFundingIndex), FUNDING_PRECISION * oneBase);
  const fillNotional = closedQuantity * fillPrice / oneBase;
  const feeBpsTimes1k = p.asMaker === true ? params.makerFeeBpsTimes1k : params.takerFeeBpsTimes1k;
  const fee = feeBpsTimes1k >= 0n ? fillNotional * feeBpsTimes1k / BPS_TIMES_1K_DENOMINATOR : -(fillNotional * -feeBpsTimes1k / BPS_TIMES_1K_DENOMINATOR);
  const remainingSize = size === 0n ? 0n : size - sizeSign * closedQuantity;
  return {
    priceable: true,
    asOfBlock: blockNumber,
    requestedQuantity: requested,
    closedQuantity,
    remainingSize,
    fullClose: size !== 0n && remainingSize === 0n,
    realizedPnl,
    fundingSettled,
    fee,
    netProceeds: realizedPnl - fundingSettled - fee,
    placeable: closedQuantity >= book.minQuantity && closedQuantity > 0n,
    fillPrice,
    markPrice,
    avgEntryPrice: position.avgEntryPrice,
    // The EFFECTIVE grid — see `getMaxPerpOrderSize`, same reason.
    lotSize,
    minQuantity: book.minQuantity
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/perp/system.js
async function getPerpSystemConfig(marginBank, client) {
  const c = await client.readContract({
    address: marginBank,
    abi: marginBankReadAbi,
    functionName: "getSystemConfig"
  });
  return {
    marginBank: c.marginBank,
    collateralToken: c.collateralToken,
    perpPoolFactory: c.perpPoolFactory,
    liquidationEngine: c.liquidationEngine,
    insuranceFund: c.insuranceFund,
    feeRecipient: c.feeRecipient,
    maxLeverageLimit: c.maxLeverageLimit,
    fullyWired: c.fullyWired
  };
}
async function getInsuranceFundState(fund, client) {
  const f = { address: fund, abi: insuranceFundReadAbi };
  const [maxTiers, totalBalance] = await Promise.all([
    client.readContract({ ...f, functionName: "getMaxTiers" }),
    client.readContract({ ...f, functionName: "getTotalTierBalances" })
  ]);
  const indices = Array.from({ length: Number(maxTiers) + 1 }, (_, i) => BigInt(i));
  const tiers = await Promise.all(indices.map(async (tier) => {
    const [balance, poolCount] = await Promise.all([
      client.readContract({ ...f, functionName: "getTierBalance", args: [tier] }),
      client.readContract({ ...f, functionName: "getPoolCountForTier", args: [tier] })
    ]);
    return { tier: Number(tier), balance, poolCount };
  }));
  return { address: fund, maxTiers, totalBalance, tiers };
}
async function getLiquidationEngineConfig(engine, client) {
  const e = { address: engine, abi: liquidationEngineReadAbi };
  const [marginBank, penaltyBps, minSpreadBps, maxSpreadBps, maxVolumePerBlock, bidderCount] = await Promise.all([
    client.readContract({ ...e, functionName: "getMarginBank" }),
    client.readContract({ ...e, functionName: "getLiquidationPenaltyBps" }),
    client.readContract({ ...e, functionName: "getMinLiquidationSpreadBps" }),
    client.readContract({ ...e, functionName: "getMaxLiquidationSpreadBps" }),
    client.readContract({ ...e, functionName: "getMaxLiquidationVolumePerBlock" }),
    client.readContract({ ...e, functionName: "getBidderCount" })
  ]);
  return { address: engine, marginBank, penaltyBps, minSpreadBps, maxSpreadBps, maxVolumePerBlock, bidderCount };
}
async function tryGetPerpAccountEquity(marginBank, account, client) {
  const [ok, equity] = await client.readContract({
    address: marginBank,
    abi: marginBankReadAbi,
    functionName: "tryGetAccountEquity",
    args: [account]
  });
  return ok ? equity : null;
}
async function getPerpCollateralBasis(marginBank, account, client) {
  return client.readContract({
    address: marginBank,
    abi: marginBankReadAbi,
    functionName: "getCollateralBasis",
    args: [account]
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/perp/stops.js
var PERP_STOP_DROP_REASON = [
  "None",
  "ReduceOnlyNoPosition",
  "ReduceOnlyWrongSide",
  "ReduceOnlyBelowMinQty",
  "PlacementFailed",
  // Appended by the registry; every earlier member keeps its index, so already-indexed
  // rows are unaffected. Separates a placement the pool ACCEPTED but that traded
  // nothing from one it rejected outright — the pool decides an IOC's fate on a dry
  // run, and the real run can fill less, including zero, when it pulls a maker the dry
  // run had counted. Previously reported as a success, which concealed it.
  "NoFill"
];
var PerpStopOrdersQuery = graphql(`
  query PerpStopOrders($where: StopOrder_bool_exp!, $limit: Int, $offset: Int) {
    StopOrder(where: $where, order_by: [{ createdAt: desc }, { id: desc }], limit: $limit, offset: $offset) {
      id
      registry
      orderIdRaw
      owner
      isBid
      quantity
      triggerPrice
      triggerOperator
      orderType
      builder
      builderFeeBpsTimes1k
      status
      placedOrderId
      dropReason
      createdAt
      updatedAt
      txHash
      market {
        poolAddress
        baseSymbol
        quoteSymbol
        baseDecimals
        quoteDecimals
      }
    }
  }
`);
async function listPerpStopOrders(opts = {}, indexerUrl) {
  const where = {
    // The StopOrder entity is shared with spot; without this a perp read would return
    // spot stops too, and their orderIdRaw addresses a different registry entirely.
    market: { marketType: { _eq: "PERP" } }
  };
  if (opts.pool != null) {
    where.market = { marketType: { _eq: "PERP" }, poolAddress: { _eq: opts.pool.toLowerCase() } };
  }
  if (opts.account != null)
    where.owner = { _eq: opts.account.toLowerCase() };
  const statuses = opts.status != null && opts.status.length > 0 ? opts.status : ["PENDING"];
  where.status = { _in: statuses };
  const data = await gqlRequest(PerpStopOrdersQuery, { where, limit: opts.limit ?? 200, offset: opts.offset ?? 0 }, indexerUrl);
  return narrowIndexerInvariant(data.StopOrder.map((o) => ({
    ...o,
    // The enum arrives as its on-chain index. Decoded here so a consumer branches on
    // a name rather than re-deriving the mapping — and null on success, where the
    // contract's `None` would otherwise read as a reason.
    dropReason: o.dropReason == null ? null : PERP_STOP_DROP_REASON[o.dropReason] ?? null
  })));
}
var PLACE_ORDER_FOR_SELECTOR = "0x80054449";
var INTENT_INDEX = { reduceOnly: 0, opening: 1 };
function decodeIntent(raw) {
  if (raw === INTENT_INDEX.reduceOnly)
    return "reduceOnly";
  if (raw === INTENT_INDEX.opening)
    return "opening";
  return null;
}
async function getPerpStopOrderSomiPayment(registry, client) {
  return client.readContract({
    address: registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "somiPaymentPerOrder"
  });
}
async function getPerpStopOrder(p, client) {
  const [live, stored] = await client.readContract({
    address: p.registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "getPendingOrder",
    args: [BigInt(p.orderId)]
  });
  if (!live)
    return null;
  const t = stored.orderWithTrigger;
  return {
    isBid: t.order.isBid,
    owner: t.order.owner,
    quantity: t.order.quantity,
    triggerPrice: t.triggerPrice,
    triggerOperator: t.triggerOperator,
    orderType: t.orderType,
    limitPrice: t.limitPrice,
    builder: t.builder,
    builderFeeBpsTimes1k: t.builderFeeBpsTimes1k,
    somiPaid: stored.somiPaid,
    siblingOrderId: stored.siblingOrderId,
    intent: decodeIntent(stored.intent)
  };
}
function toTriggerTuple(leg, owner) {
  return {
    order: { isBid: leg.isBid, owner, userData: 0n, quantity: leg.quantity },
    orderType: leg.stopOrderType,
    triggerPrice: leg.triggerPrice,
    triggerOperator: leg.triggerOperator,
    limitPrice: leg.limitPrice ?? 0n,
    builder: leg.builder ?? ZERO_ADDRESS,
    builderFeeBpsTimes1k: leg.builderFeeBpsTimes1k ?? 0n
  };
}
function validateLeg(leg, intent, label) {
  if (leg.triggerPrice <= 0n)
    throw new InvalidInputError(`${label}: triggerPrice must be > 0`);
  if (leg.quantity < 0n)
    throw new InvalidInputError(`${label}: quantity cannot be negative`);
  if (leg.quantity === 0n && intent === "opening") {
    throw new InvalidInputError(`${label}: an opening stop needs a non-zero quantity`);
  }
  if (leg.stopOrderType === 0 && (leg.limitPrice ?? 0n) <= 0n) {
    throw new InvalidInputError(`${label}: a LIMIT stop needs limitPrice > 0`);
  }
  if (leg.stopOrderType === 1 && (leg.limitPrice ?? 0n) !== 0n) {
    throw new InvalidInputError(`${label}: a MARKET stop must not set limitPrice`);
  }
  if (leg.builder == null && (leg.builderFeeBpsTimes1k ?? 0n) > 0n) {
    throw new InvalidInputError(`${label}: builderFeeBpsTimes1k needs a builder`);
  }
}
function singleLegCall(a) {
  const call = { address: a.registry, abi: perpStopRegistryWriteAbi, gas: a.gas, value: a.somi };
  if (a.intent === "reduceOnly") {
    return { ...call, functionName: "createPendingOrder", args: [a.leg] };
  }
  return { ...call, functionName: "createTriggerOrder", args: [a.leg, INTENT_INDEX.opening] };
}
function linkedPairCall(a) {
  const [gte, lte] = a.selfIsGte ? [a.self, a.other] : [a.other, a.self];
  return {
    address: a.registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "createLinkedPendingOrders",
    args: [gte, lte],
    gas: a.gas,
    value: a.somi * 2n
  };
}
function stopPlacementCall(w, p, a) {
  validateLeg(p, a.intent, "stop order");
  const self = toTriggerTuple(p, w.fromAddress);
  if (p.pair == null) {
    return singleLegCall({ registry: p.registry, leg: self, intent: a.intent, somi: a.somi, gas: a.gas });
  }
  if (a.intent === "opening") {
    throw new InvalidInputError("a linked pair must be reduce-only on both legs");
  }
  validateLeg(p.pair, "reduceOnly", "paired leg");
  if (p.triggerOperator === p.pair.triggerOperator) {
    throw new InvalidInputError("a linked pair needs opposite trigger operators (one GTE, one LTE)");
  }
  if (p.isBid !== p.pair.isBid) {
    throw new InvalidInputError("a linked pair must be the same side — both legs reduce one position");
  }
  return linkedPairCall({
    registry: p.registry,
    self,
    other: toTriggerTuple(p.pair, w.fromAddress),
    selfIsGte: p.triggerOperator === 0,
    somi: a.somi,
    gas: a.gas
  });
}
function operatorGrantCall(w, p, gas) {
  const operatorRegistry = p.operatorRegistry ?? w.addresses().operatorPermissionsRegistry;
  if (!operatorRegistry) {
    throw new NotConfiguredError("operatorRegistry or addresses.operatorPermissionsRegistry", "a perp stop order");
  }
  return {
    address: operatorRegistry,
    abi: operatorRegistryWriteAbi,
    functionName: "setOperatorApprovalGlobal",
    args: [p.registry, [PLACE_ORDER_FOR_SELECTOR], true],
    gas
  };
}
function decodePerpStopOrderIds(logs, registry) {
  const created = [];
  for (const log of logs) {
    if (log.address.toLowerCase() !== registry.toLowerCase())
      continue;
    try {
      const decoded = decodeEventLog({
        abi: perpStopRegistryEventsAbi,
        data: log.data,
        topics: log.topics
      });
      if (decoded.eventName === "PendingOrderCreated")
        created.push(decoded.args.orderId);
    } catch {
    }
  }
  return created;
}
async function placePerpStopOrder(w, p) {
  const intent = p.intent ?? "reduceOnly";
  const gas = p.gas ?? w.defaultGas;
  const somi = p.somiPayment ?? await getPerpStopOrderSomiPayment(p.registry, w.publicClient);
  const call = stopPlacementCall(w, p, { intent, somi, gas });
  if (p.skipOperatorApproval !== true) {
    const authorized = await w.publicClient.readContract({
      address: p.pool,
      abi: operatorAuthorizationReadAbi,
      functionName: "isOperatorAuthorized",
      args: [w.fromAddress, p.registry, PLACE_ORDER_FOR_SELECTOR]
    });
    if (!authorized)
      await w.execute(operatorGrantCall(w, p, gas));
  }
  const result2 = await w.execute(call);
  const created = decodePerpStopOrderIds(result2.receipt.logs, p.registry);
  if (p.pair == null)
    return { ...result2, stopOrderId: created[0] };
  const selfIsGte = p.triggerOperator === 0;
  const [gteId, lteId] = created;
  const mine = selfIsGte ? gteId : lteId;
  const theirs = selfIsGte ? lteId : gteId;
  return { ...result2, stopOrderId: mine, pairedStopOrderId: theirs };
}
async function linkPerpStopOrders(w, p) {
  return w.execute({
    address: p.registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "linkPendingOrders",
    args: [BigInt(p.orderIdA), BigInt(p.orderIdB)],
    gas: p.gas ?? w.defaultGas
  });
}
async function cancelPerpStopOrder(w, p) {
  return w.execute(cancelOneCall(w, p));
}
function cancelOneCall(w, p) {
  return {
    address: p.registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "cancelPendingOrder",
    args: [BigInt(p.orderId)],
    gas: p.gas ?? w.defaultGas
  };
}
async function cancelPerpStopOrders(w, p) {
  return w.execute(cancelManyCall(w, p));
}
function cancelManyCall(w, p) {
  if (p.orderIds.length === 0)
    throw new InvalidInputError("orderIds must not be empty");
  return {
    address: p.registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "cancelPendingOrders",
    args: [p.orderIds.map((id2) => BigInt(id2))],
    gas: p.gas ?? w.defaultGas
  };
}
async function buildPlacePerpStopOrder(w, p) {
  const intent = p.intent ?? "reduceOnly";
  const gas = p.gas ?? w.defaultGas;
  const somi = p.somiPayment ?? await getPerpStopOrderSomiPayment(p.registry, w.publicClient);
  const stopOrder = toUnsigned(stopPlacementCall(w, p, { intent, somi, gas }), `Place ${p.pair != null ? "a linked TP/SL pair" : `a ${intent === "opening" ? "opening" : "reduce-only"} stop`} on perp registry ${p.registry}`);
  if (p.skipOperatorApproval === true)
    return { stopOrder };
  return {
    stopOrder,
    operatorApproval: toUnsigned(operatorGrantCall(w, p, gas), `Approve perp stop registry ${p.registry} to place orders on pool ${p.pool}`)
  };
}
function buildCancelPerpStopOrder(w, p) {
  return toUnsigned(cancelOneCall(w, p), `Cancel perp stop order ${p.orderId} on registry ${p.registry}`);
}
function buildCancelPerpStopOrders(w, p) {
  return toUnsigned(cancelManyCall(w, p), `Cancel ${p.orderIds.length} perp stop orders on registry ${p.registry}`);
}
async function claimPerpStopSomi(w, p) {
  return w.execute({
    address: p.registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "claimSomi",
    args: [],
    gas: p.gas ?? w.defaultGas
  });
}
async function getUnclaimedPerpStopSomi(ref, client) {
  return client.readContract({
    address: ref.registry,
    abi: perpStopRegistryWriteAbi,
    functionName: "unclaimedSomi",
    args: [ref.account]
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/perp/registry.js
function isMissingContractView(err) {
  return isMissingView(err);
}
function isMissingView(err) {
  for (let e = err, depth = 0; e != null && depth < 8; e = e.cause, depth += 1) {
    if (e instanceof BaseError) {
      return Boolean(e.walk((x) => x instanceof ContractFunctionZeroDataError || x instanceof ContractFunctionRevertedError));
    }
  }
  return false;
}
var PERP_POOL_FACTORY_MARKET_STATUS_INTERFACE_ID = "0xa874fb70";
async function listPerpPoolStatuses(p, client) {
  const blockNumber = await client.getBlockNumber();
  const f = { address: p.factory, abi: perpPoolFactoryReadAbi, blockNumber };
  const hasStatusViews = await client.readContract({ ...f, functionName: "supportsInterface", args: [PERP_POOL_FACTORY_MARKET_STATUS_INTERFACE_ID] }).catch((err) => {
    if (isMissingView(err))
      return false;
    throw err;
  });
  const base = hasStatusViews ? (await client.readContract({ ...f, functionName: "getPerpPoolStatuses" })).map((s) => ({
    pool: s.perpPool,
    baseToken: s.baseToken,
    restricted: s.restricted
  })) : await legacyStatuses(p.factory, client, blockNumber);
  const settled = await Promise.allSettled(base.map(async (b) => {
    const marginBank = await client.readContract({
      address: b.pool,
      abi: perpPoolReadAbi,
      functionName: "marginBank",
      blockNumber
    });
    const registered = await client.readContract({
      address: marginBank,
      abi: marginBankReadAbi,
      functionName: "isPerpPoolRegistered",
      args: [b.pool],
      blockNumber
    }).catch((err) => {
      if (isMissingView(err))
        return null;
      throw err;
    });
    return {
      ...b,
      marginBank,
      registered,
      tradeable: registered === null ? null : !b.restricted && registered
    };
  }));
  return settled.map((s, i) => {
    if (s.status === "fulfilled")
      return s.value;
    const b = base[i] ?? unreachable("allSettled result without its input");
    return { ...b, marginBank: zeroAddress, registered: null, tradeable: null };
  });
}
async function legacyStatuses(factory, client, blockNumber) {
  const pools = await client.readContract({
    address: factory,
    abi: perpPoolFactoryReadAbi,
    functionName: "getPerpPools",
    blockNumber
  });
  return Promise.all(pools.map(async (pool) => {
    const [baseToken, restricted] = await Promise.all([
      client.readContract({
        address: factory,
        abi: perpPoolFactoryReadAbi,
        functionName: "getBaseTokenForPool",
        args: [pool],
        blockNumber
      }),
      client.readContract({
        address: pool,
        abi: perpPoolReadAbi,
        functionName: "isRestricted",
        blockNumber
      })
    ]);
    return { pool, baseToken, restricted };
  }));
}
async function listTradeablePerpPools(p, client) {
  const statuses = await listPerpPoolStatuses(p, client);
  const undetermined = statuses.filter((s) => s.tradeable === null);
  if (undetermined.length > 0) {
    throw new Error(`cannot determine tradeability for ${undetermined.length} of ${statuses.length} perp markets: their MarginBank predates isPerpPoolRegistered. Pools: ${undetermined.map((s) => s.pool).join(", ")}`);
  }
  return statuses.filter((s) => s.tradeable).map((s) => s.pool);
}
async function isPerpPoolRegistered(p, client) {
  return client.readContract({
    address: p.marginBank,
    abi: marginBankReadAbi,
    functionName: "isPerpPoolRegistered",
    args: [p.pool]
  });
}
async function readPerpMarketFromChain(p, client) {
  const pool = { address: p.status.pool, abi: perpPoolReadAbi };
  const token = { address: p.status.baseToken, abi: erc20ReadAbi };
  const [book, risk, baseDecimals, baseSymbol, stopRegistry] = await Promise.all([
    client.readContract({ ...pool, functionName: "getOrderBookParameters" }),
    client.readContract({ ...pool, functionName: "getPerpPoolParameters" }),
    client.readContract({ ...token, functionName: "decimals" }),
    // A token that exposes no symbol() is a valid ERC-20; the row's own contract for
    // that case is null, so answer it rather than failing the whole listing. Only a
    // MISSING view earns that null: a timeout or a dropped connection is an operational
    // failure and must stay one, or discovery reports success with incomplete data.
    client.readContract({ ...token, functionName: "symbol" }).then(String).catch((err) => {
      if (isMissingView(err))
        return null;
      throw err;
    }),
    // Feature-detected exactly as the status views are: a factory predating
    // IPerpPoolFactoryStopRegistry has no such selector, and that is a market with
    // no reachable TP/SL rather than a failed listing. An RPC outage still throws,
    // because isMissingView is deliberately narrow.
    client.readContract({
      address: p.factory,
      abi: perpPoolFactoryReadAbi,
      functionName: "getStopOrderRegistry",
      args: [p.status.pool]
    }).catch((err) => {
      if (isMissingView(err))
        return null;
      throw err;
    })
  ]);
  const id2 = lower0x(p.status.pool);
  return {
    id: id2,
    marketType: "PERP",
    poolAddress: id2,
    lastPrice: null,
    lastTradeAt: null,
    // Placeholders — see the gotcha above. Zero is UNKNOWN here.
    cumulativeBaseVolume: "0",
    cumulativeQuoteVolume: "0",
    tradeCount: "0",
    createdAtTimestamp: "0",
    createdAtBlock: "0",
    baseDecimals: Number(baseDecimals),
    quoteDecimals: p.collateralDecimals,
    baseToken: lower0x(p.status.baseToken),
    quoteToken: lower0x(p.collateralToken),
    baseSymbol,
    quoteSymbol: p.collateralSymbol,
    baseIsNative: false,
    tickSize: book.tickSize.toString(),
    lotSize: book.lotSize.toString(),
    minQuantity: book.minQuantity.toString(),
    marginBank: lower0x(p.status.marginBank),
    initialMarginBps: Number(risk.initialMarginBps),
    // Zero is the factory's "no registry recorded" sentinel; this field's contract for
    // that is null, so a consumer has one check rather than two.
    stopRegistry: stopRegistry && stopRegistry !== zeroAddress ? lower0x(stopRegistry) : null,
    markPrice: null,
    markPriceUpdatedAt: null,
    fundingRate: null,
    cumulativeFundingPerUnit: null,
    indexPrice: null,
    fundingUpdatedAt: null,
    fundingWindowSec: null,
    fundingIntervalSec: null,
    openInterest: null,
    openInterestUpdatedAt: null
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/perp/linkedWallet.js
var ZERO_ADDRESS2 = "0x0000000000000000000000000000000000000000";
async function getPerpLinkedWalletRegistry(marginBank, client) {
  const registry = await client.readContract({
    address: marginBank,
    abi: marginBankReadAbi,
    functionName: "getLinkedWalletRegistry"
  });
  return registry === ZERO_ADDRESS2 ? null : registry;
}
async function quotePerpFundingPayer(marginBank, account, client) {
  const registry = await getPerpLinkedWalletRegistry(marginBank, client);
  if (registry === null)
    return { funded: false, reason: "dormant" };
  const payer = await client.readContract({
    address: marginBank,
    abi: marginBankReadAbi,
    functionName: "quoteFundingPayer",
    args: [account]
  });
  if (payer !== ZERO_ADDRESS2)
    return { funded: true, payer };
  const main = await client.readContract({
    address: registry,
    abi: linkedWalletRegistryReadAbi,
    functionName: "mainOf",
    args: [account]
  });
  return { funded: false, reason: main === account ? "isMain" : "unlinked" };
}
async function getPerpMainFunding(marginBank, account, client) {
  const bank = { address: marginBank, abi: marginBankReadAbi };
  const [principal, payer] = await Promise.all([
    client.readContract({ ...bank, functionName: "getMainFundedPrincipal", args: [account] }),
    client.readContract({ ...bank, functionName: "getMainFundingPayer", args: [account] })
  ]);
  return { principal, payer, withdrawableFromPrincipal: 0n };
}
async function getPerpWalletPullCapacity(marginBank, wallet, client) {
  return client.readContract({
    address: marginBank,
    abi: marginBankReadAbi,
    functionName: "quoteWalletCapacity",
    args: [wallet]
  });
}
async function getPerpWalletLinkage(registry, wallet, client) {
  const linkage = await client.readContract({
    address: registry,
    abi: linkedWalletRegistryReadAbi,
    functionName: "linkageOf",
    args: [wallet]
  });
  const main = linkage.main;
  const linked = main !== ZERO_ADDRESS2;
  return {
    main,
    members: linkage.members,
    linkedAt: BigInt(linkage.linkedAt),
    maturesAt: BigInt(linkage.maturesAt),
    isChild: linked && main !== wallet,
    isMain: linked && main === wallet && linkage.members.length > 1
  };
}
async function listPerpLinkedChildren(registry, main, client) {
  return client.readContract({
    address: registry,
    abi: linkedWalletRegistryReadAbi,
    functionName: "childrenOf",
    args: [main]
  });
}
async function getPerpMaxLinkedChildren(registry, client) {
  return client.readContract({
    address: registry,
    abi: linkedWalletRegistryReadAbi,
    functionName: "maxChildren"
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/spot/portfolio.js
var SpotPortfolioMarketFields = graphql(`
  fragment SpotPortfolioMarketFields on Market {
    poolAddress
    baseSymbol
    quoteSymbol
    baseToken
    quoteToken
    baseDecimals
    quoteDecimals
    baseIsNative
    tickSize
    lotSize
    minQuantity
    lastPrice
    markPrice
    stopRegistry
  }
`);
async function getSpotPortfolio(account, opts = {}, indexerUrl) {
  const acct = account.toLowerCase();
  const fillWhere = {
    market: { marketType: { _eq: "SPOT" } },
    _or: [{ maker: { _eq: acct } }, { taker: { _eq: acct } }]
  };
  if (opts.since != null)
    fillWhere.timestamp = { _gte: opts.since };
  const tradesLimit = opts.tradesLimit ?? DEFAULT_TRADES_LIMIT;
  const data = await gqlRequest(SpotPortfolioQuery, { acct, fillWhere, ordersLimit: opts.ordersLimit ?? 200, tradesLimit }, indexerUrl);
  const trades = narrowIndexerInvariant(data.SpotFill.map((f) => {
    const asMaker = (f.maker ?? "").toLowerCase() === acct;
    const takerIsBid = f.takerIsBid ?? false;
    return {
      id: f.id,
      fillPrice: f.fillPrice,
      quantity: f.quantity,
      quoteQuantity: f.quoteQuantity,
      timestamp: f.timestamp,
      txHash: f.txHash,
      // The taker bought base iff takerIsBid; the maker took the opposite side.
      isBid: asMaker ? !takerIsBid : takerIsBid,
      asMaker,
      counterparty: asMaker ? f.taker ?? null : f.maker ?? null,
      market: f.market
    };
  }));
  return {
    account: acct,
    openOrders: narrowIndexerInvariant(data.SpotOrder),
    stopOrders: narrowIndexerInvariant(data.SpotStopOrder),
    trades,
    // Newest-first page: a FULL page means older fills were dropped, not that trading stopped.
    // `tradesLimit: 0` asks for no trades at all, so an empty list there is complete, not cut.
    tradesTruncated: tradesLimit > 0 && trades.length >= tradesLimit
  };
}
var SpotPortfolioQuery = graphql(`
  query SpotPortfolio(
    $acct: String!
    $fillWhere: Fill_bool_exp!
    $ordersLimit: Int
    $tradesLimit: Int
  ) {
    SpotOrder: Order(
      where: {
        owner: { _eq: $acct }
        status: { _eq: "Open" }
        market: { marketType: { _eq: "SPOT" } }
      }
      order_by: { placedAtTimestamp: desc }
      limit: $ordersLimit
    ) {
      id
      orderId
      isBid
      price
      quantityRemaining
      filledQuantity
      fullQuantity
      placedAtTimestamp
      placedTxHash
      market {
        ...SpotPortfolioMarketFields
      }
    }
    SpotStopOrder: StopOrder(
      where: { owner: { _eq: $acct }, status: { _eq: "PENDING" } }
      order_by: { createdAt: desc }
      limit: $ordersLimit
    ) {
      ...SpotStopOrderFields
      market {
        ...SpotPortfolioMarketFields
      }
    }
    SpotFill: Fill(where: $fillWhere, order_by: { timestamp: desc }, limit: $tradesLimit) {
      id
      fillPrice
      quantity
      quoteQuantity
      timestamp
      txHash
      maker
      taker
      takerIsBid
      market {
        ...SpotPortfolioMarketFields
      }
    }
  }
`);

// node_modules/@somnia-chain/markets-sdk/dist/spot/poolReads.js
async function getAutoPullRequirement(p, client) {
  const [inputToken, requiredAmount, delta] = await client.readContract({
    address: p.pool,
    abi: spotPoolStopReadAbi,
    functionName: "getAutoPullRequirement",
    args: [p.owner, p.isBid, p.price, p.quantity, p.builderFeeBpsTimes1k ?? 0n]
  });
  return { inputToken, requiredAmount, delta };
}
async function isOperatorAuthorized(p, client) {
  return client.readContract({
    address: p.pool,
    abi: operatorAuthorizationReadAbi,
    functionName: "isOperatorAuthorized",
    args: [p.owner, p.operator, p.selector]
  });
}
async function getOwnLockedBalance(p, client) {
  const [lockedBase, lockedQuote] = await client.readContract({
    address: p.pool,
    abi: spotPoolLockReadAbi,
    functionName: "getOwnLockedBalance",
    // Impersonate the owner: the view reads msg.sender, and an eth_call `from`
    // needs no signature.
    account: p.owner
  });
  return { lockedBase, lockedQuote };
}
async function getLockedTokenBreakdown(pool, client) {
  const [base, quote] = await client.readContract({
    address: pool,
    abi: spotPoolLockReadAbi,
    functionName: "getLockedTokenBreakdown"
  });
  return { base, quote };
}
async function convertToQuoteAtPriceCeil(p, client) {
  return client.readContract({
    address: p.pool,
    abi: spotPoolLockReadAbi,
    functionName: "convertToQuoteAtPriceCeil",
    args: [p.baseQuantity, p.price]
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/spot/operatorGrants.js
var PLACE_ORDER_FOR_SELECTOR2 = "0x80054449";
var CANCEL_ORDER_FOR_SELECTOR = "0xe37b444b";
function requireGrantInputs(operator, selectors) {
  if (!isAddress(operator, { strict: false })) {
    throw new InvalidInputError(`operator must be an address (got ${String(operator)})`);
  }
  if (operator.toLowerCase() === ZERO_ADDRESS) {
    throw new InvalidInputError("operator must not be the zero address");
  }
  if (selectors.length === 0) {
    throw new InvalidInputError("selectors must not be empty — pass at least one 4-byte selector to grant or revoke");
  }
  const malformed = selectors.find((s) => !/^0x[0-9a-fA-F]{8}$/.test(s));
  if (malformed !== void 0) {
    throw new InvalidInputError(`selector must be 4 bytes of hex (got ${String(malformed)})`);
  }
}
async function setOperatorApprovalGlobal(w, p) {
  requireGrantInputs(p.operator, p.selectors);
  const registry = w.resolveOperatorRegistry(p.operatorRegistry);
  return w.execute({
    address: registry,
    abi: operatorRegistryWriteAbi,
    functionName: "setOperatorApprovalGlobal",
    args: [p.operator, [...p.selectors], p.approved],
    gas: p.gas ?? w.defaultGas
  });
}
async function setOperatorApprovalForPool(w, p) {
  requireGrantInputs(p.operator, p.selectors);
  const registry = w.resolveOperatorRegistry(p.operatorRegistry);
  return w.execute({
    address: registry,
    abi: operatorRegistryWriteAbi,
    functionName: "setOperatorApprovalForPool",
    args: [p.pool, p.operator, [...p.selectors], p.approved],
    gas: p.gas ?? w.defaultGas
  });
}
function requireReadRegistry(registry) {
  if (!registry || registry.toLowerCase() === ZERO_ADDRESS) {
    throw new NotConfiguredError("addresses.operatorPermissionsRegistry", "an operator grant read");
  }
  return registry;
}
async function isGloballyApproved(p, client, registry) {
  return client.readContract({
    address: requireReadRegistry(registry),
    abi: operatorRegistryWriteAbi,
    functionName: "isGloballyApproved",
    args: [p.owner, p.operator, p.selector]
  });
}
async function isApprovedForPool(p, client, registry) {
  return client.readContract({
    address: requireReadRegistry(registry),
    abi: operatorRegistryWriteAbi,
    functionName: "isApprovedForPool",
    args: [p.pool, p.owner, p.operator, p.selector]
  });
}
async function getOperatorPermissionsRegistry(pool, client) {
  const registry = await client.readContract({
    address: pool,
    abi: spotPoolOperatorRegistryReadAbi,
    functionName: "getOperatorPermissionsRegistry"
  });
  return registry.toLowerCase() === ZERO_ADDRESS ? null : registry;
}

// node_modules/@somnia-chain/markets-sdk/dist/spot/stops.js
var SpotStopOrderFields = graphql(`
  fragment SpotStopOrderFields on StopOrder {
    id
    registry
    orderId: orderIdRaw
    isBid
    quantity
    triggerPrice
    triggerOperator
    orderType
    status
    placedOrderId
    createdAt
  }
`);
async function getSpotStopOrders(account, opts = {}, indexerUrl) {
  const where = {
    owner: { _eq: account.toLowerCase() },
    status: { _eq: opts.status ?? "PENDING" }
  };
  if (opts.pool != null)
    where.market = { poolAddress: { _eq: opts.pool.toLowerCase() } };
  const data = await gqlRequest(SpotStopOrdersQuery, { where, limit: opts.limit ?? 200 }, indexerUrl);
  return narrowIndexerInvariant(data.StopOrder);
}
var SpotStopOrdersQuery = graphql(`
  query SpotStopOrders($where: StopOrder_bool_exp!, $limit: Int) {
    StopOrder(where: $where, order_by: { createdAt: desc }, limit: $limit) {
      ...SpotStopOrderFields
      market {
        ...SpotPortfolioMarketFields
      }
    }
  }
`);
async function getStopOrderSomiPayment(registry, client) {
  return client.readContract({
    address: registry,
    abi: spotStopRegistryReadAbi,
    functionName: "somiPaymentPerOrder"
  });
}
async function placeSpotStopOrder(w, p) {
  if (p.quantity <= 0n || p.triggerPrice <= 0n) {
    throw new InvalidInputError("quantity and triggerPrice must be > 0");
  }
  if (p.stopOrderType === 0 && (p.limitPrice ?? 0n) <= 0n) {
    throw new InvalidInputError("a LIMIT stop order needs limitPrice > 0");
  }
  const gas = p.gas ?? w.defaultGas;
  const somi = p.somiPayment ?? await w.publicClient.readContract({
    address: p.registry,
    abi: spotStopRegistryWriteAbi,
    functionName: "somiPaymentPerOrder"
  });
  if (p.skipOperatorApproval !== true) {
    const authorized = await isOperatorAuthorized({ pool: p.pool, owner: w.fromAddress, operator: p.registry, selector: PLACE_ORDER_FOR_SELECTOR2 }, w.publicClient);
    if (!authorized) {
      w.resolveOperatorRegistry(p.operatorRegistry, "a stop order");
      await setOperatorApprovalGlobal(w, {
        operator: p.registry,
        selectors: [PLACE_ORDER_FOR_SELECTOR2],
        approved: true,
        operatorRegistry: p.operatorRegistry,
        gas
      });
    }
  }
  const price = p.stopOrderType === 0 ? p.limitPrice ?? 0n : p.triggerPrice;
  const { requiredAmount, delta } = await getAutoPullRequirement({ pool: p.pool, owner: w.fromAddress, isBid: p.isBid, price, quantity: p.quantity }, w.publicClient);
  let value = somi;
  const nativeSell = !p.isBid && p.baseIsNative === true;
  if (nativeSell) {
    value = somi + delta;
  } else if (p.autoApprove !== false) {
    const inputToken = p.isBid ? p.quoteToken : p.baseToken;
    await w.approveIfNeeded(inputToken, p.pool, requiredAmount, gas);
  }
  const result2 = await w.execute({
    address: p.registry,
    abi: spotStopRegistryWriteAbi,
    functionName: "createPendingOrder",
    args: [
      {
        order: { isBid: p.isBid, owner: w.fromAddress, userData: 0n, quantity: p.quantity },
        orderType: p.stopOrderType,
        triggerPrice: p.triggerPrice,
        triggerOperator: p.triggerOperator,
        limitPrice: p.limitPrice ?? 0n,
        builder: ZERO_ADDRESS,
        builderFeeBpsTimes1k: 0n
      }
    ],
    gas,
    value
  });
  let stopOrderId;
  for (const log of result2.receipt.logs) {
    if (log.address.toLowerCase() !== p.registry.toLowerCase())
      continue;
    try {
      const decoded = decodeEventLog({
        abi: spotStopRegistryEventsAbi,
        data: log.data,
        topics: log.topics
      });
      if (decoded.eventName === "PendingOrderCreated") {
        stopOrderId = decoded.args.orderId;
        break;
      }
    } catch {
    }
  }
  return { ...result2, stopOrderId };
}
async function cancelStopOrder(w, p) {
  return w.execute({
    address: p.registry,
    abi: spotStopRegistryWriteAbi,
    functionName: "cancelPendingOrder",
    args: [BigInt(p.orderId)],
    gas: p.gas ?? w.defaultGas
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/spot/vaultMode.js
async function setManualVaultMode(w, p) {
  return w.execute({
    address: p.pool,
    abi: spotVaultModeAbi,
    functionName: "setManualVaultMode",
    args: [p.enabled],
    gas: p.gas ?? w.defaultGas
  });
}
async function getManualVaultMode(p, client) {
  return client.readContract({
    address: p.pool,
    abi: spotVaultModeAbi,
    functionName: "getManualVaultMode",
    args: [p.user]
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/fees.js
var ProtocolFeeFields = graphql(`
  fragment ProtocolFeeFields on ProtocolFeeRecord {
    id
    orderId
    recipient
    payer
    token
    amount
    isTakerSide
    market: market_id
    pool
    timestamp
    txHash
  }
`);
var BuilderFeeFields = graphql(`
  fragment BuilderFeeFields on BuilderFeeRecord {
    id
    orderId
    builder
    payer
    token
    amount
    market: market_id
    pool
    timestamp
    txHash
  }
`);
var SettlementFeeFields = graphql(`
  fragment SettlementFeeFields on SettlementFeeRecord {
    id
    recipient: feeRecipient
    amount: fee
    winningBacking
    market: market_id
    timestamp
    txHash
  }
`);
async function listProtocolFees(opts = {}, indexerUrl) {
  const where = {};
  if (opts.recipient != null)
    where.recipient = { _eq: opts.recipient.toLowerCase() };
  if (opts.market != null)
    where.market_id = { _eq: opts.market.toLowerCase() };
  if (opts.pool != null)
    where.pool = { _eq: opts.pool.toLowerCase() };
  if (opts.payer != null)
    where.payer = { _eq: opts.payer.toLowerCase() };
  const data = await gqlRequest(ProtocolFeesQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.ProtocolFeeRecord;
}
async function listBuilderFees(opts = {}, indexerUrl) {
  const where = {};
  if (opts.builder != null)
    where.builder = { _eq: opts.builder.toLowerCase() };
  if (opts.market != null)
    where.market_id = { _eq: opts.market.toLowerCase() };
  if (opts.payer != null)
    where.payer = { _eq: opts.payer.toLowerCase() };
  const data = await gqlRequest(BuilderFeesQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.BuilderFeeRecord;
}
async function listSettlementFees(opts = {}, indexerUrl) {
  const where = {};
  if (opts.market != null)
    where.market_id = { _eq: opts.market.toLowerCase() };
  if (opts.recipient != null)
    where.feeRecipient = { _eq: opts.recipient.toLowerCase() };
  const data = await gqlRequest(SettlementFeesQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.SettlementFeeRecord;
}
async function listBuilderApprovals(opts = {}, indexerUrl) {
  const where = {};
  if (opts.user != null)
    where.user = { _eq: opts.user.toLowerCase() };
  if (opts.builder != null)
    where.builder = { _eq: opts.builder.toLowerCase() };
  const data = await gqlRequest(BuilderApprovalsQuery, { where, limit: opts.limit ?? 100, offset: opts.offset ?? 0 }, indexerUrl);
  return data.BuilderApproval.map(({ market_id, market, ...rest }) => ({
    ...rest,
    market: market_id,
    // Nullable relationship, non-null `market_id` — see getOrders.
    pool: (market == null ? void 0 : market.poolAddress) ?? ""
  }));
}
var BuilderApprovalsQuery = graphql(`
  query BuilderApprovals($where: BuilderApproval_bool_exp!, $limit: Int, $offset: Int) {
         BuilderApproval(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) {
           id market_id market { poolAddress } user builder maxFeeBpsTimes1k blockNumber timestamp txHash
         }
       }
`);
var ProtocolFeesQuery = graphql(`
  query ProtocolFees($where: ProtocolFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
         ProtocolFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...ProtocolFeeFields }
       }
`);
var BuilderFeesQuery = graphql(`
  query BuilderFees($where: BuilderFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
         BuilderFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...BuilderFeeFields }
       }
`);
var SettlementFeesQuery = graphql(`
  query SettlementFees($where: SettlementFeeRecord_bool_exp!, $limit: Int, $offset: Int) {
         SettlementFeeRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...SettlementFeeFields }
       }
`);
async function getMaxBuilderFeeBpsTimes1k(pool, client) {
  return client.readContract({
    address: pool,
    abi: binaryPoolReadAbi,
    functionName: "getMaxBuilderFeeBpsTimes1k"
  });
}
async function getBuilderApproval(ref, client) {
  return client.readContract({
    address: ref.pool,
    abi: binaryPoolReadAbi,
    functionName: "getBuilderApproval",
    args: [ref.user, ref.builder]
  });
}
async function getEffectiveBuilderApproval(ref, client) {
  return client.readContract({
    address: ref.pool,
    abi: binaryPoolReadAbi,
    functionName: "getEffectiveBuilderApproval",
    args: [ref.user, ref.builder]
  });
}
async function approveBuilder(w, p) {
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "approveBuilder",
    args: [p.builder, p.maxFeeBpsTimes1k],
    gas: p.gas ?? w.defaultGas
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/asyncCache.js
var AsyncCache = class {
  constructor() {
    __publicField(this, "map", /* @__PURE__ */ new Map());
  }
  /** The cached promise for `key`, or `create()` cached under it. */
  getOrCreate(key, create) {
    let p = this.map.get(key);
    if (!p) {
      p = create();
      this.map.set(key, p);
      p.catch(() => {
        if (this.map.get(key) === p)
          this.map.delete(key);
      });
    }
    return p;
  }
  /** Evict one key — the next getOrCreate re-runs `create` (e.g. on-chain retune). */
  delete(key) {
    this.map.delete(key);
  }
  /** Every cached promise — for teardown sweeps (stop each handle, then clear). */
  values() {
    return this.map.values();
  }
  clear() {
    this.map.clear();
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/orders.js
function toOrderMarket(m) {
  if (m == null)
    return null;
  const { marketAddress, asset, question, expiry, tradingStart, quoteDecimals, intervalSec } = m;
  return {
    marketAddress,
    asset,
    question,
    expiry,
    tradingStart,
    quoteDecimals,
    intervalSec,
    interval: marketIntervalLabel(m)
  };
}
async function getOpenOrders(owner, opts = {}, indexerUrl) {
  const where = orderWhere(owner, opts, "Open");
  const data = await gqlRequest(OpenOrdersQuery, { where, limit: opts.limit ?? 1e3, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Order.map((o) => {
    var _a;
    return {
      id: o.id,
      orderId: o.orderId,
      // `market_id` is the scalar owning column and is `String!` — selected
      // directly so the market identity needs no fallback. The `marketRow`
      // RELATIONSHIP beside it is what Hasura types nullable (it types all of them
      // so), which is why only the pool/labels below carry one.
      market: o.market,
      marketInfo: toOrderMarket(o.marketRow),
      pool: (((_a = o.marketRow) == null ? void 0 : _a.poolAddress) ?? "").toLowerCase(),
      side: o.side,
      isBid: o.isBid,
      price: o.price,
      quantityRemaining: o.quantityRemaining
    };
  });
}
async function getOrders(owner, opts = {}, indexerUrl) {
  const where = orderWhere(owner, opts);
  const data = await gqlRequest(OrdersQuery, { where, limit: opts.limit ?? 200, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Order.map((o) => {
    var _a;
    return {
      id: o.id,
      orderId: o.orderId,
      // `market_id` is the scalar owning column and is `String!` — selected
      // directly so the market identity needs no fallback. The `marketRow`
      // RELATIONSHIP beside it is what Hasura types nullable (it types all of them
      // so), which is why only the pool/labels below carry one.
      market: o.market,
      marketInfo: toOrderMarket(o.marketRow),
      pool: (((_a = o.marketRow) == null ? void 0 : _a.poolAddress) ?? "").toLowerCase(),
      side: o.side,
      isBid: o.isBid,
      price: o.price,
      quantityRemaining: o.quantityRemaining,
      status: o.status,
      fullQuantity: o.fullQuantity,
      filledQuantity: o.filledQuantity,
      rested: o.rested,
      expireTimestampNs: o.expireTimestampNs,
      placedTxHash: o.placedTxHash,
      placedAtTimestamp: o.placedAtTimestamp,
      cancelReason: o.cancelReason,
      amendedFromOrderId: o.amendedFromOrderId,
      amendedToOrderId: o.amendedToOrderId
    };
  });
}
async function getOrder(pool, orderId, indexerUrl) {
  const data = await gqlRequest(OrderDetailQuery, { id: `${pool.toLowerCase()}_${orderId.toString()}` }, indexerUrl);
  const o = data.Order[0];
  if (!o)
    return null;
  const { marketRef, marketRow, ...rest } = o;
  return {
    ...rest,
    // `marketInfo` and the bytes32 `market` id come from main's OrderRow
    // contract, mapped through main's own helper so there is one definition of
    // the shape rather than a second one here.
    marketInfo: toOrderMarket(marketRow),
    pool: ((marketRow == null ? void 0 : marketRow.poolAddress) ?? "").toLowerCase(),
    owner: rest.owner.toLowerCase(),
    marketRef: narrowIndexerInvariant([marketRef])[0]
  };
}
async function countOrders(owner, opts = {}, indexerUrl, headers) {
  return aggregateCount("Order", "Order_bool_exp", orderWhere(owner, opts), indexerUrl, headers);
}
async function getBookTops(marketIds, indexerUrl) {
  const out = {};
  const ids = marketIds.map((m) => m.toLowerCase());
  if (ids.length === 0)
    return out;
  const nowNs = (BigInt(Math.floor(Date.now() / 1e3)) * 1000000000n).toString();
  const sideWhere = (isBid) => ({
    market_id: { _in: ids },
    status: { _eq: "Open" },
    rested: { _eq: true },
    quantityRemaining: { _gt: "0" },
    expireTimestampNs: { _gt: nowNs },
    isBid: { _eq: isBid }
  });
  const data = await gqlRequest(BookTopsQuery, { bidWhere: sideWhere(true), askWhere: sideWhere(false) }, indexerUrl);
  for (const b of data.bids)
    out[b.market.toLowerCase()] = { bestBid: b.price, bestAsk: null, mid: null };
  for (const a of data.asks) {
    const key = a.market.toLowerCase();
    const row = out[key] ?? (out[key] = { bestBid: null, bestAsk: null, mid: null });
    row.bestAsk = a.price;
  }
  for (const row of Object.values(out)) {
    if (row.bestBid != null && row.bestAsk != null) {
      row.mid = ((BigInt(row.bestBid) + BigInt(row.bestAsk)) / 2n).toString();
    }
  }
  return out;
}
function toBinaryBook(yesBids, yesAsks, oneBase) {
  const noBids = yesAsks.map((l) => ({ price: oneBase - l.price, quantity: l.quantity })).sort((a, b) => a.price > b.price ? -1 : 1);
  const noAsks = yesBids.map((l) => ({ price: oneBase - l.price, quantity: l.quantity })).sort((a, b) => a.price > b.price ? 1 : -1);
  return { yesBids, yesAsks, noBids, noAsks };
}
async function getBinaryBookParams(pool, client) {
  const p = await client.readContract({
    address: pool,
    abi: binaryPoolReadAbi,
    functionName: "getOrderBookParameters"
  });
  return { tickSize: p.tickSize, minQuantity: p.minQuantity, lotSize: p.lotSize };
}
var CLOSE_STATES = ["OPEN", "CAPTURED", "CAPTURED_DEGENERATE", "TERMINAL_LATCH"];
async function getClosingPrice(pool, client) {
  try {
    const [closingMid, oneCollateral, state] = await client.readContract({
      address: pool,
      abi: binaryPoolReadAbi,
      functionName: "closingPrice"
    });
    return { closingMid, oneCollateral, state: CLOSE_STATES[state] ?? "OPEN" };
  } catch {
    return null;
  }
}
var INCORRECT_ORDER_SELECTOR = toFunctionSelector("IncorrectOrder()");
function toOnchainOrder(o) {
  return {
    orderId: o.orderId,
    isBid: o.isBid,
    owner: o.owner,
    userData: o.userData,
    price: o.price,
    fullQuantity: o.fullQuantity,
    quantityRemaining: o.quantityRemaining,
    expireTimestampNs: o.expireTimestampNs
  };
}
async function getOrderOnchain(pool, orderId, client) {
  var _a;
  try {
    const o = await client.readContract({
      address: pool,
      abi: binaryPoolReadAbi,
      functionName: "getOrder",
      args: [orderId]
    });
    return toOnchainOrder(o);
  } catch (err) {
    if (err instanceof ContractRevertError && ((_a = err.data) == null ? void 0 : _a.startsWith(INCORRECT_ORDER_SELECTOR)))
      return null;
    throw err;
  }
}
async function getOwnOpenOrdersOnchain(pool, owner, client) {
  const ids = await client.readContract({
    address: pool,
    abi: binaryPoolReadAbi,
    functionName: "getOwnOpenOrders",
    // Impersonate the owner: the view reads msg.sender, and an eth_call `from`
    // needs no signature.
    account: owner
  });
  return [...ids];
}
async function getAllOpenOrdersOnchain(pool, opts, client) {
  const [orders, hasMoreOrders, nextCursor] = await client.readContract({
    address: pool,
    abi: binaryPoolReadAbi,
    functionName: "getAllOpenOrdersOffChain",
    args: [opts.isBid, BigInt(opts.maxCount ?? 100), opts.cursor ?? 0n]
    // Deliberately NO `account`: the contract requires msg.sender == address(0).
  });
  return { orders: orders.map(toOnchainOrder), hasMore: hasMoreOrders, nextCursor };
}
async function getBinaryOrderBook(pool, opts, client) {
  const oneBase = 10n ** BigInt((opts == null ? void 0 : opts.decimals) ?? DECIMALS);
  const { bids, asks } = await readBookLevels(pool, (opts == null ? void 0 : opts.depth) ?? 10, client);
  return toBinaryBook(bids, asks, oneBase);
}
async function getSpotOrderBook(pool, opts, client) {
  return readBookLevels(pool, (opts == null ? void 0 : opts.depth) ?? 12, client);
}
async function getHeadBlock(client) {
  return Number(await client.getBlockNumber());
}
async function listSweepableOrders(opts = {}, indexerUrl) {
  const nowSec = opts.asOfSec ?? Math.floor(Date.now() / 1e3);
  const cutoffNs = BigInt(nowSec) * 1000000000n;
  const where = {
    status: { _eq: "Open" },
    expireTimestampNs: { _lt: cutoffNs.toString() }
  };
  if (opts.owner != null)
    where.owner = { _eq: opts.owner.toLowerCase() };
  const market = {};
  if (opts.pool != null)
    market.poolAddress = { _eq: opts.pool.toLowerCase() };
  if (opts.marketType != null)
    market.marketType = { _eq: opts.marketType };
  if (Object.keys(market).length > 0)
    where.market = market;
  const data = await gqlRequest(SweepableOrdersQuery, { where, limit: opts.limit ?? 200, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Order.map((o) => {
    var _a, _b;
    return {
      id: o.id,
      orderId: o.orderId,
      market: o.market,
      marketInfo: toOrderMarket(o.marketRow),
      pool: (((_a = o.marketRow) == null ? void 0 : _a.poolAddress) ?? "").toLowerCase(),
      marketType: ((_b = o.marketRow) == null ? void 0 : _b.marketType) ?? "SPOT",
      owner: o.owner,
      isBid: o.isBid,
      price: o.price,
      quantityRemaining: o.quantityRemaining,
      expireTimestampNs: o.expireTimestampNs,
      placedAtTimestamp: o.placedAtTimestamp
    };
  });
}
function orderWhere(owner, opts, forceStatus) {
  const where = { owner: { _eq: owner.toLowerCase() } };
  const status = forceStatus ?? opts.status;
  if (status != null)
    where.status = { _eq: status };
  if (opts.side != null)
    where.side = { _eq: opts.side };
  if (opts.pool != null)
    where.market = { poolAddress: { _eq: opts.pool.toLowerCase() } };
  return where;
}
var OrderMarketFields = graphql(`
  fragment OrderMarketFields on Market {
    marketAddress
    asset
    question
    expiry
    tradingStart
    quoteDecimals
    intervalSec
  }
`);
var SweepableOrdersQuery = graphql(`
  query SweepableOrders($where: Order_bool_exp!, $limit: Int, $offset: Int) {
        Order(where: $where, order_by: [{expireTimestampNs: asc}, {id: asc}], limit: $limit, offset: $offset) {
          id orderId owner isBid price quantityRemaining expireTimestampNs placedAtTimestamp
          market: market_id
          marketRow: market { poolAddress marketType ...OrderMarketFields }
        }
      }
`);
var OpenOrdersQuery = graphql(`
  query OpenOrders($where: Order_bool_exp!, $limit: Int, $offset: Int) {
        Order(where: $where, order_by: {placedAtTimestamp: desc}, limit: $limit, offset: $offset) {
          id orderId side isBid price quantityRemaining
          market: market_id
          marketRow: market { poolAddress ...OrderMarketFields }
        }
      }
`);
var OrdersQuery = graphql(`
  query Orders($where: Order_bool_exp!, $limit: Int, $offset: Int) {
        Order(where: $where, order_by: {placedAtTimestamp: desc}, limit: $limit, offset: $offset) {
          id orderId side isBid price quantityRemaining fullQuantity filledQuantity status
          rested expireTimestampNs placedTxHash placedAtTimestamp
          cancelReason amendedFromOrderId amendedToOrderId
          market: market_id
          marketRow: market { poolAddress ...OrderMarketFields }
        }
      }
`);
var OrderDetailQuery = graphql(`
  query OrderDetail($id: String!) {
        Order(where: { id: { _eq: $id } }, limit: 1) {
          id orderId owner userData side isBid price quantityRemaining fullQuantity filledQuantity
          status rested expireTimestampNs placedTxHash placedAtTimestamp placedAtBlock
          lastUpdatedAtTimestamp cancelReason amendedFromOrderId amendedToOrderId
          market: market_id
          marketRow: market { poolAddress ...OrderMarketFields }
          marketRef: market { ...MarketRefFields }
        }
      }
`);
var BookTopsQuery = graphql(`
  query BookTops($bidWhere: Order_bool_exp!, $askWhere: Order_bool_exp!) {
         bids: Order(where: $bidWhere, distinct_on: market_id, order_by: [{market_id: desc}, {price: desc}]) {
           market: market_id price
         }
         asks: Order(where: $askWhere, distinct_on: market_id, order_by: [{market_id: asc}, {price: asc}]) {
           market: market_id price
         }
       }
`);
async function readBookLevels(pool, depth, client) {
  const numLevels = BigInt(depth);
  const [rawBids, rawAsks] = await Promise.all([
    client.readContract({ address: pool, abi: binaryPoolReadAbi, functionName: "getBookLevels", args: [true, numLevels] }),
    client.readContract({ address: pool, abi: binaryPoolReadAbi, functionName: "getBookLevels", args: [false, numLevels] })
  ]);
  return { bids: [...rawBids], asks: [...rawAsks] };
}
async function binaryOrderCall(w, p) {
  if (p.price <= 0n || p.quantity <= 0n) {
    throw new InvalidInputError("price and quantity must be > 0");
  }
  const kind = ORDER_KIND[p.side];
  const orderType = p.orderType ?? 0;
  const expiry = p.expireTimestampNs ?? await w.marketExpiryNs(p.pool);
  const userData = p.userData ?? 0n;
  return {
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "placeBinaryOrder",
    args: [
      kind,
      p.price,
      p.quantity,
      expiry,
      orderType,
      p.selfMatchingOption ?? 0,
      p.builder ?? ZERO_ADDRESS,
      p.builderFeeBpsTimes1k ?? 0n,
      userData
    ],
    gas: p.gas ?? w.defaultGas
  };
}
async function placeOrder(w, p) {
  const call = await binaryOrderCall(w, p);
  if (p.autoApprove !== false) {
    const gas = p.gas ?? w.defaultGas;
    const e = w.escrow(p, await w.tokens(p));
    if (e.kind === "erc20")
      await w.approveIfNeeded(e.token, p.pool, e.amount, gas);
    else
      await w.ensureOperator(e.outcomeToken, p.pool, gas);
  }
  return w.executeOrder(call);
}
async function cancelOrder(w, p) {
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "cancelOrder",
    args: [BigInt(p.orderId)],
    gas: p.gas ?? w.defaultGas
  });
}
async function reduceOrder(w, p) {
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "reduceOrder",
    args: [BigInt(p.orderId), p.newQuantityRemaining],
    gas: p.gas ?? w.defaultGas
  });
}
async function cancelExpiredOrders(w, p) {
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "cancelExpiredOrders",
    args: [p.orderIds.map((id2) => BigInt(id2))],
    gas: p.gas ?? w.defaultGas
  });
}
async function sweepExpiredAtLevel(w, p) {
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "sweepExpiredAtLevel",
    args: [p.isBid, p.price, p.maxCount],
    gas: p.gas ?? w.defaultGas
  });
}
async function captureClose(w, p) {
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "captureClose",
    args: [p.maxSteps ?? 0n],
    gas: p.gas ?? w.defaultGas
  });
}
function spotEscrow(p) {
  const oneBase = 10n ** BigInt(p.baseDecimals);
  if (p.isBid)
    return { token: p.quoteToken, amount: (p.price * p.quantity + oneBase - 1n) / oneBase };
  if (p.baseIsNative)
    return { native: p.quantity };
  return { token: p.baseToken, amount: p.quantity };
}
function spotOrderCall(w, p) {
  if (p.price <= 0n || p.quantity <= 0n) {
    throw new InvalidInputError("price and quantity must be > 0");
  }
  const e = spotEscrow(p);
  return {
    address: p.pool,
    abi: spotPoolWriteAbi,
    functionName: "placeOrder",
    args: [
      p.isBid,
      p.userData ?? 0n,
      p.price,
      p.quantity,
      p.expireTimestampNs ?? farFutureNs(),
      p.orderType ?? 0,
      p.selfMatchingOption ?? 0,
      p.builder ?? ZERO_ADDRESS,
      p.builderFeeBpsTimes1k ?? 0n
    ],
    gas: p.gas ?? w.defaultGas,
    value: "native" in e ? e.native : 0n
  };
}
async function placeSpotOrder(w, p) {
  const e = spotEscrow(p);
  if (p.autoApprove !== false && "token" in e) {
    await w.approveIfNeeded(e.token, p.pool, e.amount, p.gas ?? w.defaultGas);
  }
  return w.executeOrder(spotOrderCall(w, p));
}
function batchOrderEvents(receipt, pool) {
  const placed = [];
  const terminated = /* @__PURE__ */ new Set();
  const fills = [];
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== pool.toLowerCase())
      continue;
    let decoded;
    try {
      decoded = decodeEventLog({ abi: orderBookEventsAbi, data: log.data, topics: log.topics });
    } catch {
      continue;
    }
    if (decoded.eventName === "OrderPlaced") {
      const o = decoded.args.placedOrder;
      placed.push({
        orderId: o.orderId,
        isBid: o.isBid,
        price: o.price,
        quantity: o.fullQuantity,
        userData: o.userData,
        expireTimestampNs: o.expireTimestampNs
      });
    } else if (decoded.eventName === "OrderCancelled" || decoded.eventName === "OrderExpired") {
      terminated.add(decoded.args.orderId);
    } else if (decoded.eventName === "OrderFilled") {
      fills.push({
        takerOrderId: decoded.args.takerOrderId,
        makerOrderId: decoded.args.makerOrderId,
        quantityFilled: decoded.args.quantityFilled,
        takerRemainingQuantity: decoded.args.takerRemainingQuantity,
        makerRemainingQuantity: decoded.args.makerRemainingQuantity,
        fillPrice: decoded.args.fillPrice
      });
    }
  }
  return { placed, terminated, fills };
}
async function placeSpotOrders(w, p) {
  if (p.orders.length === 0) {
    throw new InvalidInputError("orders must not be empty");
  }
  for (const [i, o] of p.orders.entries()) {
    if (o.price <= 0n || o.quantity <= 0n) {
      throw new InvalidInputError(`orders[${i}]: price and quantity must be > 0`);
    }
  }
  const gas = p.gas ?? w.defaultGas;
  const oneBase = 10n ** BigInt(p.baseDecimals);
  const requests = p.orders.map((o) => ({
    isBid: o.isBid,
    userData: o.userData ?? 0n,
    price: o.price,
    quantity: o.quantity,
    expireTimestampNs: o.expireTimestampNs ?? farFutureNs(),
    orderType: o.orderType ?? 0,
    selfMatchingOption: o.selfMatchingOption ?? 0,
    builder: o.builder ?? ZERO_ADDRESS,
    builderFeeBpsTimes1k: o.builderFeeBpsTimes1k ?? 0n
  }));
  if (p.autoApprove !== false) {
    let quoteIn = 0n;
    let baseIn = 0n;
    for (const o of p.orders) {
      if (o.isBid)
        quoteIn += (o.price * o.quantity + oneBase - 1n) / oneBase;
      else
        baseIn += o.quantity;
    }
    if (quoteIn > 0n)
      await w.approveIfNeeded(p.quoteToken, p.pool, quoteIn, gas);
    if (baseIn > 0n && !p.baseIsNative)
      await w.approveIfNeeded(p.baseToken, p.pool, baseIn, gas);
  }
  const result2 = await w.execute({
    address: p.pool,
    abi: orderBookBatchWriteAbi,
    functionName: "placeOrders",
    args: [requests],
    gas
  });
  const { placed, fills } = batchOrderEvents(result2.receipt, p.pool);
  let next = 0;
  const outcomes = requests.map((r) => {
    const ev = placed[next];
    if (ev && ev.isBid === r.isBid && ev.price === r.price && ev.quantity === r.quantity && ev.userData === r.userData && ev.expireTimestampNs === r.expireTimestampNs) {
      next += 1;
      return { success: true, orderId: ev.orderId };
    }
    return { success: false };
  });
  return { ...result2, outcomes, fills };
}
async function cancelOrders(w, p) {
  if (p.orderIds.length === 0) {
    throw new InvalidInputError("orderIds must not be empty");
  }
  const ids = p.orderIds.map((id2) => BigInt(id2));
  const result2 = await w.execute({
    address: p.pool,
    abi: orderBookBatchWriteAbi,
    functionName: "cancelOrders",
    args: [ids],
    gas: p.gas ?? w.defaultGas
  });
  const { terminated } = batchOrderEvents(result2.receipt, p.pool);
  return {
    ...result2,
    outcomes: ids.map((orderId) => ({ orderId, cancelled: terminated.has(orderId) }))
  };
}
async function reduceOrders(w, p) {
  if (p.reductions.length === 0) {
    throw new InvalidInputError("reductions must not be empty");
  }
  return w.execute({
    address: p.pool,
    abi: orderBookBatchWriteAbi,
    functionName: "reduceOrders",
    args: [
      p.reductions.map((r) => ({
        orderId: BigInt(r.orderId),
        newQuantityRemaining: r.newQuantityRemaining
      }))
    ],
    gas: p.gas ?? w.defaultGas
  });
}
function requireNonEmpty(items, what) {
  if (items.length === 0)
    throw new InvalidInputError(`${what} must not be empty`);
}
function requirePositive(price, quantity) {
  if (price <= 0n || quantity <= 0n)
    throw new InvalidInputError("price and quantity must be > 0");
}
function toPlaceRequest(o) {
  return {
    isBid: o.isBid,
    userData: o.userData ?? 0n,
    price: o.price,
    quantity: o.quantity,
    expireTimestampNs: o.expireTimestampNs ?? farFutureNs(),
    orderType: o.orderType ?? 0,
    selfMatchingOption: o.selfMatchingOption ?? 0,
    builder: o.builder ?? ZERO_ADDRESS,
    builderFeeBpsTimes1k: o.builderFeeBpsTimes1k ?? 0n
  };
}
async function amendOrder(w, p) {
  requirePositive(p.newOrder.price, p.newOrder.quantity);
  const tx = await w.execute({
    address: p.pool,
    // spotPoolWriteAbi is just the encoding table — `amendOrder` is inherited from
    // the shared OrderBook base, so the selector is identical on a PerpPool. Same
    // reason `reduceOrder` above encodes off the binary ABI for every pool kind.
    abi: spotPoolWriteAbi,
    functionName: "amendOrder",
    args: [
      {
        oldOrderId: BigInt(p.oldOrderId),
        alwaysPlace: p.alwaysPlace ?? false,
        newOrder: toPlaceRequest(p.newOrder)
      }
    ],
    gas: p.gas ?? w.defaultGas
  });
  return decodeAmendResult(tx, { pool: p.pool });
}
async function amendOrders(w, p) {
  requireNonEmpty(p.amendments, "amendments");
  for (const a of p.amendments)
    requirePositive(a.newOrder.price, a.newOrder.quantity);
  const tx = await w.execute({
    address: p.pool,
    abi: orderBookBatchWriteAbi,
    functionName: "amendOrders",
    args: [
      p.amendments.map((a) => ({
        oldOrderId: BigInt(a.oldOrderId),
        alwaysPlace: a.alwaysPlace ?? false,
        newOrder: toPlaceRequest(a.newOrder)
      }))
    ],
    gas: p.gas ?? w.defaultGas
  });
  return decodeBatchAmendResult(tx, { pool: p.pool, amendmentCount: p.amendments.length });
}
function perpOrderCall(w, p) {
  if (p.price <= 0n || p.quantity <= 0n) {
    throw new InvalidInputError("price and quantity must be > 0");
  }
  return {
    address: p.pool,
    abi: perpPoolWriteAbi,
    functionName: "placeOrder",
    args: [
      p.isBid,
      0n,
      p.price,
      p.quantity,
      p.expireTimestampNs ?? farFutureNs(),
      p.orderType ?? 0,
      p.selfMatchingOption ?? 0,
      p.builder ?? ZERO_ADDRESS,
      p.builderFeeBpsTimes1k ?? 0n
    ],
    gas: p.gas ?? w.defaultGas
  };
}
async function placePerpOrder(w, p) {
  return w.executeOrder(perpOrderCall(w, p));
}
async function buildPlaceOrder(w, p) {
  const order = toUnsigned(await binaryOrderCall(w, p), `Place ${p.side} order on binary pool ${p.pool}`);
  if (p.autoApprove === false)
    return { order };
  const e = w.escrow(p, await w.tokens(p));
  const approval = e.kind === "erc20" ? approvalCall(e.token, p.pool, `Approve collateral ${e.token} for binary pool ${p.pool}`) : toUnsigned({ address: e.outcomeToken, abi: erc6909Abi, functionName: "setOperator", args: [p.pool, true], gas: 0n }, `Approve binary pool ${p.pool} as operator on outcome tokens ${e.outcomeToken}`);
  return { order, approval };
}
async function buildPlaceSpotOrder(w, p) {
  const order = toUnsigned(spotOrderCall(w, p), `Place spot ${p.isBid ? "buy" : "sell"} order on pool ${p.pool}`);
  const e = spotEscrow(p);
  if ("native" in e || p.autoApprove === false)
    return { order };
  return { order, approval: approvalCall(e.token, p.pool, `Approve ${e.token} for spot pool ${p.pool}`) };
}
async function buildPlacePerpOrder(w, p) {
  return { order: toUnsigned(perpOrderCall(w, p), `Place perp ${p.isBid ? "long" : "short"} order on pool ${p.pool}`) };
}

// node_modules/@somnia-chain/markets-sdk/dist/syncStatus.js
var SyncStatusQuery = graphql(`
  query SyncStatus($chainId: Int!) {
    chain_metadata(where: { chain_id: { _eq: $chainId } }) {
      chain_id
      latest_processed_block
      block_height
      num_events_processed
    }
  }
`);
async function getSyncStatus(chainId, indexerUrl) {
  const data = await gqlRequest(SyncStatusQuery, { chainId }, indexerUrl);
  const row = data.chain_metadata[0];
  if (!row)
    return null;
  return {
    // The row was selected BY chain_id, so it equals the argument — Hasura types
    // the column nullable (it has no notion of the filter), but a matched row
    // cannot carry a null here. Prefer the known argument over asserting.
    chainId,
    latestProcessedBlock: row.latest_processed_block,
    blockHeight: row.block_height,
    numEventsProcessed: row.num_events_processed
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/router.js
var RouterActionFields = graphql(`
  fragment RouterActionFields on RouterActionRecord {
    id
    kind
    account
    market: market_id
    amount
    payout
    routedVia
    timestamp
    txHash
  }
`);
async function getRouterActions(account, opts = {}, indexerUrl) {
  const where = { account: { _eq: account.toLowerCase() } };
  const marketId = {};
  if (opts.market != null)
    marketId._eq = opts.market.toLowerCase();
  if (opts.markets != null)
    marketId._in = opts.markets.map((m) => m.toLowerCase());
  if (Object.keys(marketId).length)
    where.market_id = marketId;
  if (opts.kind != null)
    where.kind = { _eq: opts.kind };
  const data = await gqlRequest(RouterActionsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return narrowIndexerInvariant(data.RouterActionRecord);
}
var RouterActionsQuery = graphql(`
  query RouterActions($where: RouterActionRecord_bool_exp!, $limit: Int, $offset: Int) {
         RouterActionRecord(where: $where, order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...RouterActionFields }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/pools.js
async function getMarketByPool(pool, indexerUrl) {
  return (await listMarketsByPool(pool, { limit: 1 }, indexerUrl))[0] ?? null;
}
async function listMarketsByPool(pool, opts = {}, indexerUrl) {
  const data = await gqlRequest(MarketsByPoolQuery, { pool: pool.toLowerCase(), limit: opts.limit ?? 50 }, indexerUrl);
  return data.Market.map(toMarket);
}
var MarketsByPoolQuery = graphql(`
  query MarketsByPool($pool: String!, $limit: Int) {
    Market(
      where: { poolAddress: { _eq: $pool } }
      order_by: { createdAtTimestamp: desc }
      limit: $limit
    ) {
      ...MarketFields
    }
  }
`);
async function getPoolBindings(pool, indexerUrl) {
  const data = await gqlRequest(PoolBindingsQuery, { pool: pool.toLowerCase() }, indexerUrl);
  return narrowIndexerInvariant(data.PoolBinding);
}
async function getPool(address, indexerUrl) {
  const data = await gqlRequest(PoolByPkQuery, { id: address.toLowerCase() }, indexerUrl);
  return data.Pool_by_pk ?? null;
}
var PoolBindingsQuery = graphql(`
  query PoolBindings($pool: String!) {
         PoolBinding(where: {poolAddress: {_eq: $pool}}, order_by: {nonce: desc}) {
           id poolAddress marketId nonce fromBlock fromLogIndex fromTimestamp
           toBlock toLogIndex toTimestamp closedBy
         }
       }
`);
var PoolByPkQuery = graphql(`
  query PoolByPk($id: String!) {
         Pool_by_pk(id: $id) {
           id address collateral creator currentMarketId currentNonce generationCount
           createdAtTimestamp updatedAtTimestamp
         }
       }
`);
async function getFreePools(creator, collateral, module, client) {
  const pools = await client.readContract({
    address: module,
    abi: binaryModuleReadAbi,
    functionName: "getFreePools",
    args: [creator, collateral]
  });
  return [...pools];
}

// node_modules/@somnia-chain/markets-sdk/dist/candles.js
async function getCandles(poolAddress, intervalSeconds, opts = {}, indexerUrl) {
  const where = {
    pool: { _eq: poolAddress.toLowerCase() },
    intervalSeconds: { _eq: intervalSeconds }
  };
  const bs = {};
  if (opts.from != null)
    bs._gte = opts.from;
  if (opts.to != null)
    bs._lte = opts.to;
  if (Object.keys(bs).length)
    where.bucketStart = bs;
  const data = await gqlRequest(CandlesQuery, { where, limit: opts.limit ?? 500 }, indexerUrl);
  return data.Candle.slice().reverse();
}
var CANDLE_INTERVALS = [60, 300, 900, 3600, 14400, 86400];
var CandlesQuery = graphql(`
  query Candles($where: Candle_bool_exp!, $limit: Int) {
        Candle(where: $where, order_by: {bucketStart: desc}, limit: $limit) {
          bucketStart openPrice high low closePrice baseVolume quoteVolume tradeCount
        }
      }
`);

// node_modules/@somnia-chain/markets-sdk/dist/reducer.js
function applyEvent(ev, store) {
  switch (ev.eventName) {
    // ---- shared OrderBook events (log source = a spot or binary pool) ----
    case "OrderFilled":
      onOrderFilled(ev, store);
      break;
    case "OrderPlaced":
      onOrderPlaced(ev, store);
      break;
    // v2 side attribution: BinaryOrderPlaced carries the explicit YES/NO kind for
    // an order (userData is opaque now). Fires alongside OrderPlaced on a binary
    // pool; order within the tx is not guaranteed, so record the kind and patch
    // the order row whether it arrives before or after OrderPlaced.
    case "BinaryOrderPlaced":
      onBinaryOrderPlaced(ev, store);
      break;
    case "OrderRested":
      onOrderRested(ev, store);
      break;
    case "OrderCancelled":
      setOrderStatus(ev, store, "Cancelled");
      break;
    // Protocol-initiated maker removals during matching (same-owner self-match with
    // CancelMaker / the pre-fill guard on perp pools and its exceeds-position,
    // negative-equity and stale-mark reason tags) — terminal like an owner cancel.
    // Mirror of the PerpPool handlers in indexer/src/handlers/perp.ts.
    // `OrderCancelledPreFill` is the base event every pre-fill removal emits, so it
    // terminates the order even when a future reason tag is not cased here.
    // `OrderCancelledSelfMatch` is NOT subsumed by it — that path returns before the
    // pre-fill guard and emits no PreFill at all. The three perps reason tags ARE
    // subsumed for termination, but keep them: arrival order between a tag and the
    // base event is not guaranteed, so a tag processed alone must still terminate.
    case "OrderCancelledSelfMatch":
    case "MakerOrderCancelledExceedsPosition":
    case "MakerOrderCancelledNegativeEquity":
    case "MakerOrderCancelledStaleMark":
    case "OrderCancelledPreFill":
      setOrderStatus(ev, store, "Cancelled");
      break;
    case "OrderExpired":
      setOrderStatus(ev, store, "Expired");
      break;
    case "OrderReduced":
      onOrderReduced(ev, store);
      break;
    // ---- spot-only pool events ----
    case "MarkPriceUpdated":
      onMarkPriceUpdated(ev, store);
      break;
    case "OrderBookParametersUpdated":
      onBookParametersUpdated(ev, store);
      break;
    // ---- perp-only pool events ----
    case "FundingUpdated":
      onFundingUpdated(ev, store);
      break;
    case "OpenInterestUpdated":
      onOpenInterestUpdated(ev, store);
      break;
    // ---- creation: live discovery of new binary markets (MarketCreator's
    // 13-field event OR BinaryMarketsModule's 19-field event — same name,
    // distinct topic0; onMarketCreated handles both shapes) ----
    case "MarketCreated":
      onMarketCreated(ev, store);
      break;
    // v2 pool→market binding close: PoolReleased ends the pool's current binding
    // (the pool may next be recycled onto a different market). The next
    // MarketCreated on that pool opens a fresh binding.
    case "PoolReleased":
      onPoolReleased(ev, store);
      break;
    // v2 finalize: two events share this name (distinct topic0 → distinct arg
    // shape). The MODULE's `MarketFinalized(marketId, pool, marketKey)` flips
    // status; the SETTLEMENT's `MarketFinalized(marketKey, pool, nonce,
    // collateralToken, netBacking, …)` snapshots the net backing. Dispatch by
    // which args are present.
    case "MarketFinalized":
      onMarketFinalized(ev, store);
      break;
    // ---- BinaryPool backing events (log source = a binary pool) ----
    case "SetMinted":
      onBacking(ev, store, ev.args.amount, "add");
      break;
    case "SetBurned":
      onBacking(ev, store, ev.args.amount, "sub");
      break;
    // v2 finalize on the POOL side: the entire setBacking swept to settlement →
    // the pool's live backing is 0 (the settlement's MarketFinalized then records
    // the authoritative post-skim `netBacking` on the same market row).
    case "PoolFinalized":
      onPoolFinalized(ev, store);
      break;
    // v2: redemption moved to the settlement singleton. Its `Redeemed` carries
    // `marketKey` + `collateralOut` and debits that market's settlement backing.
    // (The removed v1 pool `Redeemed` debited pool setBacking instead.)
    case "Redeemed":
      onSettlementRedeemed(ev, store);
      break;
    // ---- BinaryMarket lifecycle (log source = the market contract) ----
    case "StatusChanged":
      onStatusChanged(ev, store);
      break;
    case "Resolved":
      onResolved(ev, store);
      break;
    case "Voided":
      onVoided(ev, store);
      break;
    default:
      break;
  }
}
function marketByPool(store, pool) {
  const id2 = store.poolToMarket.get(pool);
  return id2 ? store.markets.get(id2) : void 0;
}
function binaryByAddress(store, addr) {
  const id2 = store.addressToMarket.get(addr);
  const m = id2 ? store.markets.get(id2) : void 0;
  return m && m.marketType === "BINARY" ? m : void 0;
}
function onBinaryOrderPlaced(ev, store) {
  const key = orderKey(ev.address, ev.args.orderId);
  const side = sideOfKind(ev.args.kind);
  const existing = store.orders.get(key);
  if (existing) {
    store.orders.set(key, { ...existing, side });
    store.pendingKinds.delete(key);
  } else {
    store.pendingKinds.set(key, side);
  }
}
function onOrderPlaced(ev, store) {
  const market = marketByPool(store, ev.address);
  if (!market)
    return;
  const placed = ev.args.placedOrder;
  const orderId = placed.orderId;
  const isBid = placed.isBid;
  const userData = placed.userData;
  const fullQuantity = placed.fullQuantity;
  const quantityRemaining = placed.quantityRemaining;
  const expireTimestampNs = placed.expireTimestampNs;
  const isBinary = market.marketType === "BINARY";
  const key = orderKey(ev.address, orderId);
  const side = isBinary ? store.pendingKinds.get(key) : void 0;
  if (side)
    store.pendingKinds.delete(key);
  const order = {
    id: key,
    market_id: market.id,
    pool: ev.address,
    orderId: orderId.toString(),
    owner: lower0x(placed.owner),
    side,
    isBid,
    // userData is opaque MM bookkeeping in v2 — carried verbatim, never decoded.
    userData: userData.toString(),
    price: placed.price.toString(),
    fullQuantity: fullQuantity.toString(),
    quantityRemaining: quantityRemaining.toString(),
    filledQuantity: (fullQuantity - quantityRemaining).toString(),
    // Mirror of indexer orderbook.ts: carry the maker's TIF so the book can drop
    // it once now > expireTimestampNs (on-chain expiry is lazy — no event fires).
    expireTimestampNs: expireTimestampNs.toString(),
    // Fully filled on placement → OrderRested won't fire → mark Filled directly.
    status: quantityRemaining === 0n ? "Filled" : isBinary ? "Open" : "Closed",
    rested: false,
    createdAt: ev.timestampSec.toString(),
    txHash: ev.txHash
  };
  store.orders.set(key, order);
}
function onOrderRested(ev, store) {
  const key = orderKey(ev.address, ev.args.orderId);
  const order = store.orders.get(key);
  if (!order)
    return;
  store.orders.set(key, { ...order, rested: true, status: order.status === "Closed" ? "Open" : order.status });
}
function setOrderStatus(ev, store, status) {
  const key = orderKey(ev.address, ev.args.orderId);
  const order = store.orders.get(key);
  if (!order)
    return;
  store.orders.set(key, { ...order, status });
}
function onOrderReduced(ev, store) {
  const key = orderKey(ev.address, ev.args.orderId);
  const order = store.orders.get(key);
  if (!order)
    return;
  const reduction = BigInt(order.quantityRemaining) - ev.args.newQuantity;
  store.orders.set(key, {
    ...order,
    fullQuantity: (BigInt(order.fullQuantity) - reduction).toString(),
    quantityRemaining: ev.args.newQuantity.toString()
  });
}
function onOrderFilled(ev, store) {
  const market = marketByPool(store, ev.address);
  if (!market)
    return;
  const makerKey = orderKey(ev.address, ev.args.makerOrderId);
  const makerOrder = store.orders.get(makerKey);
  const makerSide = makerOrder == null ? void 0 : makerOrder.side;
  const maker = makerOrder == null ? void 0 : makerOrder.owner;
  const quantity = ev.args.quantityFilled;
  const fillPrice = ev.args.fillPrice;
  const quoteQuantity = quantity * fillPrice / 10n ** BigInt(market.baseDecimals ?? DECIMALS);
  const id2 = fillKey(ev.blockNumber, ev.logIndex);
  const fill = {
    id: id2,
    market_id: market.id,
    pool: ev.address,
    // Taker is unknown at OrderFilled time; resolved via the takerOrder join.
    taker: void 0,
    maker,
    takerSide: void 0,
    makerSide,
    // The taker takes the opposite side of the maker's resting order — known
    // right here, so derive it (mirror of orderbook.ts). Falls back to the
    // takerOrder join only when the maker order was never witnessed.
    takerIsBid: makerOrder ? !makerOrder.isBid : void 0,
    kind: void 0,
    fillPrice: fillPrice.toString(),
    quantity: quantity.toString(),
    quoteQuantity: quoteQuantity.toString(),
    takerRemainingQuantity: ev.args.takerRemainingQuantity.toString(),
    makerRemainingQuantity: ev.args.makerRemainingQuantity.toString(),
    timestamp: ev.timestampSec.toString(),
    blockNumber: ev.blockNumber,
    logIndex: ev.logIndex,
    txHash: ev.txHash,
    // Foreign keys to LiveOrder rows — missing taker side/address derives via join.
    takerOrder_id: orderKey(ev.address, ev.args.takerOrderId),
    makerOrder_id: makerKey
  };
  store.fills.set(id2, fill);
  if (makerOrder) {
    const makerRemaining = ev.args.makerRemainingQuantity;
    store.orders.set(makerKey, {
      ...makerOrder,
      quantityRemaining: makerRemaining.toString(),
      filledQuantity: (BigInt(makerOrder.fullQuantity) - makerRemaining).toString(),
      status: makerRemaining === 0n && makerOrder.status === "Open" ? "Filled" : makerOrder.status
    });
  }
  const next = {
    ...market,
    lastPrice: fillPrice.toString(),
    lastTradeAt: ev.timestampSec.toString(),
    cumulativeBaseVolume: (BigInt(market.cumulativeBaseVolume) + quantity).toString(),
    cumulativeQuoteVolume: (BigInt(market.cumulativeQuoteVolume) + quoteQuantity).toString(),
    tradeCount: (BigInt(market.tradeCount) + 1n).toString()
  };
  store.markets.set(market.id, next);
}
function onBacking(ev, store, delta, op) {
  const market = marketByPool(store, ev.address);
  if (!market || market.marketType !== "BINARY")
    return;
  const current = BigInt(market.backing);
  const next = op === "add" ? current + delta : current > delta ? current - delta : 0n;
  store.markets.set(market.id, { ...market, backing: next.toString() });
}
function onMarkPriceUpdated(ev, store) {
  const market = marketByPool(store, ev.address);
  if (!market || market.marketType !== "SPOT")
    return;
  store.markets.set(market.id, { ...market, markPrice: ev.args.markPrice.toString() });
}
function onBookParametersUpdated(ev, store) {
  const market = marketByPool(store, ev.address);
  if (!market || market.marketType === "BINARY")
    return;
  const p = ev.args.newParameters;
  store.markets.set(market.id, {
    ...market,
    tickSize: p.tickSize.toString(),
    minQuantity: p.minQuantity.toString(),
    lotSize: p.lotSize.toString()
  });
}
function onFundingUpdated(ev, store) {
  const market = marketByPool(store, ev.address);
  if (!market || market.marketType !== "PERP")
    return;
  const markPrice = ev.args.markPrice;
  const markOk = markPrice != null && markPrice !== 0n;
  store.markets.set(market.id, {
    ...market,
    fundingRate: ev.args.fundingRate.toString(),
    cumulativeFundingPerUnit: ev.args.cumulativeFundingPerUnit.toString(),
    indexPrice: ev.args.indexPrice.toString(),
    fundingUpdatedAt: ev.timestampSec.toString(),
    ...markOk ? { markPrice: markPrice.toString(), markPriceUpdatedAt: ev.timestampSec.toString() } : {}
  });
  const key = `${ev.blockNumber}_${ev.logIndex}`;
  store.fundingUpdates.set(key, {
    id: `${ev.address.toLowerCase()}_${ev.blockNumber}_${ev.logIndex}`,
    pool: ev.address.toLowerCase(),
    fundingRate: ev.args.fundingRate.toString(),
    cumulativeFundingPerUnit: ev.args.cumulativeFundingPerUnit.toString(),
    indexPrice: ev.args.indexPrice.toString(),
    markPrice: markOk ? markPrice.toString() : null,
    intervalsSettled: (ev.args.intervalsSettled ?? 0n).toString(),
    // The indexer derives intervalsAccrued and the params in force from the epoch
    // series; the tail has neither, so it reports what the event carries and leaves the
    // rest to the indexed row that follows.
    fundingWindowSec: market.fundingWindowSec,
    fundingIntervalSec: market.fundingIntervalSec,
    timestamp: ev.timestampSec.toString(),
    blockNumber: ev.blockNumber.toString(),
    logIndex: ev.logIndex
  });
}
function onOpenInterestUpdated(ev, store) {
  const market = marketByPool(store, ev.address);
  if (!market || market.marketType !== "PERP")
    return;
  store.markets.set(market.id, {
    ...market,
    // ONE total, not a (long, short) pair.
    openInterest: ev.args.openInterest.toString(),
    openInterestUpdatedAt: ev.timestampSec.toString()
  });
}
function onMarketCreated(ev, store) {
  const id2 = lower0x(ev.args.marketId);
  if (store.markets.has(id2))
    return;
  const tradingStart = Number(ev.args.tradingStart);
  const expiry = Number(ev.args.expiry);
  const intervalSecStr = "intervalSec" in ev.args ? ev.args.intervalSec.toString() : String(expiry - tradingStart);
  const market = {
    id: id2,
    marketType: "BINARY",
    poolAddress: lower0x(ev.args.pool),
    lastPrice: null,
    lastTradeAt: null,
    cumulativeBaseVolume: "0",
    cumulativeQuoteVolume: "0",
    tradeCount: "0",
    baseDecimals: DECIMALS,
    quoteDecimals: DECIMALS,
    createdAtTimestamp: ev.timestampSec.toString(),
    // The log's own block — the same value the indexer stores, so a market
    // built from the live tail brackets its feed reads identically to one
    // built from a snapshot.
    createdAtBlock: ev.blockNumber.toString(),
    marketId: id2,
    marketAddress: lower0x(ev.args.market),
    yesTokenId: ev.args.yesId.toString(),
    noTokenId: ev.args.noId.toString(),
    collateral: lower0x(ev.args.collateral),
    asset: ev.args.asset,
    question: ev.args.question,
    // Mirror indexer binary.ts: a market discovered live AT/AFTER its expiry is
    // Settling, not Trading/Listed (collapse expired-at-create → Settling).
    status: ev.timestampSec >= tradingStart && ev.timestampSec < expiry ? "Trading" : ev.timestampSec >= expiry ? "Settling" : "Listed",
    // Not carried by the live MarketCreator.MarketCreated event — filled on the
    // next snapshot (same null-until-snapshot pattern as venueId/backing below).
    oracleQuestion: null,
    strike: ev.args.strike.toString(),
    // Derived here too rather than defaulted, so a market built from the live
    // tail before the indexer has it reports the same mode it will report after
    // — through the same helper `toMarket` uses, so the two cannot disagree.
    mode: binaryResolutionMode(ev.args.strike),
    tradingStart: tradingStart.toString(),
    expiry: expiry.toString(),
    winningOutcome: null,
    resolvedAtBlock: null,
    resolvedAtTimestamp: null,
    createdByTx: null,
    voided: false,
    backing: "0",
    // v2 pool binding: the module's MarketCreated carries the pool's market nonce
    // (part of the outcome-id encoding); the MarketCreator's 13-field event does
    // not — null until the next snapshot fills it. Fresh markets start
    // unfinalized with no settlement record.
    nonce: "nonce" in ev.args ? ev.args.nonce.toString() : null,
    finalized: false,
    netBacking: null,
    intervalSec: intervalSecStr,
    // Serve the timeframe label here too (the indexer path stamps it in
    // `toMarket`) so a live-tail-discovered market carries `interval` before the
    // next snapshot merge — one source of truth (see interval.ts).
    interval: marketIntervalLabel({ intervalSec: intervalSecStr }),
    // Origin attribution: only the module's 19-field MarketCreated carries it.
    // Markets discovered via the MarketCreator event show null until the next
    // snapshot fills it — same pattern as `backing`.
    operatorId: "operatorId" in ev.args ? Number(ev.args.operatorId) : null,
    venueId: "venueId" in ev.args ? lower0x(ev.args.venueId) : null,
    // Opaque creator-supplied bytes — module event only (null-until-snapshot otherwise).
    context: "context" in ev.args ? lower0x(ev.args.context) : null
  };
  store.indexMarket(market);
}
function binaryByMarketKey(store, key) {
  const pool = `0x${(key >> 64n).toString(16).padStart(40, "0")}`;
  const nonce = (key & (1n << 64n) - 1n).toString();
  const bound = marketByPool(store, pool);
  if (bound && bound.marketType === "BINARY" && (bound.nonce == null || bound.nonce === nonce)) {
    return bound;
  }
  for (const m of store.markets.values()) {
    if (m.marketType === "BINARY" && m.poolAddress === pool && m.nonce === nonce)
      return m;
  }
  return void 0;
}
function onPoolFinalized(ev, store) {
  const market = marketByPool(store, ev.address);
  if (!market || market.marketType !== "BINARY")
    return;
  store.markets.set(market.id, { ...market, backing: "0", finalized: true });
}
function onPoolReleased(ev, store) {
  const id2 = ev.args.marketId.toLowerCase();
  const pool = ev.args.pool.toLowerCase();
  if (store.poolToMarket.get(pool) === id2)
    store.poolToMarket.delete(pool);
}
function onMarketFinalized(ev, store) {
  if ("marketId" in ev.args) {
    const id2 = ev.args.marketId.toLowerCase();
    const m = store.markets.get(id2);
    if (m && m.marketType === "BINARY") {
      store.markets.set(id2, { ...m, finalized: true, status: "Finalized" });
    }
    return;
  }
  const market = binaryByMarketKey(store, ev.args.marketKey);
  if (!market)
    return;
  store.markets.set(market.id, {
    ...market,
    finalized: true,
    status: "Finalized",
    // The pool swept its whole setBacking out (pool backing 0); the settlement
    // record's NET backing (post fee-skim) is the redeemable pot from here on.
    backing: "0",
    netBacking: ev.args.netBacking.toString()
  });
}
function onSettlementRedeemed(ev, store) {
  const market = binaryByMarketKey(store, ev.args.marketKey);
  if (!market || market.netBacking == null)
    return;
  const out = ev.args.collateralOut;
  const cur = BigInt(market.netBacking);
  store.markets.set(market.id, {
    ...market,
    netBacking: (cur > out ? cur - out : 0n).toString()
  });
}
function onStatusChanged(ev, store) {
  const market = binaryByAddress(store, ev.address);
  if (!market)
    return;
  const status = BINARY_MARKET_STATUS[Number(ev.args.newStatus)];
  if (!status)
    return;
  store.markets.set(market.id, { ...market, status });
}
function onResolved(ev, store) {
  const market = binaryByAddress(store, ev.address);
  if (!market)
    return;
  const vec = ev.args.payoutNumerators ?? [];
  let winningOutcome = 0;
  for (let i = 1; i < vec.length; i++) {
    if ((vec[i] ?? 0n) > (vec[winningOutcome] ?? 0n))
      winningOutcome = i;
  }
  store.markets.set(market.id, {
    ...market,
    status: "Resolved",
    winningOutcome
  });
}
function onVoided(ev, store) {
  const market = binaryByAddress(store, ev.address);
  if (!market)
    return;
  store.markets.set(market.id, { ...market, status: "Voided", voided: true });
}

// node_modules/@somnia-chain/markets-sdk/dist/snapshot.js
async function gql(indexerUrl, query, variables) {
  return postGraphql(indexerUrl, query, variables);
}
var FILL_FIELDS = `
  id market { id poolAddress } maker makerSide takerIsBid
  takerOrder_id makerOrder_id
  fillPrice quantity quoteQuantity takerRemainingQuantity makerRemainingQuantity
  timestamp blockNumber txHash
`;
var ORDER_FIELDS = `
  id market { id poolAddress } orderId owner side isBid userData price
  fullQuantity quantityRemaining filledQuantity status rested expireTimestampNs
  placedAtTimestamp placedTxHash
`;
var CHAIN_META = `chain_metadata(where: {chain_id: {_eq: $chainId}}) { latest_processed_block block_height }`;
function seamOf(meta) {
  const snapshotBlock = (meta == null ? void 0 : meta.latest_processed_block) ?? 0;
  return { snapshotBlock, headBlock: (meta == null ? void 0 : meta.block_height) ?? snapshotBlock };
}
function logIndexFromId(id2) {
  const n = Number(id2.split("_")[1]);
  return Number.isFinite(n) ? n : 0;
}
function toFill(r) {
  return {
    id: r.id,
    market_id: r.market.id,
    pool: lower0x(asAddress(r.market.poolAddress)),
    // Left undefined so this mirrors the live reducer, which derives all three
    // from the taker ORDER as logs arrive. `taker` IS stored on the Fill (see the
    // RawFill note above); this snapshot simply does not select it, because the
    // reducer it hands off to must reconstruct the same values from logs alone.
    taker: void 0,
    maker: r.maker ? lower0x(asAddress(r.maker)) : void 0,
    takerSide: void 0,
    makerSide: r.makerSide ?? void 0,
    takerIsBid: r.takerIsBid ?? void 0,
    kind: void 0,
    takerOrder_id: r.takerOrder_id,
    makerOrder_id: r.makerOrder_id,
    fillPrice: r.fillPrice,
    quantity: r.quantity,
    quoteQuantity: r.quoteQuantity,
    takerRemainingQuantity: r.takerRemainingQuantity,
    makerRemainingQuantity: r.makerRemainingQuantity,
    timestamp: r.timestamp,
    blockNumber: Number(r.blockNumber),
    logIndex: logIndexFromId(r.id),
    txHash: r.txHash
  };
}
function toOrder(r) {
  return {
    id: r.id,
    market_id: r.market.id,
    pool: lower0x(asAddress(r.market.poolAddress)),
    orderId: r.orderId,
    owner: lower0x(asAddress(r.owner)),
    side: r.side ?? void 0,
    isBid: r.isBid,
    userData: r.userData,
    price: r.price,
    fullQuantity: r.fullQuantity,
    quantityRemaining: r.quantityRemaining,
    filledQuantity: r.filledQuantity,
    status: r.status,
    rested: r.rested,
    expireTimestampNs: r.expireTimestampNs,
    createdAt: r.placedAtTimestamp,
    txHash: r.placedTxHash
  };
}
async function loadMarketsSnapshot(chainId, scope, deps) {
  const scoped = scope !== "all";
  const pools = scoped ? scope.map((p) => p.toLowerCase()) : [];
  const marketWhere = scoped ? `where: {poolAddress: {_in: $pools}}, ` : "";
  const fillWhere = scoped ? `pool: {_in: $pools}` : "";
  const nowNs = (BigInt(Math.floor(Date.now() / 1e3)) * 1000000000n).toString();
  const liveExpiry = `expireTimestampNs: {_gte: "${nowNs}"}`;
  const orderWhere2 = scoped ? `{status: {_eq: "Open"}, ${liveExpiry}, market: {poolAddress: {_in: $pools}}}` : `{status: {_eq: "Open"}, ${liveExpiry}}`;
  const data = await gql(deps.indexerUrl, `query MarketsSnapshot($chainId: Int!, ${scoped ? "$pools: [String!]!, " : ""}$marketLimit: Int!, $fillLimit: Int!, $orderLimit: Int!) {
      ${CHAIN_META}
      Market(${marketWhere}order_by: {createdAtTimestamp: desc}, limit: $marketLimit) { ${MARKET_FIELDS} }
      Fill(${fillWhere ? `where: {${fillWhere}}, ` : ""}order_by: [{timestamp: desc}, {blockNumber: desc}], limit: $fillLimit) { ${FILL_FIELDS} }
      openOrders: Order(where: ${orderWhere2}, order_by: {placedAtTimestamp: desc}, limit: $orderLimit) { ${ORDER_FIELDS} }
    }`, {
    chainId,
    ...scoped ? { pools } : {},
    marketLimit: scoped ? pools.length : 500,
    // Per-scope limits: a scoped watch is usually 1 pool, so these are
    // generous per market rather than a global truncation.
    fillLimit: scoped ? 200 * Math.max(1, pools.length) : 300,
    orderLimit: scoped ? 2e3 * Math.max(1, pools.length) : 4e3
  });
  const markets = toMarkets(data.Market);
  deps.store.mergeSnapshot({
    markets,
    fills: data.Fill.map(toFill),
    orders: (data.openOrders ?? []).map(toOrder)
  });
  return {
    ...seamOf(data.chain_metadata[0]),
    pools: markets.map((m) => m.poolAddress.toLowerCase()),
    marketAddresses: markets.flatMap((m) => m.marketType === "BINARY" ? [m.marketAddress.toLowerCase()] : [])
  };
}
async function loadUserSnapshot(chainId, user, deps) {
  const data = await gql(deps.indexerUrl, `query UserSnapshot($chainId: Int!, $user: String!, $userLimit: Int!) {
      ${CHAIN_META}
      userFills: Fill(
        where: {_or: [{maker: {_eq: $user}}, {taker: {_eq: $user}}]},
        order_by: [{timestamp: desc}, {blockNumber: desc}], limit: $userLimit
      ) { ${FILL_FIELDS} }
      userOrders: Order(
        where: {owner: {_eq: $user}},
        order_by: {placedAtTimestamp: desc}, limit: $userLimit
      ) { ${ORDER_FIELDS} }
    }`, { chainId, user: user.toLowerCase(), userLimit: 200 });
  deps.store.mergeSnapshot({
    markets: [],
    fills: data.userFills.map(toFill),
    orders: data.userOrders.map(toOrder)
  });
  return seamOf(data.chain_metadata[0]);
}

// node_modules/@somnia-chain/markets-sdk/dist/liveTail.js
var LIVE_TOPIC0 = topic0Set(liveEventsAbi);
var GETLOGS_CHUNK = 1e3;
var RECONNECT_BASE_MS = 500;
var RECONNECT_MAX_MS = 8e3;
var HEADS_STALL_MS = 15e3;
var RELEASE_LINGER_MS = 3e4;
function evKey(blockNumber, logIndex) {
  return `${blockNumber}_${logIndex}`;
}
var LiveTail = class {
  constructor(deps) {
    __publicField(this, "deps");
    __publicField(this, "client", null);
    __publicField(this, "unwatchHeads", null);
    __publicField(this, "unwatchLogs", null);
    __publicField(this, "retryTimer", null);
    __publicField(this, "retryDelay", RECONNECT_BASE_MS);
    // ---- watch registry (all keys lowercased) ----
    __publicField(this, "poolRefs", /* @__PURE__ */ new Map());
    __publicField(this, "allRefs", 0);
    __publicField(this, "discoverRefs", 0);
    __publicField(this, "userRefs", /* @__PURE__ */ new Map());
    /** Pools covered by the all-markets watch (snapshot set + live discoveries). */
    __publicField(this, "allPools", /* @__PURE__ */ new Set());
    /** Pools whose seam has been sealed — their store rows are current. */
    __publicField(this, "hydratedPools", /* @__PURE__ */ new Set());
    /** Users whose history snapshot has landed. */
    __publicField(this, "hydratedUsers", /* @__PURE__ */ new Set());
    /** Scope-keyed linger timers (pool:<addr> | all | user:<addr>). */
    __publicField(this, "lingers", /* @__PURE__ */ new Map());
    /** In-flight scope hydrations, so concurrent watchers share one snapshot. */
    __publicField(this, "hydrations", /* @__PURE__ */ new Map());
    /** Pools whose scope is mid-hydration — their logs buffer in the inbox. */
    __publicField(this, "pendingPools", /* @__PURE__ */ new Set());
    // ---- stream state ----
    __publicField(this, "live", false);
    __publicField(this, "reconnecting", false);
    __publicField(this, "lastBlock", 0);
    __publicField(this, "lastHeadAt", 0);
    __publicField(this, "headsWatchdog", null);
    __publicField(this, "probingHeads", false);
    __publicField(this, "watchAddresses", []);
    __publicField(this, "watchSet", /* @__PURE__ */ new Set());
    __publicField(this, "blockTs", /* @__PURE__ */ new Map());
    __publicField(this, "processed", /* @__PURE__ */ new Set());
    __publicField(this, "inbox", /* @__PURE__ */ new Map());
    this.deps = deps;
  }
  get chainId() {
    return this.deps.getConfig().chain.id;
  }
  /**
   *  Creation-event sources watched in discovery mode: the MarketCreator
   *  factory (its 13-field MarketCreated) AND the BinaryMarketsModule (its own
   *  19-field MarketCreated — module-created markets never pass through the
   *  MarketCreator). Either address may be absent from the config — skip it.
   */
  get discoverySources() {
    if (this.discoverRefs === 0)
      return [];
    const addresses = this.deps.getConfig().addresses;
    const sources = [];
    if (addresses == null ? void 0 : addresses.marketCreator)
      sources.push(addresses.marketCreator.toLowerCase());
    if (addresses == null ? void 0 : addresses.binaryModule)
      sources.push(addresses.binaryModule.toLowerCase());
    return sources;
  }
  /** Every pool an active watch covers. */
  activePools() {
    const pools = new Set(this.poolRefs.keys());
    if (this.allRefs > 0)
      for (const p of this.allPools)
        pools.add(p);
    for (const p of this.pendingPools)
      pools.add(p);
    return pools;
  }
  // ------------------------------------------------------------------
  // Watches
  // ------------------------------------------------------------------
  /** Watch one market: hydrate its snapshot and stream its events. */
  async watchMarket(pool) {
    const key = pool.toLowerCase();
    this.acquire(this.poolRefs, key, `pool:${key}`);
    try {
      if (!this.hydratedPools.has(key)) {
        await this.ensureHydration(`pool:${key}`, () => this.hydratePools([key]));
      }
    } catch (e) {
      this.releaseNow(this.poolRefs, key);
      this.ensureSubscriptions();
      throw e;
    }
    return this.handle(() => this.release(this.poolRefs, key, `pool:${key}`, () => this.teardownPool(key)));
  }
  /**
   *  Watch every market the indexer knows; `discover` also watches the
   *  MarketCreator factory + the BinaryMarketsModule so markets created later
   *  join live (module-created markets emit only the module's MarketCreated).
   */
  async watchAllMarkets(discover) {
    this.cancelLinger("all");
    this.allRefs++;
    if (discover)
      this.discoverRefs++;
    try {
      if (this.allPools.size === 0)
        await this.ensureHydration("all", () => this.hydrateAll());
      else
        this.ensureSubscriptions();
    } catch (e) {
      this.allRefs--;
      if (discover)
        this.discoverRefs--;
      throw e;
    }
    return this.handle(() => {
      if (discover)
        this.discoverRefs--;
      this.allRefs--;
      if (this.allRefs === 0)
        this.linger("all", () => this.teardownAll());
      else
        this.ensureSubscriptions();
    });
  }
  /**
   *  Hydrate one account's past orders + fills (indexer, once). Live events
   *  are attributed to every account on watched markets regardless — this only
   *  supplies history, and only stays current within watched markets.
   */
  async watchUser(user) {
    const key = user.toLowerCase();
    this.acquire(this.userRefs, key, `user:${key}`);
    try {
      if (!this.hydratedUsers.has(key)) {
        await this.ensureHydration(`user:${key}`, async () => {
          await loadUserSnapshot(this.chainId, key, {
            indexerUrl: this.deps.getConfig().indexerUrl,
            store: this.deps.store
          });
          this.hydratedUsers.add(key);
          this.deps.store.commit();
        });
      }
    } catch (e) {
      this.releaseNow(this.userRefs, key);
      throw e;
    }
    return this.handle(() => this.release(this.userRefs, key, `user:${key}`, () => {
      this.userRefs.delete(key);
      this.hydratedUsers.delete(key);
    }));
  }
  /** Per-market watch state (see {@link WatchStatus}). */
  getWatchStatus(pool) {
    const key = pool.toLowerCase();
    if (this.pendingPools.has(key))
      return "hydrating";
    const covered = this.poolRefs.has(key) || this.allRefs > 0 && this.allPools.has(key);
    if (!covered)
      return "unwatched";
    return this.live ? "live" : "hydrating";
  }
  /**
   *  Tear down everything: all watches, subscriptions, timers. The store keeps
   *  its last state (reads keep answering, stale).
   */
  stopLive() {
    var _a, _b;
    for (const t of this.lingers.values())
      clearTimeout(t);
    this.lingers.clear();
    this.poolRefs.clear();
    this.userRefs.clear();
    this.allRefs = this.discoverRefs = 0;
    this.allPools.clear();
    this.hydratedPools.clear();
    this.hydratedUsers.clear();
    this.pendingPools.clear();
    this.hydrations.clear();
    (_a = this.unwatchHeads) == null ? void 0 : _a.call(this);
    (_b = this.unwatchLogs) == null ? void 0 : _b.call(this);
    this.unwatchHeads = this.unwatchLogs = null;
    if (this.retryTimer)
      clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.live = false;
    this.watchAddresses = [];
    this.watchSet.clear();
    this.inbox.clear();
    this.deps.store.setStatus({ mode: "init", wsConnected: false, watchCount: 0 });
  }
  // ---- refcount plumbing ----
  acquire(refs, key, lingerKey) {
    this.cancelLinger(lingerKey);
    refs.set(key, (refs.get(key) ?? 0) + 1);
  }
  release(refs, key, lingerKey, teardown) {
    const count = (refs.get(key) ?? 0) - 1;
    if (count > 0) {
      refs.set(key, count);
      return;
    }
    refs.set(key, 0);
    this.linger(lingerKey, teardown);
  }
  releaseNow(refs, key) {
    const count = (refs.get(key) ?? 0) - 1;
    if (count > 0)
      refs.set(key, count);
    else
      refs.delete(key);
  }
  handle(stop) {
    let stopped = false;
    return {
      stop: () => {
        if (stopped)
          return;
        stopped = true;
        stop();
      }
    };
  }
  linger(key, teardown) {
    this.cancelLinger(key);
    this.lingers.set(key, setTimeout(() => {
      this.lingers.delete(key);
      teardown();
    }, RELEASE_LINGER_MS));
  }
  cancelLinger(key) {
    const t = this.lingers.get(key);
    if (t) {
      clearTimeout(t);
      this.lingers.delete(key);
    }
  }
  teardownPool(key) {
    this.poolRefs.delete(key);
    this.hydrations.delete(`pool:${key}`);
    if (!(this.allRefs > 0 && this.allPools.has(key))) {
      this.deps.store.purgePool(key);
      this.hydratedPools.delete(key);
    }
    this.ensureSubscriptions();
    this.deps.store.commit();
  }
  teardownAll() {
    this.hydrations.delete("all");
    for (const p of this.allPools) {
      if (!this.poolRefs.has(p)) {
        this.deps.store.purgePool(p);
        this.hydratedPools.delete(p);
      }
    }
    this.allPools.clear();
    this.ensureSubscriptions();
    this.deps.store.commit();
  }
  async ensureHydration(key, run) {
    const inFlight = this.hydrations.get(key);
    if (inFlight)
      return inFlight;
    const p = this.deps.dbg.span(`liveTail.hydrate:${key}`, () => run()).finally(() => this.hydrations.delete(key));
    this.hydrations.set(key, p);
    return p;
  }
  // ------------------------------------------------------------------
  // Scope hydration — the seam
  // ------------------------------------------------------------------
  async hydratePools(pools) {
    for (const p of pools)
      this.pendingPools.add(p);
    try {
      this.ensureSubscriptions();
      const res = await loadMarketsSnapshot(this.chainId, pools, {
        indexerUrl: this.deps.getConfig().indexerUrl,
        store: this.deps.store
      });
      this.ensureSubscriptions();
      await this.sealSeam(res.snapshotBlock, res.headBlock, pools);
      for (const p of pools)
        this.hydratedPools.add(p);
    } finally {
      for (const p of pools)
        this.pendingPools.delete(p);
    }
    this.markLive();
  }
  async hydrateAll() {
    const res = await loadMarketsSnapshot(this.chainId, "all", {
      indexerUrl: this.deps.getConfig().indexerUrl,
      store: this.deps.store
    });
    for (const p of res.pools) {
      this.allPools.add(p);
      this.pendingPools.add(p);
    }
    try {
      this.ensureSubscriptions();
      await this.sealSeam(res.snapshotBlock, res.headBlock, res.pools);
      for (const p of res.pools)
        this.hydratedPools.add(p);
    } finally {
      for (const p of res.pools)
        this.pendingPools.delete(p);
    }
    this.markLive();
  }
  /** Backfill [snapshot+1, head] for the scope, then replay its buffered logs. */
  async sealSeam(snapshotBlock, indexerHead, pools) {
    const head = Math.max(indexerHead, this.deps.store.status.headBlock, ...this.blockTs.keys());
    const scopeAddrs = this.addressesFor(new Set(pools));
    if (scopeAddrs.length > 0 && head >= snapshotBlock + 1) {
      await this.backfill(snapshotBlock + 1, head, scopeAddrs);
    }
    this.lastBlock = Math.max(this.lastBlock, head, snapshotBlock);
    await this.replayInbox(snapshotBlock, new Set(scopeAddrs));
    this.deps.store.setStatus({ snapshotBlock, lastBlock: this.lastBlock });
  }
  markLive() {
    this.live = true;
    this.retryDelay = RECONNECT_BASE_MS;
    this.deps.store.setStatus({ mode: "tailing", lastBlock: this.lastBlock, watchCount: this.activePools().size });
  }
  /** A scope's watch addresses: its pools + their BinaryMarket contracts. */
  addressesFor(pools) {
    const addrs = new Set(pools);
    for (const pool of pools) {
      const id2 = this.deps.store.poolToMarket.get(pool);
      const m = id2 ? this.deps.store.markets.get(id2) : void 0;
      if ((m == null ? void 0 : m.marketType) === "BINARY")
        addrs.add(m.marketAddress.toLowerCase());
    }
    return [...addrs];
  }
  // ------------------------------------------------------------------
  // Subscriptions
  // ------------------------------------------------------------------
  /**
   *  Recompute the watch set (active pools ∪ their markets ∪ discovery
   *  sources) and (re)subscribe. No-op if unchanged. Opens the socket on
   *  first use.
   */
  ensureSubscriptions() {
    var _a, _b;
    const pools = this.activePools();
    const addrs = new Set(this.addressesFor(pools));
    for (const src of this.discoverySources)
      addrs.add(src);
    if (pools.size > 0) {
      const a = this.deps.getConfig().addresses;
      if (a == null ? void 0 : a.binaryModule)
        addrs.add(a.binaryModule.toLowerCase());
      if (a == null ? void 0 : a.binarySettlement)
        addrs.add(a.binarySettlement.toLowerCase());
    }
    const next = [...addrs].sort();
    const same = next.length === this.watchAddresses.length && next.every((a, i) => a === this.watchAddresses[i]);
    this.deps.store.setStatus({ watchCount: pools.size });
    if (same && (this.unwatchLogs || next.length === 0))
      return;
    (_a = this.unwatchLogs) == null ? void 0 : _a.call(this);
    this.unwatchLogs = null;
    this.watchAddresses = next;
    this.watchSet = new Set(next);
    if (next.length === 0) {
      (_b = this.unwatchHeads) == null ? void 0 : _b.call(this);
      this.unwatchHeads = null;
      this.stopHeadsWatchdog();
      return;
    }
    this.client ?? (this.client = this.deps.getClient());
    this.unwatchHeads ?? (this.unwatchHeads = this.client.watchBlocks({
      emitMissed: true,
      includeTransactions: false,
      onBlock: (block) => void this.onHead(block),
      onError: () => this.onWsError()
    }));
    this.startHeadsWatchdog();
    this.unwatchLogs = this.client.watchEvent({
      address: next,
      onLogs: (logs) => this.onLogs(logs),
      onError: () => this.onWsError()
    });
  }
  // ---- chain head: timestamp source for logs (which carry none) ----
  async onHead(block) {
    this.lastHeadAt = Date.now();
    if (!block || block.number === null)
      return;
    const n = Number(block.number);
    this.deps.store.setStatus({ wsConnected: true, headBlock: Math.max(n, this.deps.store.status.headBlock) });
    this.blockTs.set(n, Number(block.timestamp));
    this.pruneMaps(n);
    if (this.live) {
      this.lastBlock = Math.max(this.lastBlock, n);
      this.deps.store.setStatus({ lastBlock: this.lastBlock });
    }
  }
  // ---- logs: the realtime data path ----
  onLogs(logs) {
    const applicable = [];
    for (const l of logs) {
      if (l.blockNumber === null || l.logIndex === null)
        continue;
      const addr = l.address.toLowerCase();
      if (!this.live || this.pendingPools.has(addr) || this.pendingMarketOf(addr)) {
        this.inbox.set(evKey(Number(l.blockNumber), l.logIndex), l);
      } else {
        applicable.push(l);
      }
    }
    if (applicable.length === 0)
      return;
    const events = applicable.map((l) => this.decode(l)).filter((e) => e !== null && !this.processed.has(evKey(e.blockNumber, e.logIndex))).sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    if (firstEvent === void 0 || lastEvent === void 0)
      return;
    this.deps.dbg.log("liveTail", "applying logs", {
      received: logs.length,
      applied: events.length,
      buffered: logs.length - applicable.length,
      fromBlock: firstEvent.blockNumber,
      toBlock: lastEvent.blockNumber
    });
    for (const ev of events) {
      applyEvent(ev, this.deps.store);
      this.processed.add(evKey(ev.blockNumber, ev.logIndex));
    }
    this.deps.store.prunePerPool();
    this.deps.store.commit();
    this.afterApply(events);
  }
  /**
   *  True when `addr` is a BinaryMarket contract whose POOL is mid-hydration —
   *  its status events must buffer with the rest of the scope.
   */
  pendingMarketOf(addr) {
    if (this.pendingPools.size === 0)
      return false;
    const id2 = this.deps.store.addressToMarket.get(addr);
    const m = id2 ? this.deps.store.markets.get(id2) : void 0;
    return !!m && this.pendingPools.has(m.poolAddress.toLowerCase());
  }
  /**
   *  If a batch created new markets (MarketCreated, discovery mode), grow the
   *  all-markets set + subscriptions and sweep the creation range so any
   *  same-block activity on the new pool isn't lost across the re-subscribe.
   */
  afterApply(events) {
    const created = events.filter((e) => e.eventName === "MarketCreated");
    if (created.length === 0 || this.allRefs === 0)
      return;
    for (const e of created) {
      const pool = e.args.pool.toLowerCase();
      this.allPools.add(pool);
      this.hydratedPools.add(pool);
    }
    this.ensureSubscriptions();
    const from = Math.min(...created.map((e) => e.blockNumber));
    const to = Math.max(this.lastBlock, this.deps.store.status.headBlock, from);
    void this.backfill(from, to, this.watchAddresses).catch(() => this.onWsError());
  }
  // ------------------------------------------------------------------
  // Backfill + replay
  // ------------------------------------------------------------------
  /** Fetch + reduce logs for `addresses` in [from, to] (chunked). */
  async backfill(from, to, addresses) {
    if (addresses.length === 0 || to < from)
      return;
    this.client ?? (this.client = this.deps.getClient());
    const raw = [];
    for (let start = from; start <= to; start += GETLOGS_CHUNK) {
      const end = Math.min(start + GETLOGS_CHUNK - 1, to);
      const logs = await this.client.getLogs({
        address: addresses,
        fromBlock: BigInt(start),
        toBlock: BigInt(end)
      });
      raw.push(...logs);
    }
    await this.applyLogs(raw);
  }
  /**
   *  Replay buffered logs past `after` for `scope` addresses (all, if omitted);
   *  other scopes' buffered logs stay queued.
   */
  async replayInbox(after, scope) {
    const pending = [];
    for (const [key, l] of this.inbox) {
      const addr = l.address.toLowerCase();
      if (scope && !scope.has(addr))
        continue;
      this.inbox.delete(key);
      if (l.blockNumber !== null && Number(l.blockNumber) > after)
        pending.push(l);
    }
    await this.applyLogs(pending);
  }
  /** Decode, timestamp, dedupe, order, and reduce a batch of raw logs. */
  async applyLogs(raw) {
    if (raw.length === 0)
      return;
    const need = /* @__PURE__ */ new Set();
    for (const l of raw) {
      const bn = l.blockNumber === null ? null : Number(l.blockNumber);
      if (bn !== null && !this.blockTs.has(bn))
        need.add(bn);
    }
    const client = this.client ?? (this.client = this.deps.getClient());
    await Promise.all([...need].map(async (bn) => {
      const b = await client.getBlock({ blockNumber: BigInt(bn), includeTransactions: false });
      this.blockTs.set(bn, Number(b.timestamp));
    }));
    const events = raw.map((l) => this.decode(l)).filter((e) => e !== null && !this.processed.has(evKey(e.blockNumber, e.logIndex))).sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
    for (const ev of events) {
      applyEvent(ev, this.deps.store);
      this.processed.add(evKey(ev.blockNumber, ev.logIndex));
    }
    this.deps.store.prunePerPool();
    this.deps.store.commit();
    this.afterApply(events);
  }
  decode(log) {
    if (log.blockNumber === null || log.logIndex === null)
      return null;
    const address = lower0x(log.address);
    if (!this.watchSet.has(address))
      return null;
    if (!isKnownTopic0(LIVE_TOPIC0, log.topics))
      return null;
    let decoded;
    try {
      decoded = decodeEventLog({ abi: liveEventsAbi, data: log.data, topics: log.topics });
    } catch {
      return null;
    }
    const bn = Number(log.blockNumber);
    return {
      ...decoded,
      address,
      blockNumber: bn,
      logIndex: log.logIndex,
      timestampSec: this.blockTs.get(bn) ?? Math.floor(Date.now() / 1e3),
      txHash: log.transactionHash ?? ""
    };
  }
  // ------------------------------------------------------------------
  // Reconnect — chain-only healing, no indexer
  // ------------------------------------------------------------------
  onWsError() {
    this.deps.store.setStatus({ wsConnected: false });
    this.live = false;
    this.scheduleReconnect();
  }
  // ---- heads watchdog: catches the error-less dead subscription ----
  startHeadsWatchdog() {
    if (this.headsWatchdog)
      return;
    this.lastHeadAt = Date.now();
    this.headsWatchdog = setInterval(() => void this.checkHeadsStall(), HEADS_STALL_MS);
  }
  stopHeadsWatchdog() {
    if (this.headsWatchdog)
      clearInterval(this.headsWatchdog);
    this.headsWatchdog = null;
  }
  /** No newHeads for HEADS_STALL_MS while live: probe the chain head over the
   *  request path. If the chain moved without the sub telling us, the sub is
   *  dead — run the WS-error healing path (which force-resubscribes). If even
   *  the probe fails, the socket itself is gone — same path. A chain that
   *  simply hasn't minted (idle anvil) is left alone. */
  async checkHeadsStall() {
    if (!this.live || this.reconnecting || this.probingHeads || !this.client)
      return;
    if (Date.now() - this.lastHeadAt < HEADS_STALL_MS)
      return;
    this.probingHeads = true;
    try {
      const head = Number(await this.client.getBlockNumber());
      if (head > this.lastBlock)
        this.onWsError();
    } catch {
      this.onWsError();
    } finally {
      this.probingHeads = false;
    }
  }
  scheduleReconnect() {
    if (this.retryTimer || this.activePools().size === 0)
      return;
    const delay = this.retryDelay;
    this.retryDelay = Math.min(this.retryDelay * 2, RECONNECT_MAX_MS);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.reconnect();
    }, delay);
  }
  /**
   *  Heal after a socket drop: resubscribe (buffering), backfill everything the
   *  store missed since `lastBlock` straight from chain, replay, go live. The
   *  indexer is NOT consulted — the store's own state is the seam.
   */
  async reconnect() {
    var _a, _b;
    if (this.reconnecting || this.activePools().size === 0)
      return;
    this.reconnecting = true;
    try {
      try {
        (_a = this.unwatchHeads) == null ? void 0 : _a.call(this);
      } catch {
      }
      try {
        (_b = this.unwatchLogs) == null ? void 0 : _b.call(this);
      } catch {
      }
      this.unwatchHeads = null;
      this.unwatchLogs = null;
      this.ensureSubscriptions();
      const client = this.client ?? (this.client = this.deps.getClient());
      const head = Number(await client.getBlockNumber());
      this.deps.store.setStatus({ wsConnected: true, headBlock: Math.max(head, this.deps.store.status.headBlock) });
      await this.backfill(this.lastBlock + 1, head, this.watchAddresses);
      this.lastBlock = Math.max(this.lastBlock, head);
      await this.replayInbox(this.lastBlock);
      this.markLive();
    } catch {
      this.scheduleReconnect();
    } finally {
      this.reconnecting = false;
    }
  }
  pruneMaps(headNum) {
    const floor = headNum - 200;
    if (this.blockTs.size > 250) {
      for (const k of this.blockTs.keys())
        if (k < floor)
          this.blockTs.delete(k);
    }
    if (this.processed.size > 4e3) {
      for (const key of this.processed)
        if (Number(key.split("_")[0]) < floor)
          this.processed.delete(key);
    }
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/activity.js
async function getMarketActivity(market, opts = {}, indexerUrl) {
  const marketId = market.toLowerCase();
  const limit = opts.limit ?? 50;
  const kinds = new Set(opts.kinds ?? ALL_ACTIVITY_KINDS);
  const routerKinds = ROUTER_KIND_BY_ACTIVITY_KIND.filter(([activityKind]) => kinds.has(activityKind)).map(([, routerKind]) => routerKind);
  const fillWhere = { market_id: { _eq: marketId } };
  if (opts.pool != null)
    fillWhere.pool = { _eq: opts.pool.toLowerCase() };
  const routerWhere = { market_id: { _eq: marketId } };
  if (routerKinds.length)
    routerWhere.kind = { _in: routerKinds };
  const resolutionWhere = { market_id: { _eq: marketId } };
  const statusWhere = { market_id: { _eq: marketId } };
  for (const where of [fillWhere, routerWhere, resolutionWhere, statusWhere]) {
    applyActivityWindow(where, opts);
  }
  const data = await gqlRequest(MarketActivityQuery, {
    fillWhere,
    routerWhere,
    resolutionWhere,
    statusWhere,
    fillLimit: kinds.has("TRADE") ? limit : 0,
    routerLimit: routerKinds.length ? limit : 0,
    resolutionLimit: kinds.has("RESOLUTION") ? limit : 0,
    statusLimit: kinds.has("STATUS") ? limit : 0
  }, indexerUrl);
  const rows = [
    ...data.Fill.map(toTradeActivity),
    // `kind` is a plain `String!` column the handlers only ever fill with the
    // three router verbs, so the mapper's lookup is total in practice. A row
    // whose verb is unknown is dropped rather than typed as one of them.
    ...data.RouterActionRecord.flatMap(toSupplyActivity),
    ...data.MarketResolutionEvent.map(toResolutionActivity),
    ...data.MarketStatusUpdate.map(toStatusActivity)
  ];
  return rows.sort(byNewestFirst).slice(0, limit);
}
async function getTransactionActivity(txHash, opts = {}, indexerUrl) {
  var _a, _b;
  const hash = txHash.toLowerCase();
  const limit = opts.limit ?? 100;
  const found = await gqlRequest(TransactionEventsQuery, { txHash: hash, limit }, indexerUrl);
  const events = [
    ...found.Fill.map(toTradeActivity),
    ...found.RouterActionRecord.flatMap(toSupplyActivity),
    ...found.MarketResolutionEvent.map(toResolutionActivity),
    ...found.MarketStatusUpdate.map(toStatusActivity)
  ].sort(byLogOrder);
  const [anchor] = events;
  const restingOrders = anchor === void 0 ? (await gqlRequest(TransactionOrderAnchorQuery, { txHash: hash, limit }, indexerUrl)).Order ?? [] : [];
  const anchorTimestamp = (anchor == null ? void 0 : anchor.timestamp) ?? ((_a = restingOrders[0]) == null ? void 0 : _a.placedAtTimestamp) ?? null;
  const anchorBlock = (anchor == null ? void 0 : anchor.blockNumber) ?? ((_b = restingOrders[0]) == null ? void 0 : _b.placedAtBlock) ?? null;
  if (anchorTimestamp === null || anchorBlock === null) {
    return {
      txHash: hash,
      blockNumber: null,
      timestamp: null,
      events: [],
      ordersPlaced: [],
      protocolFees: [],
      builderFees: [],
      markets: {}
    };
  }
  const marketIds = [
    .../* @__PURE__ */ new Set([...events.map((e) => e.market), ...restingOrders.map((o) => o.market_id)])
  ];
  const rest = await gqlRequest(
    TransactionContextQuery,
    // `orderLimit: 0` when the anchor probe already returned the orders: that
    // path ran the same `placedTxHash` predicate, which is not index-served, so
    // repeating it here would scan twice for one answer.
    { txHash: hash, timestamp: anchorTimestamp, marketIds, limit, orderLimit: restingOrders.length > 0 ? 0 : limit },
    indexerUrl
  );
  const markets = {};
  for (const row of toMarkets(rest.Market))
    markets[row.id] = row;
  return {
    txHash: hash,
    blockNumber: anchorBlock,
    timestamp: anchorTimestamp,
    events,
    ordersPlaced: (restingOrders.length > 0 ? restingOrders : rest.Order).map(toTransactionOrder),
    protocolFees: rest.ProtocolFeeRecord,
    builderFees: rest.BuilderFeeRecord,
    markets
  };
}
function toTransactionOrder(o) {
  return {
    id: o.id,
    orderId: o.orderId,
    market: o.market_id,
    owner: o.owner,
    isBid: o.isBid,
    side: o.side,
    price: o.price,
    fullQuantity: o.fullQuantity,
    filledQuantity: o.filledQuantity,
    quantityRemaining: o.quantityRemaining,
    status: o.status,
    rested: o.rested,
    cancelReason: o.cancelReason,
    placedAtTimestamp: o.placedAtTimestamp,
    placedTxHash: o.placedTxHash
  };
}
function byLogOrder(a, b) {
  if (a.blockNumber !== b.blockNumber)
    return Number(a.blockNumber) - Number(b.blockNumber);
  return logIndexOf(a) - logIndexOf(b);
}
var ALL_ACTIVITY_KINDS = [
  "TRADE",
  "MINT_SET",
  "MERGE_SET",
  "REDEEM",
  "RESOLUTION",
  "STATUS"
];
var ROUTER_KIND_BY_ACTIVITY_KIND = [
  ["MINT_SET", "MintCompleteSet"],
  ["MERGE_SET", "MergeCompleteSet"],
  ["REDEEM", "Redeem"]
];
var ACTIVITY_KIND_BY_ROUTER_KIND = /* @__PURE__ */ new Map([
  ["MintCompleteSet", "MINT_SET"],
  ["MergeCompleteSet", "MERGE_SET"],
  ["Redeem", "REDEEM"]
]);
function byNewestFirst(a, b) {
  if (a.timestamp !== b.timestamp)
    return Number(b.timestamp) - Number(a.timestamp);
  if (a.blockNumber !== b.blockNumber)
    return Number(b.blockNumber) - Number(a.blockNumber);
  return logIndexOf(b) - logIndexOf(a);
}
function logIndexOf(row) {
  const parsed = Number(row.id.slice(row.id.lastIndexOf("_") + 1));
  return Number.isFinite(parsed) ? parsed : 0;
}
function toTradeActivity(row) {
  var _a, _b;
  return {
    id: `TRADE:${row.id}`,
    kind: "TRADE",
    market: row.market,
    pool: row.pool,
    fillPrice: row.fillPrice,
    quantity: row.quantity,
    quoteQuantity: row.quoteQuantity,
    maker: row.maker,
    makerSide: row.makerSide,
    taker: ((_a = row.takerOrder) == null ? void 0 : _a.owner) ?? row.taker,
    takerSide: ((_b = row.takerOrder) == null ? void 0 : _b.side) ?? row.takerSide,
    takerIsBid: row.takerIsBid,
    blockNumber: row.blockNumber,
    timestamp: row.timestamp,
    txHash: row.txHash
  };
}
function toSupplyActivity(row) {
  const kind = ACTIVITY_KIND_BY_ROUTER_KIND.get(row.kind);
  if (kind === void 0)
    return [];
  return [
    {
      id: `${kind}:${row.id}`,
      kind,
      market: row.market,
      account: row.account,
      amount: row.amount,
      payout: row.payout,
      routedVia: row.routedVia,
      blockNumber: row.blockNumber,
      timestamp: row.timestamp,
      txHash: row.txHash
    }
  ];
}
function toResolutionActivity(row) {
  return {
    id: `RESOLUTION:${row.id}`,
    kind: "RESOLUTION",
    market: row.market,
    outcome: row.kind,
    outcomeIdx: row.outcomeIdx,
    voided: row.voided,
    blockNumber: row.blockNumber,
    timestamp: row.timestamp,
    txHash: row.txHash
  };
}
function toStatusActivity(row) {
  return {
    id: `STATUS:${row.id}`,
    kind: "STATUS",
    market: row.market,
    oldStatus: row.oldStatus,
    newStatus: row.newStatus,
    blockNumber: row.blockNumber,
    timestamp: row.timestamp,
    txHash: row.txHash
  };
}
function applyActivityWindow(where, opts) {
  const ts = {};
  if (opts.since != null)
    ts._gte = opts.since;
  if (opts.until != null)
    ts._lte = opts.until;
  if (Object.keys(ts).length)
    where.timestamp = ts;
  return where;
}
var ActivityFillFields = graphql(`
  fragment ActivityFillFields on Fill {
    id
    market: market_id
    pool
    fillPrice
    quantity
    quoteQuantity
    maker
    makerSide
    taker
    takerSide
    takerIsBid
    # The taker's ORDER, not only the denormalized copy on the fill: Fill.takerSide
    # is backfilled by the PendingTakerFill bridge and stays null on a binary row
    # until BinaryOrderPlaced lands, while the order names the side from the start.
    # Same precedence fills.ts documents on FillRow.takerOrder.
    takerOrder { owner side }
    blockNumber
    timestamp
    txHash
  }
`);
var ActivityRouterFields = graphql(`
  fragment ActivityRouterFields on RouterActionRecord {
    id
    kind
    market: market_id
    account
    amount
    payout
    routedVia
    blockNumber
    timestamp
    txHash
  }
`);
var ActivityResolutionFields = graphql(`
  fragment ActivityResolutionFields on MarketResolutionEvent {
    id
    kind
    market: market_id
    outcomeIdx
    voided
    blockNumber
    timestamp
    txHash
  }
`);
var ActivityStatusFields = graphql(`
  fragment ActivityStatusFields on MarketStatusUpdate {
    id
    market: market_id
    oldStatus
    newStatus
    blockNumber
    timestamp
    txHash
  }
`);
var MarketActivityQuery = graphql(`
  query MarketActivity(
         $fillWhere: Fill_bool_exp!
         $routerWhere: RouterActionRecord_bool_exp!
         $resolutionWhere: MarketResolutionEvent_bool_exp!
         $statusWhere: MarketStatusUpdate_bool_exp!
         $fillLimit: Int!
         $routerLimit: Int!
         $resolutionLimit: Int!
         $statusLimit: Int!
       ) {
         Fill(where: $fillWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {logIndex: desc}], limit: $fillLimit) {
           ...ActivityFillFields
         }
         RouterActionRecord(where: $routerWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}], limit: $routerLimit) {
           ...ActivityRouterFields
         }
         MarketResolutionEvent(where: $resolutionWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}], limit: $resolutionLimit) {
           ...ActivityResolutionFields
         }
         MarketStatusUpdate(where: $statusWhere, order_by: [{timestamp: desc}, {blockNumber: desc}, {id: desc}], limit: $statusLimit) {
           ...ActivityStatusFields
         }
       }
`);
var TransactionOrderFields = graphql(`
  fragment TransactionOrderFields on Order {
    id
    orderId
    market_id
    owner
    isBid
    side
    price
    fullQuantity
    filledQuantity
    quantityRemaining
    status
    rested
    cancelReason
    placedAtTimestamp
    placedTxHash
  }
`);
var TransactionEventsQuery = graphql(`
  query TransactionEvents($txHash: String!, $limit: Int!) {
         Fill(where: {txHash: {_eq: $txHash}}, order_by: {logIndex: asc}, limit: $limit) {
           ...ActivityFillFields
         }
         RouterActionRecord(where: {txHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {
           ...ActivityRouterFields
         }
         MarketResolutionEvent(where: {txHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {
           ...ActivityResolutionFields
         }
         MarketStatusUpdate(where: {txHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {
           ...ActivityStatusFields
         }
       }
`);
var TransactionOrderAnchorQuery = graphql(`
  query TransactionOrderAnchor($txHash: String!, $limit: Int!) {
         Order(where: {placedTxHash: {_eq: $txHash}}, order_by: {id: asc}, limit: $limit) {
           ...TransactionOrderFields
           placedAtBlock
         }
       }
`);
var TransactionContextQuery = graphql(`
  query TransactionContext($txHash: String!, $timestamp: numeric!, $marketIds: [String!]!, $limit: Int!, $orderLimit: Int!) {
         Order(
           where: {placedAtTimestamp: {_eq: $timestamp}, placedTxHash: {_eq: $txHash}}
           order_by: {id: asc}
           limit: $orderLimit
         ) {
           ...TransactionOrderFields
         }
         ProtocolFeeRecord(
           where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
           order_by: {id: asc}
           limit: $limit
         ) {
           ...ProtocolFeeFields
         }
         BuilderFeeRecord(
           where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
           order_by: {id: asc}
           limit: $limit
         ) {
           ...BuilderFeeFields
         }
         Market(where: {id: {_in: $marketIds}}) {
           ...MarketFields
         }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/fills.js
var FillQueryFields = graphql(`
  fragment FillQueryFields on Fill {
    id
    market: market_id
    pool
    fillPrice
    quantity
    quoteQuantity
    maker
    makerSide
    taker
    takerSide
    kind
    takerIsBid
    makerOrderId
    takerOrderId
    timestamp
    txHash
    # The taker's ORDER, not just the denormalized copy on the fill. On binary
    # the fill's takerSide is backfilled by the PendingTakerFill bridge only
    # once BinaryOrderPlaced lands, so it can still be null on a row whose
    # taker is already stamped. The Order carries the authoritative side from
    # the moment it exists, which is what the portfolio reads have always used.
    takerOrder { owner side }
  }
`);
async function getFills(pool, opts = {}, indexerUrl) {
  const where = applyFillWindow({ pool: { _eq: pool.toLowerCase() } }, opts);
  const data = await gqlRequest(FillsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Fill;
}
async function getUserFills(account, opts = {}, indexerUrl) {
  const acct = account.toLowerCase();
  const where = applyFillScope({ _or: participatedAs(acct) }, opts);
  const data = await gqlRequest(UserFillsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Fill;
}
async function getFill(id2, indexerUrl) {
  const data = await gqlRequest(FillDetailQuery, { id: id2 }, indexerUrl);
  const f = data.Fill[0];
  if (!f)
    return null;
  const { marketRef, ...rest } = f;
  return { ...rest, marketRef: narrowIndexerInvariant([marketRef])[0] };
}
async function getOrderFills(pool, orderId, opts = {}, indexerUrl) {
  const oid = orderId.toString();
  const data = await gqlRequest(OrderFillsQuery, { pool: pool.toLowerCase(), oid, limit: opts.limit ?? 200 }, indexerUrl);
  return data.Fill;
}
async function countUserFills(account, opts = {}, indexerUrl, headers) {
  const acct = account.toLowerCase();
  const where = applyFillScope({ _or: participatedAs(acct) }, opts);
  return aggregateCount("Fill", "Fill_bool_exp", where, indexerUrl, headers);
}
function participatedAs(acct) {
  return [{ maker: { _eq: acct } }, { taker: { _eq: acct } }];
}
function applyFillScope(where, opts) {
  const marketId = {};
  if (opts.market != null)
    marketId._eq = opts.market.toLowerCase();
  if (opts.markets != null)
    marketId._in = opts.markets.map((m) => m.toLowerCase());
  if (Object.keys(marketId).length)
    where.market_id = marketId;
  if (opts.pool != null)
    where.pool = { _eq: opts.pool.toLowerCase() };
  return applyFillWindow(where, opts);
}
function applyFillWindow(where, opts) {
  const ts = {};
  if (opts.since != null)
    ts._gte = opts.since;
  if (opts.until != null)
    ts._lte = opts.until;
  if (Object.keys(ts).length)
    where.timestamp = ts;
  return where;
}
async function getTradeContext(id2, indexerUrl) {
  const head = await gqlRequest(TradeContextQuery, { id: id2 }, indexerUrl);
  const row = head.Fill_by_pk;
  if (row == null)
    return null;
  const fill = toTradeFill(row);
  const rest = await gqlRequest(FillTxContextQuery, { timestamp: fill.timestamp, txHash: fill.txHash, market: fill.market, id: fill.id }, indexerUrl);
  return {
    fill,
    market: row.market == null ? null : toMarket(row.market),
    makerOrder: row.makerOrder == null ? null : toFillOrder(row.makerOrder),
    takerOrder: row.takerOrder == null ? null : toFillOrder(row.takerOrder),
    siblings: rest.Fill.map(toTradeFill),
    protocolFees: rest.ProtocolFeeRecord,
    builderFees: rest.BuilderFeeRecord
  };
}
function toTradeFill(r) {
  return {
    id: r.id,
    market: r.market_id,
    pool: r.pool,
    makerOrderId: r.makerOrderId,
    takerOrderId: r.takerOrderId,
    takerRemainingQuantity: r.takerRemainingQuantity,
    makerRemainingQuantity: r.makerRemainingQuantity,
    fillPrice: r.fillPrice,
    quantity: r.quantity,
    quoteQuantity: r.quoteQuantity,
    maker: r.maker,
    makerSide: r.makerSide,
    taker: r.taker,
    takerSide: r.takerSide,
    kind: r.kind,
    takerIsBid: r.takerIsBid,
    takerOrder: r.takerOrder == null ? null : { owner: r.takerOrder.owner, side: r.takerOrder.side },
    timestamp: r.timestamp,
    txHash: r.txHash,
    blockNumber: r.blockNumber,
    logIndex: r.logIndex
  };
}
function toFillOrder(o) {
  return {
    id: o.id,
    orderId: o.orderId,
    owner: o.owner,
    isBid: o.isBid,
    side: o.side,
    price: o.price,
    fullQuantity: o.fullQuantity,
    filledQuantity: o.filledQuantity,
    quantityRemaining: o.quantityRemaining,
    status: o.status,
    rested: o.rested,
    cancelReason: o.cancelReason,
    placedAtTimestamp: o.placedAtTimestamp,
    placedTxHash: o.placedTxHash
  };
}
var FillsQuery = graphql(`
  query Fills($where: Fill_bool_exp!, $limit: Int, $offset: Int) {
        Fill(where: $where, order_by: [{timestamp: desc}, {blockNumber: desc}], limit: $limit, offset: $offset) {
          ...FillQueryFields
        }
      }
`);
var UserFillsQuery = graphql(`
  query UserFills($where: Fill_bool_exp!, $limit: Int, $offset: Int) {
        Fill(where: $where, order_by: [{timestamp: desc}, {blockNumber: desc}], limit: $limit, offset: $offset) {
          ...FillQueryFields
        }
      }
`);
var MarketRefFields = graphql(`
  fragment MarketRefFields on Market {
    id marketType poolAddress marketAddress baseSymbol quoteSymbol
    baseDecimals quoteDecimals asset question
  }
`);
var FillDetailQuery = graphql(`
  query FillDetail($id: String!) {
        Fill(where: { id: { _eq: $id } }, limit: 1) {
          ...FillQueryFields
          takerRemainingQuantity makerRemainingQuantity
          blockNumber logIndex
          marketRef: market { ...MarketRefFields }
        }
      }
`);
var OrderFillsQuery = graphql(`
  query OrderFills($pool: String!, $oid: numeric!, $limit: Int) {
        Fill(
          where: { pool: { _eq: $pool }, _or: [{ takerOrderId: { _eq: $oid } }, { makerOrderId: { _eq: $oid } }] }
          order_by: [{timestamp: desc}, {blockNumber: desc}]
          limit: $limit
        ) {
          ...FillQueryFields
          takerRemainingQuantity makerRemainingQuantity
          blockNumber logIndex
        }
      }
`);
var TradeContextFillFields = graphql(`
  fragment TradeContextFillFields on Fill {
    id
    market_id
    pool
    fillPrice
    quantity
    quoteQuantity
    maker
    makerSide
    taker
    takerSide
    kind
    takerIsBid
    takerOrder { owner side }
    makerOrderId
    takerOrderId
    takerRemainingQuantity
    makerRemainingQuantity
    blockNumber
    timestamp
    logIndex
    txHash
  }
`);
var FillOrderFields = graphql(`
  fragment FillOrderFields on Order {
    id
    orderId
    owner
    isBid
    side
    price
    fullQuantity
    filledQuantity
    quantityRemaining
    status
    rested
    cancelReason
    placedAtTimestamp
    placedTxHash
  }
`);
var TradeContextQuery = graphql(`
  query TradeContext($id: String!) {
         Fill_by_pk(id: $id) {
           ...TradeContextFillFields
           market { ...MarketFields }
           makerOrder { ...FillOrderFields }
           takerOrder { ...FillOrderFields }
         }
       }
`);
var FillTxContextQuery = graphql(`
  query FillTxContext($timestamp: numeric!, $txHash: String!, $market: String!, $id: String!) {
         Fill(
           where: {timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}, id: {_neq: $id}}
           order_by: [{blockNumber: desc}, {logIndex: desc}]
           limit: 100
         ) {
           ...TradeContextFillFields
         }
         ProtocolFeeRecord(
           where: {market_id: {_eq: $market}, timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
           order_by: {id: asc}
           limit: 100
         ) {
           ...ProtocolFeeFields
         }
         BuilderFeeRecord(
           where: {market_id: {_eq: $market}, timestamp: {_eq: $timestamp}, txHash: {_eq: $txHash}}
           order_by: {id: asc}
           limit: 100
         ) {
           ...BuilderFeeFields
         }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/systemAbi.js
var binaryModuleReadAbi2 = parseAbi([
  "function clobFactory() view returns (address)",
  // The wired BinarySettlement singleton (settlement-extraction v2; zero pre-wire).
  "function settlement() view returns (address)"
]);
var clobFactoryReadAbi = parseAbi(["function binaryMarketImpl() view returns (address)"]);
var marketCreatorReadAbi = parseAbi([
  "function marketCount() view returns (uint256)",
  "function owner() view returns (address)",
  "function reactivityGasLimit() view returns (uint64)",
  "function reactivityMaxFeePerGas() view returns (uint64)",
  "function reactivityPriorityFeePerGas() view returns (uint64)",
  "function operatorId() view returns (uint32)",
  "function venueId() view returns (bytes32)"
]);
var fakeOracleReadAbi = parseAbi([
  "function owner() view returns (address)",
  "function RECEIVER() view returns (address)"
]);
var erc20MetaAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
]);

// node_modules/@somnia-chain/markets-sdk/dist/system.js
async function safe(p) {
  try {
    return await p;
  } catch {
    return null;
  }
}
async function getSystemInfo(client, addresses) {
  const a = addresses;
  const pc = client;
  const liveFactory = a.binaryModule ? await safe(pc.readContract({ address: a.binaryModule, abi: binaryModuleReadAbi2, functionName: "clobFactory" })) : null;
  const clobFactory = liveFactory ?? a.clobFactory ?? null;
  const factoryMismatch = !!liveFactory && !!a.clobFactory && liveFactory.toLowerCase() !== a.clobFactory.toLowerCase();
  const liveSettlementRaw = a.binaryModule ? await safe(pc.readContract({ address: a.binaryModule, abi: binaryModuleReadAbi2, functionName: "settlement" })) : null;
  const liveSettlement = liveSettlementRaw && !/^0x0{40}$/.test(liveSettlementRaw) ? liveSettlementRaw : null;
  const settlement = liveSettlement ?? a.binarySettlement ?? null;
  const settlementMismatch = !!liveSettlement && !!a.binarySettlement && liveSettlement.toLowerCase() !== a.binarySettlement.toLowerCase();
  const liveImpl = clobFactory ? await safe(pc.readContract({ address: clobFactory, abi: clobFactoryReadAbi, functionName: "binaryMarketImpl" })) : null;
  const binaryMarketImpl = liveImpl ?? null;
  let marketCreator = null;
  if (a.marketCreator) {
    const mc = { address: a.marketCreator, abi: marketCreatorReadAbi };
    const [marketCount, owner, gasLimit, maxFee, prioFee, operatorId, venueId] = await Promise.all([
      safe(pc.readContract({ ...mc, functionName: "marketCount" })),
      safe(pc.readContract({ ...mc, functionName: "owner" })),
      safe(pc.readContract({ ...mc, functionName: "reactivityGasLimit" })),
      safe(pc.readContract({ ...mc, functionName: "reactivityMaxFeePerGas" })),
      safe(pc.readContract({ ...mc, functionName: "reactivityPriorityFeePerGas" })),
      safe(pc.readContract({ ...mc, functionName: "operatorId" })),
      safe(pc.readContract({ ...mc, functionName: "venueId" }))
    ]);
    marketCreator = {
      marketCount: marketCount ?? 0n,
      owner: owner ?? null,
      reactivityGasLimit: gasLimit ?? 0n,
      reactivityMaxFeePerGas: maxFee ?? 0n,
      reactivityPriorityFeePerGas: prioFee ?? 0n,
      operatorId: Number(operatorId ?? 0),
      venueId: (venueId ?? `0x${"00".repeat(32)}`).toLowerCase()
    };
  }
  let oracle = null;
  if (a.fakeOracle) {
    const fo = { address: a.fakeOracle, abi: fakeOracleReadAbi };
    const [owner, binaryModule] = await Promise.all([
      safe(pc.readContract({ ...fo, functionName: "owner" })),
      safe(pc.readContract({ ...fo, functionName: "RECEIVER" }))
    ]);
    oracle = { owner: owner ?? null, binaryModule: binaryModule ?? null };
  }
  let usdc = null;
  const collateral = a.collateral ?? a.testUsdc;
  if (collateral) {
    const tu = { address: collateral, abi: erc20MetaAbi };
    const [symbol, decimals] = await Promise.all([
      safe(pc.readContract({ ...tu, functionName: "symbol" })),
      safe(pc.readContract({ ...tu, functionName: "decimals" }))
    ]);
    usdc = {
      symbol: symbol ?? null,
      decimals: decimals == null ? null : Number(decimals)
    };
  }
  return { clobFactory, binaryMarketImpl, factoryMismatch, settlement, settlementMismatch, marketCreator, oracle, usdc };
}
async function getNativeBalance(address, client) {
  return client.getBalance({ address });
}
async function getTransactionSummary(hash, client) {
  var _a;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash))
    return null;
  try {
    const h = hash;
    const [tx, receipt] = await Promise.all([
      client.getTransaction({ hash: h }),
      client.getTransactionReceipt({ hash: h })
    ]);
    return {
      from: tx.from.toLowerCase(),
      to: ((_a = tx.to) == null ? void 0 : _a.toLowerCase()) ?? null,
      nonce: tx.nonce,
      status: receipt.status,
      gasUsed: receipt.gasUsed,
      gasLimit: tx.gas,
      effectiveGasPrice: receipt.effectiveGasPrice,
      feeWei: receipt.gasUsed * receipt.effectiveGasPrice,
      value: tx.value,
      logCount: receipt.logs.length
    };
  } catch {
    return null;
  }
}

// node_modules/@somnia-chain/markets-sdk/dist/networkTape.js
var topicOf = (name) => toEventSelector(getAbiItem({ abi: orderBookEventsAbi, name }));
var PLACED_TOPIC = topicOf("OrderPlaced");
var FILLED_TOPIC = topicOf("OrderFilled");
var DEFAULT_MAX_ROWS = 60;
var DEFAULT_OWNER_MAP_CAP = 2e4;
var RATE_WINDOW_MS = 5e3;
var HEADS_STALL_MS2 = 15e3;
var RECONNECT_BASE_MS2 = 500;
var RECONNECT_MAX_MS2 = 8e3;
var NetworkTape = class {
  /** @internal Use {@link SomniaMarketsClient.createNetworkTape}. */
  constructor(wsUrl, opts = {}) {
    __publicField(this, "wsUrl");
    /** Newest-first ring buffer of bid placements (capped at `maxRows`). */
    __publicField(this, "bids", []);
    /** Newest-first ring buffer of fills. */
    __publicField(this, "fills", []);
    /** Newest-first ring buffer of ask placements. */
    __publicField(this, "asks", []);
    __publicField(this, "maxRows");
    __publicField(this, "ownerMapCap");
    __publicField(this, "ws", null);
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "notifyScheduled", false);
    __publicField(this, "owners", /* @__PURE__ */ new Map());
    __publicField(this, "pools", /* @__PURE__ */ new Set());
    __publicField(this, "connected", false);
    __publicField(this, "closed", true);
    __publicField(this, "lastBlock", 0);
    __publicField(this, "lastHeadAt", 0);
    __publicField(this, "reconnectDelay", RECONNECT_BASE_MS2);
    __publicField(this, "reconnectTimer", null);
    __publicField(this, "stallTimer", null);
    __publicField(this, "probeId", null);
    __publicField(this, "rpcId", 1);
    __publicField(this, "bidTimes", []);
    __publicField(this, "fillTimes", []);
    __publicField(this, "askTimes", []);
    this.wsUrl = wsUrl;
    this.maxRows = opts.maxRows ?? DEFAULT_MAX_ROWS;
    this.ownerMapCap = opts.ownerMapCap ?? DEFAULT_OWNER_MAP_CAP;
  }
  /**
   *  Register a listener (fired, microtask-coalesced, after each applied batch —
   *  read the row buffers in it). The FIRST subscription opens the socket; the
   *  returned unsubscribe closes it again when it releases the last one.
   */
  subscribe(listener) {
    this.listeners.add(listener);
    if (this.listeners.size === 1)
      this.start();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0)
        this.stop();
    };
  }
  getStatus() {
    const now = Date.now();
    const rate = (times) => times.filter((t) => now - t < RATE_WINDOW_MS).length / (RATE_WINDOW_MS / 1e3);
    return {
      connected: this.connected,
      lastBlock: this.lastBlock,
      poolsSeen: this.pools.size,
      bidRate: rate(this.bidTimes),
      fillRate: rate(this.fillTimes),
      askRate: rate(this.askTimes)
    };
  }
  /* ---- lifecycle ---- */
  start() {
    if (typeof WebSocket === "undefined")
      return;
    this.closed = false;
    this.connect();
    this.stallTimer = setInterval(() => this.checkStall(), HEADS_STALL_MS2 / 3);
  }
  stop() {
    this.closed = true;
    if (this.reconnectTimer)
      clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.stallTimer)
      clearInterval(this.stallTimer);
    this.stallTimer = null;
    this.teardownSocket();
    this.connected = false;
  }
  connect() {
    if (this.closed || this.ws)
      return;
    let ws;
    try {
      ws = new WebSocket(this.wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      if (this.ws !== ws)
        return;
      this.connected = true;
      this.reconnectDelay = RECONNECT_BASE_MS2;
      this.lastHeadAt = Date.now();
      this.send(ws, "eth_subscribe", ["logs", { topics: [[PLACED_TOPIC, FILLED_TOPIC]] }]);
      this.send(ws, "eth_subscribe", ["newHeads"]);
      this.notify();
    };
    ws.onmessage = (e) => {
      if (this.ws !== ws)
        return;
      this.onMessage(String(e.data));
    };
    ws.onclose = () => {
      if (this.ws !== ws)
        return;
      this.ws = null;
      this.connected = false;
      this.probeId = null;
      this.notify();
      this.scheduleReconnect();
    };
    ws.onerror = () => {
    };
  }
  teardownSocket() {
    this.probeId = null;
    const ws = this.ws;
    this.ws = null;
    if (!ws)
      return;
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
    try {
      ws.close();
    } catch {
    }
  }
  scheduleReconnect() {
    if (this.closed || this.reconnectTimer)
      return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS2);
  }
  // A Somnia WS sub can die with the socket still answering requests. Heads
  // land multiple times per second, so silence + a moving chain head is
  // unambiguous; a quiet chain (idle local anvil) is ruled out by the probe.
  checkStall() {
    if (!this.connected || this.probeId !== null || Date.now() - this.lastHeadAt < HEADS_STALL_MS2)
      return;
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN)
      return;
    this.probeId = this.send(ws, "eth_blockNumber", []);
  }
  onProbeResult(headHex) {
    const head = Number.parseInt(headHex, 16);
    if (this.lastBlock === 0 && Number.isFinite(head)) {
      this.lastBlock = head;
      this.lastHeadAt = Date.now();
      return;
    }
    if (Number.isFinite(head) && head > this.lastBlock) {
      this.teardownSocket();
      this.connected = false;
      this.notify();
      this.scheduleReconnect();
    } else {
      this.lastHeadAt = Date.now();
    }
  }
  send(ws, method, params) {
    const id2 = this.rpcId++;
    ws.send(JSON.stringify({ jsonrpc: "2.0", id: id2, method, params }));
    return id2;
  }
  /* ---- inbound ---- */
  onMessage(raw) {
    var _a;
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.id != null && msg.id === this.probeId) {
      this.probeId = null;
      if (typeof msg.result === "string")
        this.onProbeResult(msg.result);
      return;
    }
    if (msg.method !== "eth_subscription")
      return;
    const result2 = (_a = msg.params) == null ? void 0 : _a.result;
    if (!result2)
      return;
    if (typeof result2.number === "string") {
      this.lastHeadAt = Date.now();
      const n = Number.parseInt(result2.number, 16);
      if (Number.isFinite(n) && n > this.lastBlock) {
        this.lastBlock = n;
        this.notify();
      }
      return;
    }
    if (Array.isArray(result2.topics))
      this.onLog(result2);
  }
  onLog(log) {
    let decoded;
    try {
      decoded = decodeEventLog({
        abi: orderBookEventsAbi,
        data: log.data,
        topics: log.topics
      });
    } catch {
      return;
    }
    const pool = log.address.toLowerCase();
    const blockNumber = Number.parseInt(log.blockNumber, 16) || this.lastBlock;
    const logIndex = Number.parseInt(log.logIndex, 16) || 0;
    const key = `${blockNumber}_${logIndex}_${pool}`;
    const at = Date.now();
    this.pools.add(pool);
    if (decoded.eventName === "OrderPlaced") {
      const o = decoded.args.placedOrder;
      const owner = o.owner.toLowerCase();
      this.rememberOwner(pool, o.orderId, owner);
      this.patchFills(pool, o.orderId, owner);
      const row = {
        key,
        pool,
        orderId: o.orderId,
        owner,
        isBid: o.isBid,
        price: o.price,
        quantity: o.fullQuantity,
        blockNumber,
        logIndex,
        at
      };
      if (o.isBid) {
        this.bids = [row, ...this.bids].slice(0, this.maxRows);
        this.pushTime(this.bidTimes, at);
      } else {
        this.asks = [row, ...this.asks].slice(0, this.maxRows);
        this.pushTime(this.askTimes, at);
      }
    } else if (decoded.eventName === "OrderFilled") {
      const a = decoded.args;
      this.fills = [
        {
          key,
          pool,
          takerOrderId: a.takerOrderId,
          makerOrderId: a.makerOrderId,
          price: a.fillPrice,
          quantity: a.quantityFilled,
          taker: this.owners.get(`${pool}_${a.takerOrderId}`) ?? null,
          maker: this.owners.get(`${pool}_${a.makerOrderId}`) ?? null,
          blockNumber,
          logIndex,
          at
        },
        ...this.fills
      ].slice(0, this.maxRows);
      this.pushTime(this.fillTimes, at);
    } else {
      return;
    }
    this.notify();
  }
  rememberOwner(pool, orderId, owner) {
    if (this.owners.size >= this.ownerMapCap) {
      const oldest = this.owners.keys().next().value;
      if (oldest !== void 0)
        this.owners.delete(oldest);
    }
    this.owners.set(`${pool}_${orderId}`, owner);
  }
  patchFills(pool, orderId, owner) {
    for (const f of this.fills) {
      if (f.pool !== pool)
        continue;
      if (f.taker === null && f.takerOrderId === orderId)
        f.taker = owner;
      if (f.maker === null && f.makerOrderId === orderId)
        f.maker = owner;
    }
  }
  pushTime(times, at) {
    times.push(at);
    while (times.length > 0 && at - times[0] > RATE_WINDOW_MS * 2)
      times.shift();
  }
  notify() {
    if (this.notifyScheduled)
      return;
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      for (const l of this.listeners)
        l();
    });
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/testnet.js
async function resolve(w, p) {
  const fakeOracle = p.fakeOracle ?? w.addresses().fakeOracle;
  if (!fakeOracle)
    throw new NotConfiguredError("w.addresses.fakeOracle", "resolve()");
  return w.execute({
    address: fakeOracle,
    abi: fakeOracleAbi,
    functionName: "resolve",
    args: [p.market, p.outcomeIdx],
    gas: p.gas ?? w.defaultGas
  });
}
async function voidMarket(w, p) {
  const fakeOracle = p.fakeOracle ?? w.addresses().fakeOracle;
  if (!fakeOracle)
    throw new NotConfiguredError("w.addresses.fakeOracle", "voidMarket()");
  return w.execute({
    address: fakeOracle,
    abi: fakeOracleAbi,
    functionName: "voidMarket",
    args: [p.market],
    gas: p.gas ?? w.defaultGas
  });
}
async function faucet(w, p = {}) {
  const a = w.addresses();
  const testUsdc = p.testUsdc ?? a.collateral ?? a.testUsdc;
  if (!testUsdc)
    throw new NotConfiguredError("w.addresses.collateral (or testUsdc)", "faucet()");
  const amount = p.amount ?? 10000n * w.oneBase;
  return w.execute({
    address: testUsdc,
    abi: testUsdcAbi,
    functionName: "faucet",
    args: [amount],
    gas: p.gas ?? w.defaultGas
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/vault/funding.js
var NATIVE_TOKEN_SENTINEL = "0x28f34DeFd2b4CB48d9eE6d89f2Be4Bc601694c00";
async function depositVault(w, p) {
  if (p.amount <= 0n)
    throw new InvalidInputError("amount must be > 0");
  if (p.token.toLowerCase() === NATIVE_TOKEN_SENTINEL.toLowerCase()) {
    throw new InvalidInputError("deposit does not take the native sentinel — use depositVaultNative (the vault reverts UseDepositNative)");
  }
  const gas = p.gas ?? w.defaultGas;
  await w.approveIfNeeded(p.token, p.vault, p.amount, gas);
  return w.execute({
    address: p.vault,
    abi: erc20VaultWriteAbi,
    functionName: "deposit",
    args: [p.token, p.amount],
    gas
  });
}
async function depositVaultNative(w, p) {
  if (p.amount <= 0n)
    throw new InvalidInputError("amount must be > 0");
  const gas = p.gas ?? w.defaultGas;
  const collateral = await w.publicClient.readContract({ address: p.vault, abi: binaryPoolTokensAbi, functionName: "collateralToken" }).catch(() => void 0);
  if (collateral !== void 0 && collateral.toLowerCase() !== NATIVE_TOKEN_SENTINEL.toLowerCase()) {
    throw new InvalidInputError(`pool ${p.vault} does not accept native deposits — its vault token is ${collateral}. Use depositVault with that token, or a pool whose base/quote is native.`);
  }
  return w.execute({
    address: p.vault,
    abi: erc20VaultWriteAbi,
    ...p.owner ? { functionName: "depositNativeFor", args: [p.owner] } : { functionName: "depositNative", args: [] },
    value: p.amount,
    gas
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/binary/sets.js
async function mintSet(w, p) {
  const gas = p.gas ?? w.defaultGas;
  const collateral = await w.poolCollateral(p.pool, p.collateral);
  if (p.autoApprove !== false)
    await w.approveIfNeeded(collateral, p.pool, p.amount, gas);
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "mintSet",
    args: [w.fromAddress, w.fromAddress, p.amount],
    gas
  });
}
async function burnSet(w, p) {
  const gas = p.gas ?? w.defaultGas;
  if (p.autoApprove !== false) {
    const outcomeToken = p.outcomeToken ?? (await w.poolTokens(p.pool)).outcomeToken;
    await w.ensureOperator(outcomeToken, p.pool, gas);
  }
  return w.execute({
    address: p.pool,
    abi: binaryPoolWriteAbi,
    functionName: "burnSet",
    args: [p.amount],
    gas
  });
}
async function mintSetNative(w, p) {
  const router = w.resolveRouter(p.router);
  return w.execute({
    address: router,
    abi: collateralRouterWriteAbi,
    functionName: "mintCompleteSetNative",
    args: [p.operatorId, p.venueId, p.marketId],
    gas: p.gas ?? w.defaultGas,
    value: p.amount
  });
}
async function mintSetPermit2(w, p) {
  const router = w.resolveRouter(p.router);
  return w.execute({
    address: router,
    abi: collateralRouterWriteAbi,
    functionName: "mintCompleteSetPermit2",
    args: [
      p.operatorId,
      p.venueId,
      p.marketId,
      p.amount,
      {
        permitted: { token: p.permit.permitted.token, amount: p.permit.permitted.amount },
        nonce: p.permit.nonce,
        deadline: p.permit.deadline
      },
      p.signature
    ],
    gas: p.gas ?? w.defaultGas
  });
}

// node_modules/@somnia-chain/markets-sdk/dist/trade.js
var ORDER_TYPE = {
  /** 0 — NormalOrder: fill what crosses, rest the remainder on the book. */
  LIMIT: 0,
  /** 1 — FillOrKill: fill the full quantity immediately, or place nothing. */
  FILL_OR_KILL: 1,
  /** 2 — ImmediateOrCancel: fill what crosses now, cancel the remainder. */
  MARKET: 2,
  /** 3 — PostOnly: rest only — never takes liquidity. */
  POST_ONLY: 3
};
var SELF_MATCHING_OPTION = {
  /** 0 — cancel the remaining taker quantity, leave the maker resting. */
  CANCEL_TAKER: 0,
  /** 1 — cancel the full maker order, let the taker continue. */
  CANCEL_MAKER: 1
};
function createTraderWithDeps(config, deps) {
  const w = createWriter(config, deps);
  const { clearApprovalCache, resolveModule, resolveSettlement, publicClient, dbg } = w;
  const trader = {
    placeOrder: (p) => placeOrder(w, p),
    approveBuilder: (p) => approveBuilder(w, p),
    getBuilderApproval: (ref) => getBuilderApproval(ref, publicClient),
    getEffectiveBuilderApproval: (ref) => getEffectiveBuilderApproval(ref, publicClient),
    async getMaxBuilderFeeBpsTimes1k(pool) {
      return await publicClient.readContract({
        address: pool,
        abi: binaryPoolWriteAbi,
        functionName: "getMaxBuilderFeeBpsTimes1k"
      });
    },
    cancelOrder: (p) => cancelOrder(w, p),
    reduceOrder: (p) => reduceOrder(w, p),
    cancelExpiredOrders: (p) => cancelExpiredOrders(w, p),
    sweepExpiredAtLevel: (p) => sweepExpiredAtLevel(w, p),
    captureClose: (p) => captureClose(w, p),
    placeSpotOrder: (p) => placeSpotOrder(w, p),
    placeSpotOrders: (p) => placeSpotOrders(w, p),
    cancelOrders: (p) => cancelOrders(w, p),
    reduceOrders: (p) => reduceOrders(w, p),
    placePerpOrder: (p) => placePerpOrder(w, p),
    buildPlaceOrder: (p) => buildPlaceOrder(w, p),
    buildPlaceSpotOrder: (p) => buildPlaceSpotOrder(w, p),
    buildPlacePerpOrder: (p) => buildPlacePerpOrder(w, p),
    amendOrder: (p) => amendOrder(w, p),
    amendOrders: (p) => amendOrders(w, p),
    depositMargin: (p) => depositMargin(w, p),
    withdrawMargin: (p) => withdrawMargin(w, p),
    withdrawVault: (p) => withdrawVault(w, p),
    depositVault: (p) => depositVault(w, p),
    depositVaultNative: (p) => depositVaultNative(w, p),
    depositVaultNativeFor: (p) => depositVaultNative(w, p),
    setManualVaultMode: (p) => setManualVaultMode(w, p),
    setOperatorApprovalForPool: (p) => setOperatorApprovalForPool(w, p),
    setOperatorApprovalGlobal: (p) => setOperatorApprovalGlobal(w, p),
    setPerpLeverage: (p) => setPerpLeverage(w, p),
    pokeFunding: (p) => pokeFunding(w, p),
    placeSpotStopOrder: (p) => placeSpotStopOrder(w, p),
    cancelStopOrder: (p) => cancelStopOrder(w, p),
    placePerpStopOrder: (p) => placePerpStopOrder(w, p),
    linkPerpStopOrders: (p) => linkPerpStopOrders(w, p),
    cancelPerpStopOrder: (p) => cancelPerpStopOrder(w, p),
    cancelPerpStopOrders: (p) => cancelPerpStopOrders(w, p),
    claimPerpStopSomi: (p) => claimPerpStopSomi(w, p),
    buildPlacePerpStopOrder: (p) => buildPlacePerpStopOrder(w, p),
    buildCancelPerpStopOrder: (p) => buildCancelPerpStopOrder(w, p),
    buildCancelPerpStopOrders: (p) => buildCancelPerpStopOrders(w, p),
    buildDepositMargin: (p) => buildDepositMargin(w, p),
    buildWithdrawMargin: (p) => buildWithdrawMargin(w, p),
    mintSet: (p) => mintSet(w, p),
    burnSet: (p) => burnSet(w, p),
    redeem: (p) => redeem(w, p),
    signRedeemAuth: (p) => signRedeemAuth(w, p),
    redeemFor: (p) => redeemFor(w, p),
    redeemMany: (p) => redeemMany(w, p),
    redeemDirect: (p) => redeemDirect(w, p),
    claimOwed: (p) => claimOwed(w, p),
    pokeOracle: (p) => pokeOracle(w, p),
    voidExpired: (p) => voidExpired(w, p),
    finalizeMarket: (p) => finalizeMarket(w, p),
    syncSettlement: (p) => syncSettlement(w, p),
    releasePool: (p) => releasePool(w, p),
    async getSettlement(marketId, opts) {
      const module = resolveModule(opts == null ? void 0 : opts.module);
      const settlement = resolveSettlement(opts == null ? void 0 : opts.settlement);
      const rec = await publicClient.readContract({
        address: module,
        abi: binaryModuleReadAbi,
        functionName: "markets",
        args: [marketId]
      });
      const yesId = rec[10];
      if (yesId === 0n)
        return null;
      const key = marketKey(yesId);
      const s = await publicClient.readContract({
        address: settlement,
        abi: binarySettlementAbi,
        functionName: "getSettlement",
        args: [key]
      });
      if (!s.finalized)
        return null;
      const payoutNumerators = [...s.payoutNumerators];
      let winningOutcome = 0;
      for (let i = 1; i < payoutNumerators.length; i++) {
        if ((payoutNumerators[i] ?? 0n) > (payoutNumerators[winningOutcome] ?? 0n))
          winningOutcome = i;
      }
      return {
        collateralToken: s.collateralToken,
        backing: s.backing,
        finalized: s.finalized,
        voided: s.voided,
        winningOutcome,
        payoutNumerators,
        settlementFeeBpsTimes1k: s.settlementFeeBpsTimes1k,
        feeRecipient: s.feeRecipient,
        pool: s.pool,
        nonce: s.nonce
      };
    },
    async getFreePools(creator, collateral, opts) {
      const pools = await publicClient.readContract({
        address: resolveModule(opts == null ? void 0 : opts.module),
        abi: binaryModuleReadAbi,
        functionName: "getFreePools",
        args: [creator, collateral]
      });
      return [...pools];
    },
    async poolCreator(pool, opts) {
      return await publicClient.readContract({
        address: resolveModule(opts == null ? void 0 : opts.module),
        abi: binaryModuleReadAbi,
        functionName: "poolCreator",
        args: [pool]
      });
    },
    mintSetNative: (p) => mintSetNative(w, p),
    mintSetPermit2: (p) => mintSetPermit2(w, p),
    redeemNative: (p) => redeemNative(w, p),
    faucet: (p = {}) => faucet(w, p),
    resolve: (p) => resolve(w, p),
    voidMarket: (p) => voidMarket(w, p),
    poke: (p) => poke(w, p),
    clearApprovalCache
  };
  return dbg.tracedObject("trader", trader);
}

// node_modules/@somnia-chain/markets-sdk/dist/machineryWriter.js
function makeMachineryWriter(config, deps, label) {
  const defaultGas = config.gas ?? DEFAULT_GAS;
  const { chain } = deps.getConfig();
  const fees = deps.getConfig().fees;
  const { localAccount, walletClient, from } = resolveSigner(config, label);
  const wallet = () => walletClient ?? unreachable("no external wallet client after signer validation");
  const publicClient = config.publicClient ?? deps.getClient();
  const waitReceipt = (hash) => waitReceiptViaHeads(publicClient, hash);
  async function execute(w) {
    const gas = w.gas ?? defaultGas;
    const value = w.value ?? 0n;
    const data = w.abi && w.functionName ? encodeFunctionData({ abi: w.abi, functionName: w.functionName, args: w.args ?? [] }) : void 0;
    let hash;
    if (localAccount) {
      const nonce = await publicClient.getTransactionCount({ address: localAccount.address, blockTag: "pending" });
      const signed = await localAccount.signTransaction({
        type: "eip1559",
        chainId: chain.id,
        to: w.to,
        value,
        ...data ? { data } : {},
        gas,
        nonce,
        maxFeePerGas: (fees == null ? void 0 : fees.maxFeePerGas) ?? DEFAULT_FEES.maxFeePerGas,
        maxPriorityFeePerGas: (fees == null ? void 0 : fees.maxPriorityFeePerGas) ?? DEFAULT_FEES.maxPriorityFeePerGas
      });
      const receipt2 = await broadcastSigned(publicClient, signed, {
        label: "@somnia-chain/markets-sdk",
        retryCount: 0,
        waitReceipt
      });
      return { hash: receipt2.transactionHash, receipt: receipt2 };
    }
    if (data) {
      hash = await wallet().writeContract({
        address: w.to,
        abi: w.abi,
        functionName: w.functionName,
        args: w.args ?? [],
        account: from,
        chain,
        gas,
        value,
        ...fees ? { maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}
      });
    } else {
      hash = await wallet().sendTransaction({
        to: w.to,
        value,
        account: from,
        chain,
        gas,
        ...fees ? { maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}
      });
    }
    const receipt = await waitReceipt(hash);
    return { hash, receipt };
  }
  return { from, execute, publicClient };
}

// node_modules/@somnia-chain/markets-sdk/dist/operatorAbi.js
var marketsCoreWriteAbi = parseAbi([
  "function registerOperator(address feeRecipient, bool enabled, address policy, bytes context) returns (uint32 operatorId)",
  "function updateOperator(uint32 operatorId, address feeRecipient, bool enabled, address policy, bytes context)",
  "function setOperatorEnabled(uint32 operatorId, bool enabled)",
  "function transferOperatorOwnership(uint32 operatorId, address newOwner)",
  "function acceptOperatorOwnership(uint32 operatorId)",
  "function createVenue(uint32 operatorId, bytes4 marketType, (bytes feeParams, address feeRecipientOverride, address policy, address signer, bool creationEnabled, bytes context) config) returns (bytes32 venueId)",
  "function updateVenue(uint32 operatorId, bytes32 venueId, (bytes feeParams, address feeRecipientOverride, address policy, address signer, bool creationEnabled, bytes context) config)",
  "function setVenueEnabled(uint32 operatorId, bytes32 venueId, bool creationEnabled)"
]);
var marketsCoreEventsAbi = parseAbi([
  "event OperatorRegistered(uint32 indexed operatorId, address indexed owner, address indexed feeRecipient, bool enabled, address policy, bytes context)",
  "event OperatorOwnershipTransferred(uint32 indexed operatorId, address indexed oldOwner, address indexed newOwner)",
  "event VenueCreated(uint32 indexed operatorId, bytes32 indexed venueId, bytes4 indexed marketType, bytes feeParams, address feeRecipientOverride, address policy, address signer, bool creationEnabled, bytes context)"
]);
var binaryModuleFeeParamsAbi = parseAbi([
  "function encodeVenueFeeParams((uint64 makerFeeBps, uint64 takerFeeBps, uint64 maxBuilderFeeBps, uint64 routingFeeBps, uint64 settlementFeeBps, uint8 voidPolicy) vp) pure returns (bytes)",
  "function FEE_PARAMS_VERSION() view returns (uint8)",
  "function MAX_FEE_BPS() view returns (uint256)"
]);

// node_modules/@somnia-chain/markets-sdk/dist/operatorAdmin.js
function createOperatorAdminWithDeps(config, deps) {
  var _a;
  const marketsCore = config.marketsCore ?? ((_a = deps.getConfig().addresses) == null ? void 0 : _a.marketsCore);
  if (!marketsCore) {
    throw new NotConfiguredError("marketsCore or config.addresses.marketsCore", "createOperatorAdmin");
  }
  const writer = makeMachineryWriter(config, deps, "createOperatorAdmin");
  const execute = (w) => writer.execute({
    to: marketsCore,
    abi: marketsCoreWriteAbi,
    functionName: w.functionName,
    args: w.args,
    gas: w.gas
  });
  function decodeOperatorId(receipt) {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: marketsCoreEventsAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "OperatorRegistered")
          return Number(decoded.args.operatorId);
      } catch {
        continue;
      }
    }
    throw new RpcError("registerOperator", "the receipt carried no OperatorRegistered event");
  }
  function decodeVenueId(receipt) {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: marketsCoreEventsAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "VenueCreated")
          return decoded.args.venueId;
      } catch {
        continue;
      }
    }
    throw new RpcError("createVenue", "the receipt carried no VenueCreated event");
  }
  const toTuple = (c) => [c.feeParams, c.feeRecipientOverride, c.policy, c.signer, c.creationEnabled, c.context ?? "0x"];
  return {
    async registerOperator(p) {
      const result2 = await execute({
        functionName: "registerOperator",
        args: [p.feeRecipient, p.enabled, p.policy, p.context ?? "0x"],
        gas: p.gas
      });
      return { ...result2, operatorId: decodeOperatorId(result2.receipt) };
    },
    async updateOperator(p) {
      return execute({
        functionName: "updateOperator",
        args: [p.operatorId, p.feeRecipient, p.enabled, p.policy, p.context ?? "0x"],
        gas: p.gas
      });
    },
    async setOperatorEnabled(p) {
      return execute({ functionName: "setOperatorEnabled", args: [p.operatorId, p.enabled], gas: p.gas });
    },
    async transferOperatorOwnership(p) {
      return execute({
        functionName: "transferOperatorOwnership",
        args: [p.operatorId, p.newOwner],
        gas: p.gas
      });
    },
    async acceptOperatorOwnership(p) {
      return execute({ functionName: "acceptOperatorOwnership", args: [p.operatorId], gas: p.gas });
    },
    async createVenue(p) {
      const result2 = await execute({
        functionName: "createVenue",
        args: [p.operatorId, p.marketType, toTuple(p.config)],
        gas: p.gas
      });
      return { ...result2, venueId: decodeVenueId(result2.receipt) };
    },
    async updateVenue(p) {
      return execute({
        functionName: "updateVenue",
        args: [p.operatorId, p.venueId, toTuple(p.config)],
        gas: p.gas
      });
    },
    async setVenueEnabled(p) {
      return execute({
        functionName: "setVenueEnabled",
        args: [p.operatorId, p.venueId, p.creationEnabled],
        gas: p.gas
      });
    }
  };
}
var OperatorFields = graphql(`
  fragment OperatorFields on Operator {
    operatorId
    owner
    feeRecipient
    enabled
    policy
    context
    pendingOwner
    venueCount
    createdAtTimestamp
    updatedAtTimestamp
    marketCount
    cumulativeQuoteVolume
    protocolFeesCollected
    settlementFeesCollected
    builderFeesCollected
  }
`);
var VenueFields = graphql(`
  fragment VenueFields on Venue {
    venueId
    operatorId
    marketType
    feeParams
    feeRecipientOverride
    policy
    signer
    creationEnabled
    context
    createdAtTimestamp
    updatedAtTimestamp
    marketCount
    cumulativeQuoteVolume
    protocolFeesCollected
    settlementFeesCollected
    builderFeesCollected
  }
`);
async function listOperators(opts = {}, indexerUrl) {
  const data = await gqlRequest(OperatorsQuery, { where: operatorWhere(opts), limit: opts.limit ?? 20, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Operator;
}
async function countOperators(opts, indexerUrl, headers) {
  return aggregateCount("Operator", "Operator_bool_exp", operatorWhere(opts), indexerUrl, headers);
}
async function getOperator(operatorId, indexerUrl) {
  const data = await gqlRequest(OperatorByPkQuery, { id: String(operatorId) }, indexerUrl);
  return data.Operator_by_pk;
}
async function listVenues(opts = {}, indexerUrl) {
  const where = {};
  if (opts.operatorId != null)
    where.operatorId = { _eq: opts.operatorId };
  if (opts.marketType != null)
    where.marketType = { _eq: opts.marketType.toLowerCase() };
  if (opts.creationEnabled != null)
    where.creationEnabled = { _eq: opts.creationEnabled };
  const data = await gqlRequest(VenuesQuery, { where, limit: opts.limit ?? 100, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Venue;
}
async function countVenues(opts, indexerUrl, headers) {
  const where = {};
  if (opts.operatorId != null)
    where.operatorId = { _eq: opts.operatorId };
  if (opts.marketType != null)
    where.marketType = { _eq: opts.marketType.toLowerCase() };
  return aggregateCount("Venue", "Venue_bool_exp", where, indexerUrl, headers);
}
async function getVenue(venueId, indexerUrl) {
  const data = await gqlRequest(VenueByPkQuery, { id: venueId.toLowerCase() }, indexerUrl);
  return data.Venue_by_pk;
}
function operatorWhere(f) {
  const where = {};
  if (f.owner != null)
    where.owner = { _eq: f.owner.toLowerCase() };
  if (f.enabled != null)
    where.enabled = { _eq: f.enabled };
  return where;
}
var OperatorsQuery = graphql(`
  query Operators($where: Operator_bool_exp!, $limit: Int, $offset: Int) {
         Operator(where: $where, order_by: {operatorId: desc}, limit: $limit, offset: $offset) { ...OperatorFields }
       }
`);
var OperatorByPkQuery = graphql(`
  query OperatorByPk($id: String!) { Operator_by_pk(id: $id) { ...OperatorFields } }
`);
var VenuesQuery = graphql(`
  query Venues($where: Venue_bool_exp!, $limit: Int, $offset: Int) {
         Venue(where: $where, order_by: {createdAtTimestamp: asc}, limit: $limit, offset: $offset) { ...VenueFields }
       }
`);
var VenueByPkQuery = graphql(`
  query VenueByPk($id: String!) { Venue_by_pk(id: $id) { ...VenueFields } }
`);

// node_modules/@somnia-chain/markets-sdk/dist/machineryAbi.js
var oracleHubAbi = parseAbi([
  // Scheduling (content-addressed dedup): the same template definition returns
  // the SAME question id and is charged only MARGINAL cost — quote via
  // getSchedulingCost (0 for a reuse, the full oracle cost for a new question).
  "function scheduleQuestion((string questionText, (uint8 sourceType, bytes params)[] sources, (uint8 answerType, string[] discreteOutcomes, (int256 low, int256 high)[] numericIntervals, uint64 numericDecimals) validAnswers, uint256 resolutionTime, uint256 minAgreement, uint256 subcommitteeSize, uint256 subcommitteeThreshold) def) payable returns (uint256 oracleQuestionId)",
  "function getSchedulingCost((string questionText, (uint8 sourceType, bytes params)[] sources, (uint8 answerType, string[] discreteOutcomes, (int256 low, int256 high)[] numericIntervals, uint64 numericDecimals) validAnswers, uint256 resolutionTime, uint256 minAgreement, uint256 subcommitteeSize, uint256 subcommitteeThreshold) def) view returns (uint256 cost)",
  "function questionKeyOf((string questionText, (uint8 sourceType, bytes params)[] sources, (uint8 answerType, string[] discreteOutcomes, (int256 low, int256 high)[] numericIntervals, uint64 numericDecimals) validAnswers, uint256 resolutionTime, uint256 minAgreement, uint256 subcommitteeSize, uint256 subcommitteeThreshold) def) pure returns (bytes32 key)",
  // EARMARK-AT-CREATION operator accounts (Oracle v2 §8e). The resolution
  // reserve is ATTACHED to the market-creation value and LOCKED per-market at
  // onBind (earmarkedOf, never withdrawable); at resolution the exact metered
  // cost is charged and any surplus is CREDITED (creditOf / withdrawableOf).
  // withdraw() is credit-only + owner-gated (reverts InsufficientCredit). There
  // is NO deposit()/prepaid pre-fund anymore. resolveReserve() is the exact wei
  // that must be attached to each create (forwarded to onBind).
  "function withdraw(uint32 operatorId, uint256 amount, address to)",
  "function resolveReserve() view returns (uint256 reserve)",
  "function earmarkedOf(uint32 operatorId) view returns (uint256 locked)",
  "function creditOf(uint32 operatorId) view returns (uint256 balance)",
  "function outstandingOf(uint32 operatorId) view returns (uint256 count)",
  "function withdrawableOf(uint32 operatorId) view returns (uint256 amount)",
  // A1 payer credit: with open venues the surplus is refunded to the account that
  // FRONTED the reserve (origin.creator) rather than the operator. That account
  // withdraws its own credit (msg.sender-gated, distinct from the owner-gated
  // operator withdraw above). payerOf is set at bind, cleared on settle.
  "function payerCreditOf(address payer) view returns (uint256 amount)",
  "function payerOf(bytes32 marketId) view returns (address payer)",
  "function withdrawMyCredit(uint256 amount, address to)",
  "function operatorOf(bytes32 marketId) view returns (uint32 operatorId)",
  // The EXACT reserve a market locked at onBind — snapshotted so a later gas-param
  // retune can never desync the release. 0 once settled. (What `earmarked` will
  // subtract when this market resolves.)
  "function reservedFor(bytes32 marketId) view returns (uint256 reserve)",
  "function bindCount(uint256 oracleQuestionId) view returns (uint32 count)",
  "function marketsForQuestion(uint256 oracleQuestionId) view returns (bytes32[] markets)",
  "function questionIdByKey(bytes32 questionKey) view returns (uint256 oracleQuestionId)",
  "function pendingResolves() view returns (uint256 remaining)",
  "function continuationSubId() view returns (uint256)",
  "function MAX_BINDS_PER_QUESTION() view returns (uint32)",
  // Pull-fallback answer reads (revert while the question is not final).
  "function getSlotCount(uint256 oracleQuestionId) view returns (uint8 slotCount)",
  "function pullAnswer(uint256 oracleQuestionId) view returns (uint8 outcomeIdx, bool voided)",
  "function pullNumericAnswer(uint256 oracleQuestionId) view returns (int256 numericValue, bool voided)",
  // Protocol-admin surface (owner-gated writes + the param views).
  "function setGasParams(uint64 priorityFeePerGas, uint64 maxFeePerGas, uint64 gasLimit)",
  "function setDrainParams(uint64 perMarketResolveGas, uint64 callbackBaseGas, uint32 maxResolvesPerCallback, uint64 resolveGasReserve)",
  "function enableReactivity() returns (uint256 subId)",
  "function migrateSubscription() returns (uint256 subId)",
  "function subscriptionId() view returns (uint256)",
  "function priorityFeePerGas() view returns (uint64)",
  "function maxFeePerGas() view returns (uint64)",
  "function gasLimit() view returns (uint64)",
  "function perMarketResolveGas() view returns (uint64)",
  "function callbackBaseGas() view returns (uint64)",
  "function maxResolvesPerCallback() view returns (uint32)",
  "function resolveGasReserve() view returns (uint64)",
  "function owner() view returns (address)"
]);
var oracleHubEventsAbi = parseAbi([
  "event QuestionScheduled(uint256 indexed oracleQuestionId, bytes32 indexed questionKey, address indexed scheduler, uint256 oracleCost)",
  "event QuestionReused(uint256 indexed oracleQuestionId, bytes32 indexed questionKey, address indexed scheduler)",
  "event QuestionCapSplit(bytes32 indexed questionKey, uint256 indexed supersededQuestionId, uint256 indexed newQuestionId)",
  "event ReserveEarmarked(uint32 indexed operatorId, bytes32 indexed marketId, uint256 amount)",
  "event SurplusCredited(uint32 indexed operatorId, bytes32 indexed marketId, uint256 amount)",
  "event CreditWithdrawn(uint32 indexed operatorId, address indexed to, uint256 amount)",
  "event PayerSurplusCredited(address indexed payer, bytes32 indexed marketId, uint256 amount)",
  "event PayerCreditWithdrawn(address indexed payer, address indexed to, uint256 amount)",
  "event MarketBound(uint256 indexed oracleQuestionId, bytes32 indexed marketId, uint32 indexed operatorId, uint32 bindCount)",
  "event MarketResolveCharged(bytes32 indexed marketId, uint32 indexed operatorId, uint256 measuredGas, uint256 overheadShare, uint256 cost, uint256 charged)",
  "event AnswerDelivered(uint256 indexed oracleQuestionId, bytes32 indexed marketId, uint32 payoutDenominator, uint256[] payoutNumerators, bool voided)",
  "event CallbackAccounted(uint256 marketsResolved, uint256 gasPrice, uint256 measuredGas, uint256 overheadGasAttributed, uint256 totalCost, uint256 totalCharged, uint256 subsidy, uint256 pendingRemaining)",
  "event DrainContinuation(uint256 subscriptionId, uint256 pendingRemaining)",
  "event Deposited(address indexed from, uint256 indexed amount)",
  "event GasParamsUpdated(uint64 indexed priorityFeePerGas, uint64 indexed maxFeePerGas, uint64 indexed gasLimit)",
  "event DrainParamsUpdated(uint64 perMarketResolveGas, uint64 callbackBaseGas, uint32 maxResolvesPerCallback, uint64 resolveGasReserve)"
]);
var marketCreatorFactoryAbi = parseAbi([
  "function createMarketCreator(address owner, address core, address adapter, uint32 operatorId, bytes32 venueId, (uint256 tickSize, uint256 minQuantity, uint256 lotSize) defaultBookParams) returns (address creator, address policy)",
  "function creators(uint256 index) view returns (address)",
  "function creatorCount() view returns (uint256)",
  "function creatorsPaged(uint256 offset, uint256 limit) view returns (address[])"
]);
var marketCreatorFactoryEventsAbi = parseAbi([
  "event MarketCreatorCreated(address indexed creator, address indexed owner, uint32 indexed operatorId, bytes32 venueId, address policy, address core, address adapter)"
]);
var marketCreatorAbi = parseAbi([
  "function registerSeries(uint32 seriesId, (address collateral, string asset, uint64 numericDecimals, uint64 intervalSec, uint64 settlementWindow) s)",
  "function triggerRoll(uint32 seriesId)",
  // A1: arm a series' FIRST roll at a future wall-clock boundary WITHOUT minting
  // now — for a seamless MarketCreator migration (start the new MC at the old
  // market's expiry). Precompile call → testnet/mainnet only.
  "function armFirstRoll(uint32 seriesId, uint256 firesAtSec)",
  // A1: pull this MC's own accrued oracle surplus (payer credit) out of the hub
  // into its native float. Runs automatically each roll cycle; this is the manual
  // sweep. Permissionless (moves only the MC's own credit to itself).
  "function reclaimOracleCredit() returns (uint256 reclaimed)",
  "function withdrawNative(address to, uint256 amount)",
  "function cancelSubscription(uint256 firesAtSec)",
  "function firstRollArmed(uint32 seriesId) view returns (bool armed)",
  "function latestExpiryBySeriesId(uint32 seriesId) view returns (uint64 expiry)",
  "function armedBoundary() view returns (uint256)",
  "function marketCount() view returns (uint256)",
  "function setReactivityGasParams(uint64 priorityFeePerGas, uint64 maxFeePerGas, uint64 gasLimit)",
  "function seriesById(uint32 seriesId) view returns (address collateral, string asset, uint64 numericDecimals, uint64 intervalSec, uint64 settlementWindow)",
  "function core() view returns (address)",
  "function adapter() view returns (address)",
  "function operatorId() view returns (uint32)",
  "function venueId() view returns (bytes32)",
  "function defaultBookParams() view returns (uint256 tickSize, uint256 minQuantity, uint256 lotSize)",
  "function owner() view returns (address)"
]);
var marketCreatorV2Abi = parseAbi([
  "function registerSeries(uint32 seriesId, (address collateral, string asset, uint64 numericDecimals, uint64 intervalSec, uint64 settlementWindow) s)",
  "function armFirstRoll(uint32 seriesId, uint256 firesAtSec)",
  "function recoverSeries(uint32 seriesId)",
  "function lastPermissionlessRecoveryAt(uint32 seriesId) view returns (uint64 t)",
  "function reclaimOracleCredit() returns (uint256 reclaimed)",
  "function withdrawNative(address to, uint256 amount)",
  // Tear down BOTH the persistent AnswerPosted sub and the periodic Schedule
  // backstop tick — the v2 migration/cutover switch (replaces v1's
  // per-boundary `cancelSubscription(uint256)`).
  "function cancelSubscriptions()",
  // In-place migration (see RUNBOOK-mc-migration.md). `adoptFrom` (pull) inherits
  // a quiesced predecessor's whole series set + each series' pending oracle qid,
  // so the next roll fires HERE off the outgoing market's own answer — strike
  // chain intact, no bootstrap. `handoffTo` (push) is the outgoing side: quiesce +
  // sweep float to the successor + set `retired`. Both are precompile-touching →
  // testnet/mainnet only. Pair with `MarketCreatorPolicy.swapCreator`.
  "function adoptFrom(address old)",
  "function handoffTo(address successor)",
  "function migratedFrom() view returns (address)",
  // One-heir latch: the single successor that has adopted this creator's
  // routing (zero while unadopted) — a second adoptFrom against the same
  // predecessor reverts.
  "function adoptedBy() view returns (address)",
  "function retired() view returns (bool)",
  "function latestExpiryBySeriesId(uint32 seriesId) view returns (uint64 expiry)",
  "function marketCount() view returns (uint256)",
  "function setReactivityGasParams(uint64 priorityFeePerGas, uint64 maxFeePerGas, uint64 gasLimit)",
  "function seriesById(uint32 seriesId) view returns (address collateral, string asset, uint64 numericDecimals, uint64 intervalSec, uint64 settlementWindow)",
  // The series' currently-pending oracle question id (bootstrap reference, or
  // the latest rolled market's own question once it has rolled at least once).
  "function referenceQidBySeries(uint32 seriesId) view returns (uint256 qid)",
  "function seriesByPendingQid(uint256 qid) view returns (uint32 seriesId)",
  "function pendingExpiryBySeries(uint32 seriesId) view returns (uint64 expiry)",
  "function firstRollBoundaryBySeries(uint32 seriesId) view returns (uint64 firesAtSec)",
  "function answerSubId() view returns (uint256)",
  "function backstopSubId() view returns (uint256)",
  "function core() view returns (address)",
  "function adapter() view returns (address)",
  "function operatorId() view returns (uint32)",
  "function venueId() view returns (bytes32)",
  "function defaultBookParams() view returns (uint256 tickSize, uint256 minQuantity, uint256 lotSize)",
  "function owner() view returns (address)"
]);
var marketCreatorPolicyAbi = parseAbi([
  "function approved(address creator) view returns (bool)",
  "function setCreator(address creator, bool allowed)",
  // Atomic venue re-authorization for the in-place creator cutover: revoke `from`
  // + authorize `to` in one call, so there is never a window where both or
  // neither is approved. Pair with `MarketCreatorV2.adoptFrom`/`handoffTo`.
  "function swapCreator(address from, address to)",
  "function owner() view returns (address)"
]);
var moduleGovernanceAbi = parseAbi([
  "function setAdapterApproved(address adapter, bool approved)",
  "function approvedAdapters(address adapter) view returns (bool)",
  "function owner() view returns (address)"
]);
var moduleGovernanceEventsAbi = parseAbi([
  "event AdapterApproved(address indexed adapter, bool indexed approved)"
]);

// node_modules/@somnia-chain/markets-sdk/dist/oracleHub.js
var QUESTION_SOURCE_TYPE = {
  /** Answer scraped from a website URL. */
  Website: 0,
  /** Answer fetched from a JSON endpoint — the only source type eligible for dedup. */
  JSON: 1,
  /** Answer read from an on-chain contract. */
  Contract: 2
};
var ANSWER_TYPE = {
  /** Resolves to a number, bucketed by `numericIntervals`. */
  Numeric: 0,
  /** Resolves to one of the `discreteOutcomes` strings. */
  Discrete: 1
};
function toDefTuple(def) {
  return {
    questionText: def.questionText,
    sources: def.sources.map((s) => ({ sourceType: s.sourceType, params: s.params })),
    validAnswers: {
      answerType: def.validAnswers.answerType,
      discreteOutcomes: def.validAnswers.discreteOutcomes,
      numericIntervals: def.validAnswers.numericIntervals.map((i) => ({ low: i.low, high: i.high })),
      numericDecimals: def.validAnswers.numericDecimals
    },
    resolutionTime: def.resolutionTime,
    minAgreement: def.minAgreement,
    subcommitteeSize: def.subcommitteeSize,
    subcommitteeThreshold: def.subcommitteeThreshold
  };
}
async function getSchedulingCost(def, hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "getSchedulingCost",
    args: [toDefTuple(def)]
  });
}
async function earmarkedOf(operatorId, hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "earmarkedOf",
    args: [operatorId]
  });
}
async function creditOf(operatorId, hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "creditOf",
    args: [operatorId]
  });
}
async function outstandingOf(operatorId, hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "outstandingOf",
    args: [operatorId]
  });
}
async function withdrawableOf(operatorId, hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "withdrawableOf",
    args: [operatorId]
  });
}
async function payerCreditOf(payer, hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "payerCreditOf",
    args: [payer]
  });
}
async function payerOf(marketId, hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "payerOf",
    args: [marketId]
  });
}
async function resolveReserve(hub, client) {
  return client.readContract({
    address: hub,
    abi: oracleHubAbi,
    functionName: "resolveReserve"
  });
}
async function quoteCreateMarketValue(def, hub, client) {
  const [cost, reserve] = await Promise.all([
    getSchedulingCost(def, hub, client),
    resolveReserve(hub, client)
  ]);
  return cost + reserve;
}
function createOracleHubAdminWithDeps(config, deps) {
  var _a, _b;
  const hub = (_a = deps.getConfig().addresses) == null ? void 0 : _a.oracleHub;
  const binaryModule = (_b = deps.getConfig().addresses) == null ? void 0 : _b.binaryModule;
  const writer = makeMachineryWriter(config, deps, "createOracleHubAdmin");
  const pc = () => deps.getClient();
  function requireHub() {
    if (!hub) {
      throw new NotConfiguredError("config.addresses.oracleHub", "createOracleHubAdmin");
    }
    return hub;
  }
  function requireModule() {
    if (!binaryModule) {
      throw new NotConfiguredError("config.addresses.binaryModule", "hub-approval reads");
    }
    return binaryModule;
  }
  function decodeScheduled(receipt) {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: oracleHubEventsAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "QuestionScheduled") {
          return { oracleQuestionId: decoded.args.oracleQuestionId, reused: false };
        }
        if (decoded.eventName === "QuestionReused") {
          return { oracleQuestionId: decoded.args.oracleQuestionId, reused: true };
        }
      } catch {
        continue;
      }
    }
    throw new RpcError("scheduleQuestion", "the receipt carried no QuestionScheduled/QuestionReused event");
  }
  async function isHubApproved() {
    return await pc().readContract({
      address: requireModule(),
      abi: moduleGovernanceAbi,
      functionName: "approvedAdapters",
      args: [requireHub()]
    });
  }
  return {
    getSchedulingCost: (def) => getSchedulingCost(def, requireHub(), pc()),
    earmarkedOf: (operatorId) => earmarkedOf(operatorId, requireHub(), pc()),
    creditOf: (operatorId) => creditOf(operatorId, requireHub(), pc()),
    outstandingOf: (operatorId) => outstandingOf(operatorId, requireHub(), pc()),
    withdrawableOf: (operatorId) => withdrawableOf(operatorId, requireHub(), pc()),
    payerCreditOf: (payer) => payerCreditOf(payer, requireHub(), pc()),
    payerOf: (marketId) => payerOf(marketId, requireHub(), pc()),
    resolveReserve: () => resolveReserve(requireHub(), pc()),
    quoteCreateMarketValue: (def) => quoteCreateMarketValue(def, requireHub(), pc()),
    async getQuestionState(def) {
      const a = { address: requireHub(), abi: oracleHubAbi };
      const questionKey = await pc().readContract({
        ...a,
        functionName: "questionKeyOf",
        args: [toDefTuple(def)]
      });
      const oracleQuestionId = await pc().readContract({
        ...a,
        functionName: "questionIdByKey",
        args: [questionKey]
      });
      if (oracleQuestionId === 0n) {
        return { questionKey, oracleQuestionId, bindCount: 0, markets: [] };
      }
      const [bindCount, markets] = await Promise.all([
        pc().readContract({ ...a, functionName: "bindCount", args: [oracleQuestionId] }),
        pc().readContract({ ...a, functionName: "marketsForQuestion", args: [oracleQuestionId] })
      ]);
      return { questionKey, oracleQuestionId, bindCount: Number(bindCount), markets: [...markets] };
    },
    async getQuestionIdByKey(questionKey) {
      return pc().readContract({
        address: requireHub(),
        abi: oracleHubAbi,
        functionName: "questionIdByKey",
        args: [questionKey]
      });
    },
    async getBindCount(oracleQuestionId) {
      const count = await pc().readContract({
        address: requireHub(),
        abi: oracleHubAbi,
        functionName: "bindCount",
        args: [oracleQuestionId]
      });
      return Number(count);
    },
    async getMarketsForQuestion(oracleQuestionId) {
      const markets = await pc().readContract({
        address: requireHub(),
        abi: oracleHubAbi,
        functionName: "marketsForQuestion",
        args: [oracleQuestionId]
      });
      return [...markets];
    },
    isHubApproved,
    async getHubStatus() {
      const address = requireHub();
      const a = { address, abi: oracleHubAbi };
      const [owner, balanceWei, approved, subscriptionId, priorityFeePerGas, maxFeePerGas, gasLimit, perMarketResolveGas, callbackBaseGas, maxResolvesPerCallback, resolveGasReserve, resolveReserveWei, pendingResolves] = await Promise.all([
        pc().readContract({ ...a, functionName: "owner" }),
        pc().getBalance({ address }),
        isHubApproved(),
        pc().readContract({ ...a, functionName: "subscriptionId" }),
        pc().readContract({ ...a, functionName: "priorityFeePerGas" }),
        pc().readContract({ ...a, functionName: "maxFeePerGas" }),
        pc().readContract({ ...a, functionName: "gasLimit" }),
        pc().readContract({ ...a, functionName: "perMarketResolveGas" }),
        pc().readContract({ ...a, functionName: "callbackBaseGas" }),
        pc().readContract({ ...a, functionName: "maxResolvesPerCallback" }),
        pc().readContract({ ...a, functionName: "resolveGasReserve" }),
        pc().readContract({ ...a, functionName: "resolveReserve" }),
        pc().readContract({ ...a, functionName: "pendingResolves" })
      ]);
      return {
        owner,
        balanceWei,
        approved,
        subscriptionId,
        priorityFeePerGas: BigInt(priorityFeePerGas),
        maxFeePerGas: BigInt(maxFeePerGas),
        gasLimit: BigInt(gasLimit),
        perMarketResolveGas: BigInt(perMarketResolveGas),
        callbackBaseGas: BigInt(callbackBaseGas),
        maxResolvesPerCallback: BigInt(maxResolvesPerCallback),
        resolveGasReserve: BigInt(resolveGasReserve),
        resolveReserveWei,
        pendingResolves
      };
    },
    async scheduleQuestion(p) {
      const address = requireHub();
      const value = p.valueWei ?? await getSchedulingCost(p.def, address, pc());
      const result2 = await writer.execute({
        to: address,
        abi: oracleHubAbi,
        functionName: "scheduleQuestion",
        args: [toDefTuple(p.def)],
        value,
        gas: p.gas
      });
      return { ...result2, ...decodeScheduled(result2.receipt) };
    },
    async withdraw(p) {
      return writer.execute({
        to: requireHub(),
        abi: oracleHubAbi,
        functionName: "withdraw",
        args: [p.operatorId, p.amountWei, p.to],
        gas: p.gas
      });
    },
    async withdrawMyCredit(p) {
      return writer.execute({
        to: requireHub(),
        abi: oracleHubAbi,
        functionName: "withdrawMyCredit",
        args: [p.amountWei, p.to],
        gas: p.gas
      });
    },
    async fundHub(p) {
      return writer.execute({ to: requireHub(), value: p.amountWei, gas: p.gas });
    },
    async setGasParams(p) {
      return writer.execute({
        to: requireHub(),
        abi: oracleHubAbi,
        functionName: "setGasParams",
        args: [p.priorityFeePerGas, p.maxFeePerGas, p.gasLimit],
        gas: p.gas
      });
    },
    async setDrainParams(p) {
      return writer.execute({
        to: requireHub(),
        abi: oracleHubAbi,
        functionName: "setDrainParams",
        args: [p.perMarketResolveGas, p.callbackBaseGas, p.maxResolvesPerCallback, p.resolveGasReserve],
        gas: p.gas
      });
    },
    async enableReactivity(p) {
      return writer.execute({
        to: requireHub(),
        abi: oracleHubAbi,
        functionName: "enableReactivity",
        args: [],
        gas: p == null ? void 0 : p.gas
      });
    },
    async migrateSubscription(p) {
      return writer.execute({
        to: requireHub(),
        abi: oracleHubAbi,
        functionName: "migrateSubscription",
        args: [],
        gas: p == null ? void 0 : p.gas
      });
    }
  };
}
var OracleQuestionFields = graphql(`
  fragment OracleQuestionFields on OracleQuestion {
    id
    questionKey
    scheduler
    oracleCost
    bindCount
    reuseCount
    createdAtBlock
    createdAtTimestamp
  }
`);
var OperatorHubAccountFields = graphql(`
  fragment OperatorHubAccountFields on OperatorHubAccount {
    id
    operatorId
    earmarked
    credit
    outstanding
    createdAtBlock
    createdAtTimestamp
    updatedAtBlock
    updatedAtTimestamp
  }
`);
var OracleBindFields = graphql(`
  fragment OracleBindFields on OracleBind {
    id
    oracleQuestionId
    bindIndex
    operatorId
    measuredGas
    overheadShare
    cost
    charged
    subsidy
    resolvedAt
    boundAtBlock
    boundAtTimestamp
    txHash
  }
`);
var OracleCallbackFields = graphql(`
  fragment OracleCallbackFields on OracleCallback {
    id
    marketsResolved
    gasPrice
    measuredGas
    overheadGasAttributed
    totalCost
    totalCharged
    subsidy
    pendingRemaining
    blockNumber
    timestamp
    txHash
  }
`);
async function getOracleQuestion(oracleQuestionId, indexerUrl) {
  const data = await gqlRequest(OracleQuestionQuery, { id: String(oracleQuestionId) }, indexerUrl);
  return data.OracleQuestion_by_pk;
}
async function listOracleQuestions(opts = {}, indexerUrl) {
  const where = {};
  if (opts.scheduler != null)
    where.scheduler = { _eq: opts.scheduler.toLowerCase() };
  if (opts.questionKey != null)
    where.questionKey = { _eq: opts.questionKey.toLowerCase() };
  const data = await gqlRequest(OracleQuestionsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.OracleQuestion;
}
async function getOperatorHubAccount(operatorId, indexerUrl) {
  const data = await gqlRequest(OperatorHubAccountQuery, { id: String(operatorId) }, indexerUrl);
  return data.OperatorHubAccount_by_pk;
}
async function listOperatorHubAccounts(opts = {}, indexerUrl) {
  const data = await gqlRequest(OperatorHubAccountsQuery, { limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.OperatorHubAccount;
}
async function listOracleBinds(opts = {}, indexerUrl) {
  const where = {};
  if (opts.operatorId != null)
    where.operatorId = { _eq: opts.operatorId };
  if (opts.oracleQuestionId != null)
    where.oracleQuestionId = { _eq: String(opts.oracleQuestionId) };
  if (opts.resolved != null)
    where.resolvedAt = opts.resolved ? { _is_null: false } : { _is_null: true };
  const data = await gqlRequest(OracleBindsQuery, { where, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.OracleBind;
}
async function listOracleCallbacks(opts = {}, indexerUrl) {
  const data = await gqlRequest(OracleCallbacksQuery, { limit: opts.limit ?? 50, offset: opts.offset ?? 0 }, indexerUrl);
  return data.OracleCallback;
}
var OracleQuestionQuery = graphql(`
  query OracleQuestion($id: String!) {
         OracleQuestion_by_pk(id: $id) { ...OracleQuestionFields }
       }
`);
var OracleQuestionsQuery = graphql(`
  query OracleQuestions($where: OracleQuestion_bool_exp!, $limit: Int, $offset: Int) {
         OracleQuestion(where: $where, order_by: {createdAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OracleQuestionFields }
       }
`);
var OperatorHubAccountQuery = graphql(`
  query OperatorHubAccount($id: String!) {
         OperatorHubAccount_by_pk(id: $id) { ...OperatorHubAccountFields }
       }
`);
var OperatorHubAccountsQuery = graphql(`
  query OperatorHubAccounts($limit: Int, $offset: Int) {
         OperatorHubAccount(order_by: {updatedAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OperatorHubAccountFields }
       }
`);
var OracleBindsQuery = graphql(`
  query OracleBinds($where: OracleBind_bool_exp!, $limit: Int, $offset: Int) {
         OracleBind(where: $where, order_by: {boundAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OracleBindFields }
       }
`);
var OracleCallbacksQuery = graphql(`
  query OracleCallbacks($limit: Int, $offset: Int) {
         OracleCallback(order_by: {timestamp: desc}, limit: $limit, offset: $offset) { ...OracleCallbackFields }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/governanceAdmin.js
function createGovernanceAdminWithDeps(config, deps) {
  var _a;
  const binaryModule = (_a = deps.getConfig().addresses) == null ? void 0 : _a.binaryModule;
  const writer = makeMachineryWriter(config, deps, "createGovernanceAdmin");
  const pc = () => deps.getClient();
  function requireModule() {
    if (!binaryModule) {
      throw new NotConfiguredError("config.addresses.binaryModule", "createGovernanceAdmin");
    }
    return binaryModule;
  }
  async function getModuleOwner() {
    return await pc().readContract({
      address: requireModule(),
      abi: moduleGovernanceAbi,
      functionName: "owner"
    });
  }
  return {
    async setAdapterApproved(p) {
      return writer.execute({
        to: requireModule(),
        abi: moduleGovernanceAbi,
        functionName: "setAdapterApproved",
        args: [p.adapter, p.approved],
        gas: p.gas
      });
    },
    getModuleOwner,
    async isModuleOwner(addr) {
      const owner = await getModuleOwner();
      return owner.toLowerCase() === addr.toLowerCase();
    }
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/marketCreatorAdmin.js
var toBookTuple = (p) => ({
  tickSize: p.tickSize,
  minQuantity: p.minQuantity,
  lotSize: p.lotSize
});
function createMarketCreatorAdminWithDeps(config, deps) {
  var _a, _b;
  const factory = (_a = deps.getConfig().addresses) == null ? void 0 : _a.marketCreatorFactory;
  const binaryModule = (_b = deps.getConfig().addresses) == null ? void 0 : _b.binaryModule;
  const writer = makeMachineryWriter(config, deps, "createMarketCreatorAdmin");
  const pc = () => deps.getClient();
  function requireFactory(explicit) {
    const resolved = explicit ?? factory;
    if (!resolved) {
      throw new NotConfiguredError("factory or config.addresses.marketCreatorFactory", "createMarketCreatorAdmin");
    }
    return resolved;
  }
  function resolveCore(explicit) {
    const core = explicit ?? binaryModule;
    if (!core) {
      throw new NotConfiguredError("core or config.addresses.binaryModule", "createMarketCreator");
    }
    return core;
  }
  function resolveAdapter(explicit) {
    var _a2;
    const adapter = explicit ?? ((_a2 = deps.getConfig().addresses) == null ? void 0 : _a2.oracleHub);
    if (!adapter) {
      throw new NotConfiguredError("adapter or config.addresses.oracleHub", "createMarketCreator");
    }
    return adapter;
  }
  function decodeCreator(receipt) {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: marketCreatorFactoryEventsAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "MarketCreatorCreated") {
          return { creator: decoded.args.creator, policy: decoded.args.policy };
        }
      } catch {
        continue;
      }
    }
    throw new RpcError("createMarketCreator", "the receipt carried no MarketCreatorCreated event");
  }
  async function registerSeries(p) {
    return writer.execute({
      to: p.creator,
      abi: marketCreatorAbi,
      functionName: "registerSeries",
      args: [
        p.seriesId,
        {
          collateral: p.collateral,
          asset: p.asset,
          numericDecimals: BigInt(p.numericDecimals),
          intervalSec: BigInt(p.intervalSec),
          settlementWindow: BigInt(p.settlementWindow)
        }
      ],
      gas: p.gas
    });
  }
  return {
    async createMarketCreator(p) {
      const result2 = await writer.execute({
        to: requireFactory(p.factory),
        abi: marketCreatorFactoryAbi,
        functionName: "createMarketCreator",
        args: [p.owner, resolveCore(p.core), resolveAdapter(p.adapter), p.operatorId, p.venueId, toBookTuple(p.defaultBookParams)],
        gas: p.gas
      });
      return { ...result2, ...decodeCreator(result2.receipt) };
    },
    async fundMarketCreator(p) {
      return writer.execute({ to: p.creator, value: p.amountWei, gas: p.gas });
    },
    registerSeries,
    updateSeries: registerSeries,
    async triggerRoll(p) {
      return writer.execute({ to: p.creator, abi: marketCreatorAbi, functionName: "triggerRoll", args: [p.seriesId], gas: p.gas });
    },
    async recoverSeries(p) {
      return writer.execute({
        to: p.creator,
        abi: marketCreatorV2Abi,
        functionName: "recoverSeries",
        args: [p.seriesId],
        gas: p.gas
      });
    },
    async armFirstRoll(p) {
      return writer.execute({ to: p.creator, abi: marketCreatorAbi, functionName: "armFirstRoll", args: [p.seriesId, p.firesAtSec], gas: p.gas });
    },
    async reclaimOracleCredit(p) {
      return writer.execute({ to: p.creator, abi: marketCreatorAbi, functionName: "reclaimOracleCredit", args: [], gas: p.gas });
    },
    async adoptFrom(p) {
      return writer.execute({ to: p.successor, abi: marketCreatorV2Abi, functionName: "adoptFrom", args: [p.old], gas: p.gas });
    },
    async handoffTo(p) {
      return writer.execute({ to: p.creator, abi: marketCreatorV2Abi, functionName: "handoffTo", args: [p.successor], gas: p.gas });
    },
    async swapCreator(p) {
      return writer.execute({ to: p.policy, abi: marketCreatorPolicyAbi, functionName: "swapCreator", args: [p.from, p.to], gas: p.gas });
    },
    async setReactivityGasParams(p) {
      return writer.execute({
        to: p.creator,
        abi: marketCreatorAbi,
        functionName: "setReactivityGasParams",
        args: [p.priorityFeePerGas, p.maxFeePerGas, p.gasLimit],
        gas: p.gas
      });
    },
    async getMarketCreatorOnchain(creator) {
      const c = { address: creator, abi: marketCreatorAbi };
      const [core, adapter, operatorId, venueId, owner, book] = await Promise.all([
        pc().readContract({ ...c, functionName: "core" }),
        pc().readContract({ ...c, functionName: "adapter" }),
        pc().readContract({ ...c, functionName: "operatorId" }),
        pc().readContract({ ...c, functionName: "venueId" }),
        pc().readContract({ ...c, functionName: "owner" }),
        pc().readContract({ ...c, functionName: "defaultBookParams" })
      ]);
      return {
        core,
        adapter,
        operatorId: Number(operatorId),
        venueId,
        owner,
        defaultBookParams: { tickSize: book[0], minQuantity: book[1], lotSize: book[2] }
      };
    },
    async getSeriesOnchain(creator, seriesId) {
      const s = await pc().readContract({
        address: creator,
        abi: marketCreatorAbi,
        functionName: "seriesById",
        args: [seriesId]
      });
      return {
        collateral: s[0],
        asset: s[1],
        numericDecimals: Number(s[2]),
        intervalSec: Number(s[3]),
        settlementWindow: Number(s[4])
      };
    }
  };
}
var SeriesFields = graphql(`
  fragment SeriesFields on Series {
    id
    creatorAddress
    seriesId
    collateral
    asset
    intervalSec
    createdAtTimestamp
    updatedAtTimestamp
  }
`);
var MarketCreatorFields = graphql(`
  fragment MarketCreatorFields on MarketCreator {
    id
    owner
    policy
    core
    adapter
    operatorId
    venueId
    factory
    createdAtBlock
    createdAtTimestamp
  }
`);
var OracleAdapterFields = graphql(`
  fragment OracleAdapterFields on OracleAdapter {
    id
    owner
    factory
    approved
    approvedAtTimestamp
    createdAtTimestamp
  }
`);
async function listMarketCreators(opts = {}, indexerUrl) {
  const data = await gqlRequest(MarketCreatorsQuery, { where: marketCreatorWhere(opts), limit: opts.limit ?? 20, offset: opts.offset ?? 0 }, indexerUrl);
  return data.MarketCreator;
}
async function getMarketCreator(creator, indexerUrl) {
  const data = await gqlRequest(MarketCreatorByPkQuery, { id: creator.toLowerCase() }, indexerUrl);
  return data.MarketCreator_by_pk;
}
async function listOracleAdapters(opts = {}, indexerUrl) {
  const where = {};
  if (opts.owner != null)
    where.owner = { _eq: opts.owner.toLowerCase() };
  if (opts.approved != null)
    where.approved = { _eq: opts.approved };
  const data = await gqlRequest(OracleAdaptersQuery, { where, limit: opts.limit ?? 20, offset: opts.offset ?? 0 }, indexerUrl);
  return data.OracleAdapter;
}
async function getOracleAdapter(adapter, indexerUrl) {
  const data = await gqlRequest(OracleAdapterByPkQuery, { id: adapter.toLowerCase() }, indexerUrl);
  return data.OracleAdapter_by_pk;
}
async function getSeries(creator, seriesId, indexerUrl) {
  const data = await gqlRequest(SeriesByIdQuery, { id: `${creator.toLowerCase()}_${seriesId}` }, indexerUrl);
  return data.Series[0] ?? null;
}
async function listSeries(opts = {}, indexerUrl) {
  const where = {};
  if (opts.creator != null)
    where.creatorAddress = { _eq: opts.creator.toLowerCase() };
  const data = await gqlRequest(SeriesListQuery, { where, limit: opts.limit ?? 100, offset: opts.offset ?? 0 }, indexerUrl);
  return data.Series;
}
function marketCreatorWhere(f) {
  const where = {};
  if (f.owner != null)
    where.owner = { _eq: f.owner.toLowerCase() };
  if (f.operatorId != null)
    where.operatorId = { _eq: f.operatorId };
  if (f.venueId != null)
    where.venueId = { _eq: f.venueId.toLowerCase() };
  return where;
}
var MarketCreatorsQuery = graphql(`
  query MarketCreators($where: MarketCreator_bool_exp!, $limit: Int, $offset: Int) {
         MarketCreator(where: $where, order_by: {createdAtBlock: desc}, limit: $limit, offset: $offset) {
           ...MarketCreatorFields
           series(order_by: {seriesId: asc}) { ...SeriesFields }
         }
       }
`);
var MarketCreatorByPkQuery = graphql(`
  query MarketCreatorByPk($id: String!) {
         MarketCreator_by_pk(id: $id) {
           ...MarketCreatorFields
           series(order_by: {seriesId: asc}) { ...SeriesFields }
         }
       }
`);
var OracleAdaptersQuery = graphql(`
  query OracleAdapters($where: OracleAdapter_bool_exp!, $limit: Int, $offset: Int) {
         OracleAdapter(where: $where, order_by: {createdAtTimestamp: desc}, limit: $limit, offset: $offset) { ...OracleAdapterFields }
       }
`);
var OracleAdapterByPkQuery = graphql(`
  query OracleAdapterByPk($id: String!) { OracleAdapter_by_pk(id: $id) { ...OracleAdapterFields } }
`);
var SeriesByIdQuery = graphql(`
  query SeriesById($id: String!) {
         Series(where: { id: { _eq: $id } }, limit: 1) { ...SeriesFields }
       }
`);
var SeriesListQuery = graphql(`
  query SeriesList($where: Series_bool_exp!, $limit: Int, $offset: Int) {
         Series(where: $where, order_by: {createdAtTimestamp: asc}, limit: $limit, offset: $offset) { ...SeriesFields }
       }
`);

// node_modules/@somnia-chain/markets-sdk/dist/operatorReads.js
var MARKET_TYPE_BINARY_V1 = "0x06c65d9f";
var FEE_PARAMS_VERSION = 3;
var LEGACY_FEE_PARAMS_VERSION = 2;
var VOID_POLICY_TO_WORD = {
  UNIFORM: 0n,
  CLOB_SNAPSHOT: 2n
};
function voidPolicyFromWord(word) {
  const n = Number(word);
  if (n === 0)
    return "UNIFORM";
  if (n === 2)
    return "CLOB_SNAPSHOT";
  return null;
}
async function encodeBinaryVenueFeeParams(vp, client, binaryModule) {
  if (!binaryModule) {
    throw new NotConfiguredError("binaryModule or config.addresses.binaryModule", "this operator read");
  }
  return await client.readContract({
    address: binaryModule,
    abi: binaryModuleFeeParamsAbi,
    functionName: "encodeVenueFeeParams",
    args: [
      {
        makerFeeBps: BigInt(vp.makerFeeBps),
        takerFeeBps: BigInt(vp.takerFeeBps),
        maxBuilderFeeBps: BigInt(vp.maxBuilderFeeBps),
        routingFeeBps: BigInt(vp.routingFeeBps),
        settlementFeeBps: BigInt(vp.settlementFeeBps),
        voidPolicy: Number(VOID_POLICY_TO_WORD[vp.voidPolicy ?? "UNIFORM"])
      }
    ]
  });
}
var _rateWords = [
  { name: "makerFeeBps", type: "uint64" },
  { name: "takerFeeBps", type: "uint64" },
  { name: "maxBuilderFeeBps", type: "uint64" },
  { name: "routingFeeBps", type: "uint64" },
  { name: "settlementFeeBps", type: "uint64" }
];
var _binaryVenueParamsAbiTypeV2 = { type: "tuple", components: _rateWords };
var _binaryVenueParamsAbiTypeV3 = {
  type: "tuple",
  components: [..._rateWords, { name: "voidPolicy", type: "uint8" }]
};
function decodeBinaryVenueFeeParams(feeParams) {
  const byteLen = (feeParams.length - 2) / 2;
  if (byteLen !== 192 && byteLen !== 224)
    return null;
  try {
    const v3 = byteLen === 224;
    const [version, vp] = decodeAbiParameters([{ type: "uint8" }, v3 ? _binaryVenueParamsAbiTypeV3 : _binaryVenueParamsAbiTypeV2], feeParams);
    if (version !== (v3 ? FEE_PARAMS_VERSION : LEGACY_FEE_PARAMS_VERSION))
      return null;
    const voidPolicy = v3 ? voidPolicyFromWord(vp.voidPolicy ?? 0) : "UNIFORM";
    if (voidPolicy === null)
      return null;
    return {
      version,
      params: {
        makerFeeBps: Number(vp.makerFeeBps),
        takerFeeBps: Number(vp.takerFeeBps),
        maxBuilderFeeBps: Number(vp.maxBuilderFeeBps),
        routingFeeBps: Number(vp.routingFeeBps),
        settlementFeeBps: Number(vp.settlementFeeBps),
        voidPolicy
      }
    };
  } catch {
    return null;
  }
}
async function getMaxVenueFeeBps(client, binaryModule) {
  if (!binaryModule) {
    throw new NotConfiguredError("binaryModule or config.addresses.binaryModule", "this operator read");
  }
  return Number(await client.readContract({ address: binaryModule, abi: binaryModuleFeeParamsAbi, functionName: "MAX_FEE_BPS" }));
}

// node_modules/@somnia-chain/markets-sdk/dist/lend/lendAbi.js
var lendPoolAbi = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)",
  "function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) returns (uint256)",
  "function repayWithATokens(address asset, uint256 amount, uint256 interestRateMode) returns (uint256)",
  "function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)",
  // (totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor)
  "function getUserAccountData(address user) view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
  "function getReservesList() view returns (address[])",
  // ReserveData (v3.0 layout) — the SDK only reads aTokenAddress / variableDebtTokenAddress
  // out of it (native-flow token resolution), but the tuple must match in full to decode.
  "function getReserveData(address asset) view returns (((uint256 data) configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))"
]);
var lendUiPoolDataProviderSignatures = [
  "function getReservesData(address provider) view returns ((address underlyingAsset, string name, string symbol, uint256 decimals, uint256 baseLTVasCollateral, uint256 reserveLiquidationThreshold, uint256 reserveLiquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 liquidityRate, uint128 variableBorrowRate, uint128 stableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint256 availableLiquidity, uint256 totalPrincipalStableDebt, uint256 averageStableRate, uint256 stableDebtLastUpdateTimestamp, uint256 totalScaledVariableDebt, uint256 priceInMarketReferenceCurrency, address priceOracle, uint256 variableRateSlope1, uint256 variableRateSlope2, uint256 stableRateSlope1, uint256 stableRateSlope2, uint256 baseStableBorrowRate, uint256 baseVariableBorrowRate, uint256 optimalUsageRatio, bool isPaused, bool isSiloedBorrowing, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt, bool flashLoanEnabled, uint256 debtCeiling, uint256 debtCeilingDecimals, uint8 eModeCategoryId, uint256 borrowCap, uint256 supplyCap, uint16 eModeLtv, uint16 eModeLiquidationThreshold, uint16 eModeLiquidationBonus, address eModePriceSource, string eModeLabel, bool borrowableInIsolation)[], (uint256 marketReferenceCurrencyUnit, int256 marketReferenceCurrencyPriceInUsd, int256 networkBaseTokenPriceInUsd, uint8 networkBaseTokenPriceDecimals))",
  "function getUserReservesData(address provider, address user) view returns ((address underlyingAsset, uint256 scaledATokenBalance, bool usageAsCollateralEnabledOnUser, uint256 stableBorrowRate, uint256 scaledVariableDebt, uint256 principalStableDebt, uint256 stableBorrowLastUpdateTimestamp)[], uint8)"
];
var lendUiPoolDataProviderAbi = parseAbi(lendUiPoolDataProviderSignatures);
var lendGatewayAbi = parseAbi([
  "function depositETH(address pool, address onBehalfOf, uint16 referralCode) payable",
  "function withdrawETH(address pool, uint256 amount, address to)",
  "function borrowETH(address pool, uint256 amount, uint256 interestRateMode, uint16 referralCode)",
  "function repayETH(address pool, uint256 amount, uint256 interestRateMode, address onBehalfOf) payable",
  "function getWETHAddress() view returns (address)"
]);
var lendDebtTokenAbi = parseAbi([
  "function approveDelegation(address delegatee, uint256 amount)",
  "function borrowAllowance(address fromUser, address toUser) view returns (uint256)"
]);

// node_modules/@somnia-chain/markets-sdk/dist/lend/lender.js
var VARIABLE_RATE = 2n;
var NO_REFERRAL = 0;
function createLenderWithDeps(config, deps) {
  const writer = makeMachineryWriter(config, deps, "createLender");
  const from = typeof writer.from === "string" ? writer.from : writer.from.address;
  async function executeChecked(w) {
    const result2 = await writer.execute(w);
    if (result2.receipt.status !== "success") {
      throw new ContractRevertError({
        functionName: String(w.functionName ?? "call"),
        address: w.to,
        reason: `transaction ${result2.hash} reverted (no revert data recoverable)`
      });
    }
    return result2;
  }
  const requirePool = () => {
    const pool = deps.addresses.pool;
    if (!pool) {
      throw new NotConfiguredError("`pool` in config.addresses.lend", "this lend write");
    }
    return pool;
  };
  const requireGateway = () => {
    const gateway = deps.addresses.wrappedTokenGateway;
    if (!gateway) {
      throw new NotConfiguredError("`wrappedTokenGateway` in config.addresses.lend", "native lend flows");
    }
    return gateway;
  };
  const UNLIMITED_ALLOWANCE_FLOOR = maxUint256 / 2n;
  const approvedPairs = /* @__PURE__ */ new Set();
  async function approveIfNeeded(token, spender, amount, gas) {
    const key = `${token.toLowerCase()}:${spender.toLowerCase()}`;
    if (approvedPairs.has(key))
      return;
    const allowance = await writer.publicClient.readContract({
      address: token,
      abi: erc20ReadAbi,
      functionName: "allowance",
      args: [from, spender]
    });
    if (allowance < amount) {
      await executeChecked({ to: token, abi: erc20WriteAbi, functionName: "approve", args: [spender, maxUint256], gas });
      approvedPairs.add(key);
      return;
    }
    if (allowance >= UNLIMITED_ALLOWANCE_FLOOR)
      approvedPairs.add(key);
  }
  async function delegateIfNeeded(debtToken, delegatee, amount, gas) {
    const key = `delegate:${debtToken.toLowerCase()}:${delegatee.toLowerCase()}`;
    if (approvedPairs.has(key))
      return;
    const allowance = await writer.publicClient.readContract({
      address: debtToken,
      abi: lendDebtTokenAbi,
      functionName: "borrowAllowance",
      args: [from, delegatee]
    });
    if (allowance < amount) {
      await executeChecked({
        to: debtToken,
        abi: lendDebtTokenAbi,
        functionName: "approveDelegation",
        args: [delegatee, maxUint256],
        gas
      });
      approvedPairs.add(key);
      return;
    }
    if (allowance >= UNLIMITED_ALLOWANCE_FLOOR)
      approvedPairs.add(key);
  }
  let nativeTokens;
  function resolveNativeTokens() {
    nativeTokens ?? (nativeTokens = (async () => {
      const gateway = requireGateway();
      const pool = requirePool();
      const wrapped = await writer.publicClient.readContract({
        address: gateway,
        abi: lendGatewayAbi,
        functionName: "getWETHAddress"
      });
      const reserve = await writer.publicClient.readContract({
        address: pool,
        abi: lendPoolAbi,
        functionName: "getReserveData",
        args: [wrapped]
      });
      return { aToken: reserve.aTokenAddress, variableDebtToken: reserve.variableDebtTokenAddress };
    })().catch((e) => {
      nativeTokens = void 0;
      throw e;
    }));
    return nativeTokens;
  }
  return {
    account: from,
    async supply(asset, amount, opts) {
      const pool = requirePool();
      if ((opts == null ? void 0 : opts.approve) !== false)
        await approveIfNeeded(asset, pool, amount, opts == null ? void 0 : opts.gas);
      return executeChecked({
        to: pool,
        abi: lendPoolAbi,
        functionName: "supply",
        args: [asset, amount, (opts == null ? void 0 : opts.onBehalfOf) ?? from, NO_REFERRAL],
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async withdraw(asset, amount, opts) {
      return executeChecked({
        to: requirePool(),
        abi: lendPoolAbi,
        functionName: "withdraw",
        args: [asset, amount, (opts == null ? void 0 : opts.to) ?? from],
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async borrow(asset, amount, opts) {
      return executeChecked({
        to: requirePool(),
        abi: lendPoolAbi,
        functionName: "borrow",
        args: [asset, amount, VARIABLE_RATE, NO_REFERRAL, from],
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async repay(asset, amount, opts) {
      const pool = requirePool();
      if ((opts == null ? void 0 : opts.approve) !== false)
        await approveIfNeeded(asset, pool, amount, opts == null ? void 0 : opts.gas);
      return executeChecked({
        to: pool,
        abi: lendPoolAbi,
        functionName: "repay",
        args: [asset, amount, VARIABLE_RATE, (opts == null ? void 0 : opts.onBehalfOf) ?? from],
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async setUseAsCollateral(asset, useAsCollateral, opts) {
      return executeChecked({
        to: requirePool(),
        abi: lendPoolAbi,
        functionName: "setUserUseReserveAsCollateral",
        args: [asset, useAsCollateral],
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async supplyNative(amount, opts) {
      return executeChecked({
        to: requireGateway(),
        abi: lendGatewayAbi,
        functionName: "depositETH",
        args: [requirePool(), (opts == null ? void 0 : opts.onBehalfOf) ?? from, NO_REFERRAL],
        value: amount,
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async withdrawNative(amount, opts) {
      const gateway = requireGateway();
      const { aToken } = await resolveNativeTokens();
      if ((opts == null ? void 0 : opts.approve) !== false)
        await approveIfNeeded(aToken, gateway, amount, opts == null ? void 0 : opts.gas);
      return executeChecked({
        to: gateway,
        abi: lendGatewayAbi,
        functionName: "withdrawETH",
        args: [requirePool(), amount, (opts == null ? void 0 : opts.to) ?? from],
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async borrowNative(amount, opts) {
      const gateway = requireGateway();
      const { variableDebtToken } = await resolveNativeTokens();
      if ((opts == null ? void 0 : opts.approve) !== false)
        await delegateIfNeeded(variableDebtToken, gateway, amount, opts == null ? void 0 : opts.gas);
      return executeChecked({
        to: gateway,
        abi: lendGatewayAbi,
        functionName: "borrowETH",
        args: [requirePool(), amount, VARIABLE_RATE, NO_REFERRAL],
        gas: opts == null ? void 0 : opts.gas
      });
    },
    async repayNative(amount, opts) {
      return executeChecked({
        to: requireGateway(),
        abi: lendGatewayAbi,
        functionName: "repayETH",
        args: [requirePool(), amount, VARIABLE_RATE, (opts == null ? void 0 : opts.onBehalfOf) ?? from],
        value: amount,
        gas: opts == null ? void 0 : opts.gas
      });
    },
    clearApprovalCache() {
      approvedPairs.clear();
    }
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/lend/math.js
var RAY = 10n ** 27n;
var HALF_RAY = RAY / 2n;
var SECONDS_PER_YEAR = 31536000n;
function rayMul(a, b) {
  return (a * b + HALF_RAY) / RAY;
}
function accrueLinear(indexRay, rateRay, lastUpdateTimestamp, nowSec) {
  const dt = BigInt(Math.max(0, nowSec - lastUpdateTimestamp));
  if (dt === 0n)
    return indexRay;
  const interest = RAY + rateRay * dt / SECONDS_PER_YEAR;
  return rayMul(indexRay, interest);
}
function accrueCompounded(indexRay, rateRay, lastUpdateTimestamp, nowSec) {
  const dt = BigInt(Math.max(0, nowSec - lastUpdateTimestamp));
  if (dt === 0n)
    return indexRay;
  const dtMinusOne = dt > 1n ? dt - 1n : 0n;
  const dtMinusTwo = dt > 2n ? dt - 2n : 0n;
  const basePowerTwo = rayMul(rateRay, rateRay) / (SECONDS_PER_YEAR * SECONDS_PER_YEAR);
  const basePowerThree = rayMul(basePowerTwo, rateRay) / SECONDS_PER_YEAR;
  const secondTerm = dt * dtMinusOne * basePowerTwo / 2n;
  const thirdTerm = dt * dtMinusOne * dtMinusTwo * basePowerThree / 6n;
  const interest = RAY + rateRay * dt / SECONDS_PER_YEAR + secondTerm + thirdTerm;
  return rayMul(indexRay, interest);
}
function lendRayRateToApy(rateRay) {
  const ratePerYear = Number(rateRay) / 1e27;
  const secondsPerYear = Number(SECONDS_PER_YEAR);
  return (1 + ratePerYear / secondsPerYear) ** secondsPerYear - 1;
}

// node_modules/@somnia-chain/markets-sdk/dist/lend/reads.js
function baseCurrencyDecimalsOf(unit) {
  const s = unit.toString();
  return /^10*$/.test(s) ? s.length - 1 : 8;
}
async function fetchReservesData(targets, client) {
  const [rows, baseCurrency] = await client.readContract({
    address: targets.uiPoolDataProvider,
    abi: lendUiPoolDataProviderAbi,
    functionName: "getReservesData",
    args: [targets.poolAddressesProvider]
  });
  return { raw: [...rows], baseCurrencyDecimals: baseCurrencyDecimalsOf(baseCurrency.marketReferenceCurrencyUnit) };
}
function toReserve(r, baseCurrencyDecimals, nowSec) {
  const liquidityIndexNow = accrueLinear(r.liquidityIndex, r.liquidityRate, r.lastUpdateTimestamp, nowSec);
  const borrowIndexNow = accrueCompounded(r.variableBorrowIndex, r.variableBorrowRate, r.lastUpdateTimestamp, nowSec);
  const totalVariableDebt = rayMul(r.totalScaledVariableDebt, borrowIndexNow);
  return {
    underlying: r.underlyingAsset,
    symbol: r.symbol,
    name: r.name,
    decimals: Number(r.decimals),
    aToken: r.aTokenAddress,
    variableDebtToken: r.variableDebtTokenAddress,
    ltvBps: Number(r.baseLTVasCollateral),
    liquidationThresholdBps: Number(r.reserveLiquidationThreshold),
    liquidationBonusBps: Number(r.reserveLiquidationBonus),
    reserveFactorBps: Number(r.reserveFactor),
    usageAsCollateralEnabled: r.usageAsCollateralEnabled,
    borrowingEnabled: r.borrowingEnabled,
    isActive: r.isActive,
    isFrozen: r.isFrozen,
    isPaused: r.isPaused,
    flashLoanEnabled: r.flashLoanEnabled,
    borrowCap: r.borrowCap,
    supplyCap: r.supplyCap,
    availableLiquidity: r.availableLiquidity,
    totalVariableDebt,
    totalSupplied: r.availableLiquidity + totalVariableDebt,
    liquidityRateRay: r.liquidityRate,
    variableBorrowRateRay: r.variableBorrowRate,
    liquidityIndexRay: liquidityIndexNow,
    variableBorrowIndexRay: borrowIndexNow,
    lastUpdateTimestamp: Number(r.lastUpdateTimestamp),
    priceInBaseCurrency: r.priceInMarketReferenceCurrency,
    baseCurrencyDecimals
  };
}
async function listLendReserves(targets, client) {
  const { raw, baseCurrencyDecimals } = await fetchReservesData(targets, client);
  const nowSec = Math.floor(Date.now() / 1e3);
  return raw.map((r) => toReserve(r, baseCurrencyDecimals, nowSec));
}
async function getLendAccount(account, targets, client) {
  const [accountData, userRows, reservesData] = await Promise.all([
    client.readContract({
      address: targets.pool,
      abi: lendPoolAbi,
      functionName: "getUserAccountData",
      args: [account]
    }),
    client.readContract({
      address: targets.uiPoolDataProvider,
      abi: lendUiPoolDataProviderAbi,
      functionName: "getUserReservesData",
      args: [targets.poolAddressesProvider, account]
    }).then((r) => [...r[0]]),
    fetchReservesData(targets, client)
  ]);
  const nowSec = Math.floor(Date.now() / 1e3);
  const byUnderlying = new Map(reservesData.raw.map((r) => [r.underlyingAsset.toLowerCase(), r]));
  const positions = [];
  for (const u of userRows) {
    if (u.scaledATokenBalance === 0n && u.scaledVariableDebt === 0n)
      continue;
    const r = byUnderlying.get(u.underlyingAsset.toLowerCase());
    if (!r)
      continue;
    positions.push({
      underlying: u.underlyingAsset,
      symbol: r.symbol,
      decimals: Number(r.decimals),
      aTokenBalance: rayMul(u.scaledATokenBalance, accrueLinear(r.liquidityIndex, r.liquidityRate, r.lastUpdateTimestamp, nowSec)),
      variableDebt: rayMul(u.scaledVariableDebt, accrueCompounded(r.variableBorrowIndex, r.variableBorrowRate, r.lastUpdateTimestamp, nowSec)),
      usageAsCollateralEnabled: u.usageAsCollateralEnabledOnUser
    });
  }
  const [totalCollateralBase, totalDebtBase, availableBorrowsBase, liqThreshold, ltv, healthFactor] = accountData;
  return {
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThresholdBps: Number(liqThreshold),
    ltvBps: Number(ltv),
    // The Pool reports maxUint256 ("infinite") for a debt-free account.
    healthFactor,
    baseCurrencyDecimals: reservesData.baseCurrencyDecimals,
    positions
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/lend/client.js
function createLendWithDeps(deps, addresses) {
  const { getConfig, getClient } = deps;
  const requireTargets = () => {
    if (!addresses.pool || !addresses.poolAddressesProvider || !addresses.uiPoolDataProvider) {
      throw new NotConfiguredError("config.addresses.lend { pool, poolAddressesProvider, uiPoolDataProvider } (SOMNIA_MAINNET_LEND has the published mainnet deployment)", "this lend read");
    }
    return {
      pool: addresses.pool,
      poolAddressesProvider: addresses.poolAddressesProvider,
      uiPoolDataProvider: addresses.uiPoolDataProvider
    };
  };
  return {
    // async so a missing-address config error REJECTS instead of throwing
    // synchronously — callers (and the React hooks' .then(ok, err) capture)
    // are promised an async error channel.
    listReserves: async () => listLendReserves(requireTargets(), getClient()),
    getAccount: async (account) => getLendAccount(account, requireTargets(), getClient()),
    createLender: (config) => createLenderWithDeps(config, { getConfig, getClient, addresses })
  };
}
var SOMNIA_MAINNET_LEND = {
  pool: "0xEC6758e6324c167DB39B6908036240460a2b0168",
  poolAddressesProvider: "0x1C13Fea2A9a3Ae9962f12B6afAC1AFcd8205f752",
  uiPoolDataProvider: "0x5ef828E2C7C55eea505dA3310b0831eD01189e3E",
  wrappedTokenGateway: "0xc97d0602b501B5123a0558dDFEb2A28fD6C78dB9"
};
var SOMNIA_TESTNET_LEND = {
  pool: "0x7Cb9df1bc191B16BeFF9fdEC2cd1ef91Cac18176",
  poolAddressesProvider: "0xEbf503eD254014C152965C52006A34f7Ab3d28f1",
  uiPoolDataProvider: "0xfAb035cAFe664497a9476d3b11904e284Df758c6",
  wrappedTokenGateway: "0x29edCCDB3aE8CDF0ea6077cd3E682BfA6dD53f19"
};

// node_modules/@somnia-chain/markets-sdk/dist/priceFeed/hasuraWs.js
var RECONNECT_BASE_MS3 = 500;
var RECONNECT_MAX_MS3 = 8e3;
var SUBPROTOCOL = "graphql-transport-ws";
var HasuraWsClient = class {
  /**
   * Creates a subscription socket for one GraphQL endpoint.
   *
   * **Details**
   *
   * - `url`: ws:// or wss:// GraphQL endpoint.
   * - `onStatus`: Called with the live connection state (ack ⇒ true, drop ⇒ false).
   */
  constructor(url, onStatus) {
    __publicField(this, "url");
    __publicField(this, "onStatus");
    __publicField(this, "ws", null);
    __publicField(this, "acked", false);
    __publicField(this, "closed", false);
    __publicField(this, "nextId", 1);
    __publicField(this, "subs", /* @__PURE__ */ new Map());
    __publicField(this, "reconnectTimer", null);
    __publicField(this, "reconnectDelay", RECONNECT_BASE_MS3);
    this.url = url;
    this.onStatus = onStatus;
  }
  /**
   *  Register a subscription. It is (re)sent whenever the socket is live, and
   *  torn down on the returned unsubscribe.
   */
  subscribe(query, variables, onNext, onError) {
    const id2 = String(this.nextId++);
    this.subs.set(id2, { payload: { query, variables }, onNext, onError, started: false });
    this.ensureSocket();
    if (this.acked)
      this.start(id2);
    return () => this.stop(id2);
  }
  /** Tear down the socket and forget every subscription. Idempotent. */
  close() {
    var _a;
    this.closed = true;
    if (this.reconnectTimer)
      clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.subs.clear();
    this.teardownSocket();
    (_a = this.onStatus) == null ? void 0 : _a.call(this, false);
  }
  start(id2) {
    const sub = this.subs.get(id2);
    if (!sub || sub.started || !this.ws || this.ws.readyState !== WebSocket.OPEN)
      return;
    sub.started = true;
    this.send({ id: id2, type: "subscribe", payload: sub.payload });
  }
  stop(id2) {
    var _a;
    const sub = this.subs.get(id2);
    if (!sub)
      return;
    this.subs.delete(id2);
    if (sub.started && ((_a = this.ws) == null ? void 0 : _a.readyState) === WebSocket.OPEN)
      this.send({ id: id2, type: "complete" });
    if (this.subs.size === 0) {
      this.closed = false;
      this.teardownSocket();
    }
  }
  ensureSocket() {
    if (this.ws || this.closed)
      return;
    const WS = globalThis.WebSocket;
    if (!WS) {
      throw new InvalidInputError("price-feed subscriptions need a global WebSocket (browser, or Node ≥ 21). Provide one via globalThis.WebSocket.");
    }
    const ws = new WS(this.url, SUBPROTOCOL);
    this.ws = ws;
    ws.onopen = () => {
      if (this.ws === ws)
        this.send({ type: "connection_init" });
    };
    ws.onmessage = (ev) => {
      if (this.ws === ws)
        this.onMessage(ev.data);
    };
    ws.onclose = () => this.onDisconnect(ws);
    ws.onerror = () => this.onDisconnect(ws);
  }
  onMessage(raw) {
    var _a, _b, _c;
    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : String(raw));
    } catch {
      return;
    }
    switch (msg.type) {
      case "connection_ack": {
        this.acked = true;
        this.reconnectDelay = RECONNECT_BASE_MS3;
        (_a = this.onStatus) == null ? void 0 : _a.call(this, true);
        for (const [id2, sub] of this.subs) {
          sub.started = false;
          this.start(id2);
        }
        break;
      }
      case "next": {
        const sub = msg.id ? this.subs.get(msg.id) : void 0;
        sub == null ? void 0 : sub.onNext((_b = msg.payload) == null ? void 0 : _b.data);
        break;
      }
      case "error": {
        const sub = msg.id ? this.subs.get(msg.id) : void 0;
        (_c = sub == null ? void 0 : sub.onError) == null ? void 0 : _c.call(sub, msg.payload);
        break;
      }
      case "ping":
        this.send({ type: "pong" });
        break;
    }
  }
  onDisconnect(ws) {
    var _a;
    if (this.ws !== ws)
      return;
    this.detach(ws);
    this.ws = null;
    this.acked = false;
    (_a = this.onStatus) == null ? void 0 : _a.call(this, false);
    if (this.closed || this.subs.size === 0)
      return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS3);
    if (this.reconnectTimer)
      clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureSocket();
    }, delay);
  }
  teardownSocket() {
    const ws = this.ws;
    this.ws = null;
    this.acked = false;
    if (!ws)
      return;
    this.detach(ws);
    try {
      ws.close();
    } catch {
    }
  }
  detach(ws) {
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
  }
  send(msg) {
    var _a;
    if (((_a = this.ws) == null ? void 0 : _a.readyState) === WebSocket.OPEN)
      this.ws.send(JSON.stringify(msg));
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/priceFeed/types.js
var PRICE_FEED_DECIMALS = 18;
var PRICE_RESOLUTION_SECONDS = {
  M1: 60,
  H1: 3600,
  D1: 86400
};

// node_modules/@somnia-chain/markets-sdk/dist/priceFeed/query.js
var GQL_TIMEOUT_MS2 = 3e4;
async function gql2(url, query, variables = {}) {
  return postGraphql(url, query, variables, {
    timeoutMs: GQL_TIMEOUT_MS2,
    label: `price-feed ${operationNameOf(query)}`
  });
}
var FEED_FIELDS = `symbol base quote decimals description latestSpot latestMark latestBlockNumber latestBlockTimestamp latestUpdatedAtMs latestSourceUpdatedAtMs latestResynced`;
var POINT_FIELDS = `id base requestId spot mark blockNumber blockTimestamp txHash`;
var CANDLE_FIELDS = `resolution bucketStart open high low close markClose count`;
function baseQuoteFilter(quote) {
  return quote ? { where: "base: {_eq: $base}, quote: {_eq: $quote}", varDecl: ", $quote: String!" } : { where: "base: {_eq: $base}", varDecl: "" };
}
function subscriptionFeed(quote) {
  const { where, varDecl } = baseQuoteFilter(quote);
  return `subscription LiveFeed($base: String!${varDecl}) { Feed(where: {${where}}) { ${FEED_FIELDS} } }`;
}
function subscriptionTicks(quote) {
  const { where, varDecl } = baseQuoteFilter(quote);
  return `subscription LiveTicks($base: String!, $limit: Int!${varDecl}) { PricePoint(where: {${where}}, order_by: {blockTimestamp: desc}, limit: $limit) { ${POINT_FIELDS} } }`;
}
function toHumanPrice(raw, decimals) {
  if (raw === null)
    return 0;
  return Number(raw) / 10 ** decimals;
}
function toSec(s) {
  return s === null ? 0 : Number(s);
}
function toMsOrNull(s) {
  if (s === null || s === void 0)
    return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function assetOf(base, hint) {
  return (base ?? hint ?? "").toUpperCase();
}
function parseFeed(feed, assetHint) {
  const asset = assetOf(feed == null ? void 0 : feed.base, assetHint);
  const decimals = (feed == null ? void 0 : feed.decimals) ?? PRICE_FEED_DECIMALS;
  const hasLatest = !!feed && feed.latestSpot !== null;
  const latest = hasLatest ? {
    asset,
    price: toHumanPrice(feed.latestSpot, decimals),
    ema: toHumanPrice(feed.latestMark, decimals),
    blockNumber: toSec(feed.latestBlockNumber),
    blockTimestamp: toSec(feed.latestBlockTimestamp),
    decimals,
    raw: { price: feed.latestSpot ?? "0", ema: feed.latestMark ?? "0" }
  } : null;
  return {
    asset,
    decimals,
    symbol: (feed == null ? void 0 : feed.symbol) ?? null,
    base: (feed == null ? void 0 : feed.base) ?? null,
    quote: (feed == null ? void 0 : feed.quote) ?? null,
    description: (feed == null ? void 0 : feed.description) ?? null,
    updatedAtMs: toMsOrNull(feed == null ? void 0 : feed.latestUpdatedAtMs),
    sourceUpdatedAtMs: toMsOrNull(feed == null ? void 0 : feed.latestSourceUpdatedAtMs),
    resynced: (feed == null ? void 0 : feed.latestResynced) ?? null,
    latest
  };
}
function parsePoint(p, decimals, assetHint) {
  return {
    id: p.id,
    asset: assetOf(p.base, assetHint),
    price: toHumanPrice(p.spot, decimals),
    ema: toHumanPrice(p.mark, decimals),
    requestId: p.requestId,
    blockNumber: Number(p.blockNumber),
    blockTimestamp: Number(p.blockTimestamp),
    txHash: p.txHash,
    raw: { price: p.spot, ema: p.mark }
  };
}
function parseCandle(asset, c, decimals) {
  return {
    asset,
    resolution: c.resolution,
    bucketStart: Number(c.bucketStart),
    open: toHumanPrice(c.open, decimals),
    high: toHumanPrice(c.high, decimals),
    low: toHumanPrice(c.low, decimals),
    close: toHumanPrice(c.close, decimals),
    emaClose: toHumanPrice(c.markClose, decimals),
    count: Number(c.count)
  };
}
async function loadPriceSnapshot(url, asset, ticks, quote) {
  const { where, varDecl } = baseQuoteFilter(quote);
  const data = await gql2(url, `query PriceSnapshot($base: String!, $limit: Int!${varDecl}) {
      Feed(where: {${where}}) { ${FEED_FIELDS} }
      PricePoint(where: {${where}}, order_by: {blockTimestamp: desc}, limit: $limit) { ${POINT_FIELDS} }
    }`, { base: asset.toUpperCase(), limit: ticks, ...quote ? { quote } : {} });
  const info = parseFeed(data.Feed[0], asset);
  const points = data.PricePoint.map((p) => parsePoint(p, info.decimals, asset));
  return { info, points };
}
async function getPriceFeedInfo(url, asset, quote) {
  const { where, varDecl } = baseQuoteFilter(quote);
  const data = await gql2(url, `query PriceFeed($base: String!${varDecl}) { Feed(where: {${where}}) { ${FEED_FIELDS} } }`, { base: asset.toUpperCase(), ...quote ? { quote } : {} });
  return parseFeed(data.Feed[0], asset);
}
async function listFeeds(url, assets, quote) {
  if (assets && assets.length === 0)
    return [];
  const filtered = assets !== void 0;
  const varDecls = [filtered ? "$bases: [String!]!" : null, quote ? "$quote: String!" : null].filter(Boolean).join(", ");
  const conds = [filtered ? "base: {_in: $bases}" : null, quote ? "quote: {_eq: $quote}" : null].filter(Boolean).join(", ");
  const whereClause = conds ? `where: {${conds}}, ` : "";
  const data = await gql2(url, `query PriceFeeds${varDecls ? `(${varDecls})` : ""} { Feed(${whereClause}order_by: {base: asc}) { ${FEED_FIELDS} } }`, { ...filtered ? { bases: assets.map((a) => a.toUpperCase()) } : {}, ...quote ? { quote } : {} });
  return data.Feed.map((f) => parseFeed(f));
}
async function getLivePrices(url, assets, quote) {
  const feeds = await listFeeds(url, assets, quote);
  return feeds.map((f) => f.latest).filter((p) => p !== null);
}
async function getPriceHistory(url, asset, opts, quote) {
  const clauses = ["{base: {_eq: $base}}"];
  if (quote)
    clauses.push("{quote: {_eq: $quote}}");
  if ((opts == null ? void 0 : opts.from) !== void 0)
    clauses.push(`{blockTimestamp: {_gte: "${Math.floor(opts.from)}"}}`);
  if ((opts == null ? void 0 : opts.to) !== void 0)
    clauses.push(`{blockTimestamp: {_lte: "${Math.floor(opts.to)}"}}`);
  const data = await gql2(url, `query PriceHistory($base: String!, $limit: Int!${quote ? ", $quote: String!" : ""}) {
      PricePoint(where: {_and: [${clauses.join(", ")}]}, order_by: {blockTimestamp: desc}, limit: $limit) { ${POINT_FIELDS} }
    }`, { base: asset.toUpperCase(), limit: (opts == null ? void 0 : opts.limit) ?? 500, ...quote ? { quote } : {} });
  return data.PricePoint.map((p) => parsePoint(p, PRICE_FEED_DECIMALS, asset));
}
async function getPriceCandles(url, asset, resolution, opts, quote) {
  const clauses = ["{base: {_eq: $base}}", `{resolution: {_eq: ${resolution}}}`];
  if (quote)
    clauses.push("{quote: {_eq: $quote}}");
  if ((opts == null ? void 0 : opts.from) !== void 0)
    clauses.push(`{bucketStart: {_gte: "${Math.floor(opts.from)}"}}`);
  if ((opts == null ? void 0 : opts.to) !== void 0)
    clauses.push(`{bucketStart: {_lte: "${Math.floor(opts.to)}"}}`);
  const data = await gql2(url, `query PriceCandles($base: String!, $limit: Int!${quote ? ", $quote: String!" : ""}) {
      Candle(where: {_and: [${clauses.join(", ")}]}, order_by: {bucketStart: desc}, limit: $limit) { ${CANDLE_FIELDS} }
    }`, { base: asset.toUpperCase(), limit: (opts == null ? void 0 : opts.limit) ?? 500, ...quote ? { quote } : {} });
  return data.Candle.reverse().map((c) => parseCandle(asset.toUpperCase(), c, PRICE_FEED_DECIMALS));
}

// node_modules/@somnia-chain/markets-sdk/dist/priceFeed/priceFeed.js
var SNAPSHOT_TICKS = 200;
var LIVE_TAPE_LIMIT = 100;
var RELEASE_LINGER_MS2 = 3e4;
var PriceFeed = class {
  constructor(deps) {
    __publicField(this, "deps");
    __publicField(this, "refs", /* @__PURE__ */ new Map());
    __publicField(this, "tails", /* @__PURE__ */ new Map());
    __publicField(this, "hydrations", /* @__PURE__ */ new Map());
    __publicField(this, "lingers", /* @__PURE__ */ new Map());
    this.deps = deps;
  }
  /**
   *  Watch one asset's price: hydrate a snapshot and stream live updates. Resolves
   *  once the snapshot has landed (reads are populated); the socket connecting (or
   *  dropping later) is handled transparently. Rejects + releases the ref on a
   *  failed snapshot or an unconfigured asset.
   */
  async watchPrice(asset) {
    const key = this.keyOf(asset);
    this.acquire(key);
    try {
      if (!this.tails.has(key)) {
        await this.ensureHydration(key, () => this.hydrate(asset, key));
      }
    } catch (e) {
      this.releaseNow(key);
      throw e;
    }
    return this.handle(() => this.release(key));
  }
  /** Per-asset watch state (see {@link PriceFeedStatus}). */
  getStatus(asset) {
    return this.deps.store.getStatus(this.keyOf(asset));
  }
  /**
   *  Tear down every price watch, subscription, and timer. The store keeps its
   *  last state (reads keep answering, stale).
   */
  stopAll() {
    for (const t of this.lingers.values())
      clearTimeout(t);
    this.lingers.clear();
    for (const key of [...this.tails.keys()])
      this.teardown(key);
    this.refs.clear();
    this.hydrations.clear();
    this.deps.store.setGlobalStatus({ wsConnected: false, watchCount: 0 });
    this.deps.store.commit();
  }
  // ---- hydration + subscription ----
  async hydrate(asset, key) {
    const feed = resolvePriceFeed(this.deps.getConfig());
    const assetKey2 = asset.toUpperCase();
    this.deps.store.setStatus(key, "hydrating");
    this.deps.store.commit();
    const { info, points } = await loadPriceSnapshot(feed.url, assetKey2, SNAPSHOT_TICKS, feed.quote);
    this.deps.store.setInfo(assetKey2, info);
    this.deps.store.mergeTicks(assetKey2, points);
    if ((this.refs.get(key) ?? 0) > 0)
      this.subscribe(assetKey2, key, feed.url, feed.wsUrl, feed.quote);
    this.deps.store.setStatus(key, "live");
    this.deps.store.setGlobalStatus({ watchCount: this.tails.size });
    this.deps.store.commit();
  }
  subscribe(asset, key, url, wsUrl, quote) {
    if (this.tails.has(key))
      return;
    const ws = new HasuraWsClient(wsUrl, (connected) => this.onConnStatus(key, connected));
    const tail = { ws, unsubscribes: [], connected: false };
    this.tails.set(key, tail);
    const quoteVar = quote ? { quote } : {};
    tail.unsubscribes.push(ws.subscribe(subscriptionFeed(quote), { base: asset, ...quoteVar }, (data) => {
      var _a;
      const feed = (_a = data == null ? void 0 : data.Feed) == null ? void 0 : _a[0];
      if (!feed)
        return;
      this.deps.store.setInfo(asset, parseFeed(feed, asset));
      this.deps.store.commit();
    }));
    tail.unsubscribes.push(ws.subscribe(subscriptionTicks(quote), { base: asset, limit: LIVE_TAPE_LIMIT, ...quoteVar }, (data) => {
      const rows = data == null ? void 0 : data.PricePoint;
      if (!(rows == null ? void 0 : rows.length))
        return;
      const info = this.deps.store.getInfo(asset);
      const decimals = (info == null ? void 0 : info.decimals) ?? 18;
      this.deps.store.mergeTicks(asset, rows.map((r) => parsePoint(r, decimals, asset)));
      this.deps.store.commit();
    }));
  }
  onConnStatus(key, connected) {
    const tail = this.tails.get(key);
    if (!tail)
      return;
    tail.connected = connected;
    const anyConnected = [...this.tails.values()].some((t) => t.connected);
    this.deps.store.setGlobalStatus({ wsConnected: anyConnected });
    this.deps.store.commit();
  }
  // ---- refcount + linger plumbing (mirrors LiveTail) ----
  acquire(key) {
    this.cancelLinger(key);
    this.refs.set(key, (this.refs.get(key) ?? 0) + 1);
  }
  release(key) {
    const count = (this.refs.get(key) ?? 0) - 1;
    if (count > 0) {
      this.refs.set(key, count);
      return;
    }
    this.refs.set(key, 0);
    this.linger(key, () => this.teardown(key));
  }
  releaseNow(key) {
    const count = (this.refs.get(key) ?? 0) - 1;
    if (count > 0)
      this.refs.set(key, count);
    else
      this.refs.delete(key);
  }
  teardown(key) {
    this.refs.delete(key);
    this.hydrations.delete(key);
    const tail = this.tails.get(key);
    if (tail) {
      for (const u of tail.unsubscribes)
        u();
      tail.ws.close();
      this.tails.delete(key);
    }
    this.deps.store.purgeAsset(key);
    this.deps.store.setGlobalStatus({
      watchCount: this.tails.size,
      wsConnected: [...this.tails.values()].some((t) => t.connected)
    });
    this.deps.store.commit();
  }
  handle(stop) {
    let stopped = false;
    return {
      stop: () => {
        if (stopped)
          return;
        stopped = true;
        stop();
      }
    };
  }
  linger(key, teardown) {
    this.cancelLinger(key);
    this.lingers.set(key, setTimeout(() => {
      this.lingers.delete(key);
      teardown();
    }, RELEASE_LINGER_MS2));
  }
  cancelLinger(key) {
    const t = this.lingers.get(key);
    if (t) {
      clearTimeout(t);
      this.lingers.delete(key);
    }
  }
  async ensureHydration(key, run) {
    const inFlight = this.hydrations.get(key);
    if (inFlight)
      return inFlight;
    const p = run().finally(() => this.hydrations.delete(key));
    this.hydrations.set(key, p);
    return p;
  }
  keyOf(asset) {
    return asset.toUpperCase();
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/priceFeed/priceStore.js
var MAX_TICKS_PER_ASSET = 1e3;
function assetKey(asset) {
  return asset.toUpperCase();
}
var PriceStore = class {
  constructor() {
    __publicField(this, "assets", /* @__PURE__ */ new Map());
    __publicField(this, "status", { wsConnected: false, watchCount: 0 });
    __publicField(this, "version", 0);
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "cache", /* @__PURE__ */ new Map());
    __publicField(this, "subscribe", (listener) => {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    });
  }
  getVersion() {
    return this.version;
  }
  /** Bump version and notify subscribers. Call once per applied batch/status change. */
  commit() {
    this.version++;
    for (const l of this.listeners)
      l();
  }
  /** Memoized derived snapshot — stable reference while version is unchanged. */
  select(key, compute) {
    const hit = this.cache.get(key);
    if (hit && hit.v === this.version)
      return hit.val;
    const val = compute();
    this.cache.set(key, { v: this.version, val });
    return val;
  }
  state(asset) {
    const key = assetKey(asset);
    let s = this.assets.get(key);
    if (!s) {
      s = { latest: null, info: null, ticks: /* @__PURE__ */ new Map(), status: "unwatched" };
      this.assets.set(key, s);
    }
    return s;
  }
  // ---- mutations (do not commit; callers batch then commit) ----
  setStatus(asset, status) {
    this.state(asset).status = status;
  }
  setLatest(asset, latest) {
    const s = this.state(asset);
    if (s.latest && latest.blockNumber < s.latest.blockNumber)
      return;
    s.latest = latest;
    if (s.info)
      s.info = { ...s.info, latest };
  }
  setInfo(asset, info) {
    this.state(asset).info = info;
    if (info.latest)
      this.setLatest(asset, info.latest);
  }
  mergeTicks(asset, points) {
    const s = this.state(asset);
    for (const p of points)
      s.ticks.set(p.id, p);
    if (s.ticks.size > MAX_TICKS_PER_ASSET) {
      const sorted = [...s.ticks.values()].sort(cmpTickDesc);
      for (const p of sorted.slice(MAX_TICKS_PER_ASSET))
        s.ticks.delete(p.id);
    }
  }
  setGlobalStatus(patch) {
    this.status = { ...this.status, ...patch };
  }
  /** Drop one asset's cached rows (its watch was released). */
  purgeAsset(asset) {
    this.assets.delete(assetKey(asset));
  }
  // ---- selectors (memoized, stable references between mutations) ----
  getLatest(asset) {
    const key = assetKey(asset);
    return this.select(`latest:${key}`, () => {
      var _a;
      return ((_a = this.assets.get(key)) == null ? void 0 : _a.latest) ?? null;
    });
  }
  getInfo(asset) {
    const key = assetKey(asset);
    return this.select(`info:${key}`, () => {
      var _a;
      return ((_a = this.assets.get(key)) == null ? void 0 : _a.info) ?? null;
    });
  }
  getStatus(asset) {
    var _a;
    return ((_a = this.assets.get(assetKey(asset))) == null ? void 0 : _a.status) ?? "unwatched";
  }
  /** Recent ticks for an asset, newest first (up to `limit`). */
  getTicks(asset, limit) {
    const key = assetKey(asset);
    return this.select(`ticks:${key}:${limit}`, () => {
      const s = this.assets.get(key);
      if (!s)
        return EMPTY_TICKS;
      return [...s.ticks.values()].sort(cmpTickDesc).slice(0, limit);
    });
  }
  getGlobalStatus() {
    return this.select("global", () => this.status);
  }
};
var EMPTY_TICKS = [];
function cmpTickDesc(a, b) {
  return b.blockTimestamp - a.blockTimestamp || b.blockNumber - a.blockNumber;
}

// node_modules/@somnia-chain/markets-sdk/dist/createClient.js
var EMPTY_BINARY_BOOK = { yesBids: [], yesAsks: [], noBids: [], noAsks: [] };
function createClient(config) {
  if (!config.indexerUrl) {
    throw new NotConfiguredError("indexerUrl", "createClient");
  }
  const url = config.indexerUrl;
  const indexerHeaders = config.indexerHeaders;
  if (config.signal)
    registerIndexerSignal(url, config.signal);
  const store = new MaterializerStore();
  const getConfig = () => config;
  const dbg = makeDebug(config.debug);
  const resolveWsUrl = () => {
    var _a;
    const wsRpcUrl = config.wsRpcUrl ?? ((_a = config.chain.rpcUrls.default.webSocket) == null ? void 0 : _a[0]);
    if (!wsRpcUrl) {
      throw new NotConfiguredError("wsRpcUrl in createClient (or a chain whose rpcUrls carry a webSocket endpoint)", "this operation needs chain access");
    }
    return wsRpcUrl;
  };
  let clients;
  const getClients = () => {
    if (!clients)
      clients = makePublicClient(config.chain, resolveWsUrl());
    return clients;
  };
  const getClient = () => getClients().decorated;
  const tail = new LiveTail({ getConfig, store, getClient, dbg });
  const requireOracleHub = () => {
    var _a;
    const hub = (_a = config.addresses) == null ? void 0 : _a.oracleHub;
    if (!hub) {
      throw new NotConfiguredError("config.addresses.oracleHub", "this read needs the OracleHub");
    }
    return hub;
  };
  const priceStore = new PriceStore();
  const priceFeed = new PriceFeed({ getConfig, store: priceStore });
  const feedUrl = () => resolvePriceFeed(config).url;
  const feedQuote = () => resolvePriceFeed(config).quote;
  const resolvePoolTarget = async (target) => {
    if (target.pool != null)
      return { pool: target.pool.toLowerCase() };
    if (target.marketId != null) {
      const m = await getBinaryMarket(target.marketId, url);
      if (!m)
        throw new InvalidInputError(`no binary market ${target.marketId}`);
      return { pool: m.poolAddress.toLowerCase() };
    }
    throw new InvalidInputError("needs a pool or marketId");
  };
  const _bookParamsCache = new AsyncCache();
  const bookParamsFor = (pool) => {
    const key = pool.toLowerCase();
    return _bookParamsCache.getOrCreate(key, () => getBinaryBookParams(key, getClient()));
  };
  const resolveLiveBinaryBook = (target, depth) => {
    if (target.marketId != null) {
      const id2 = target.marketId.toLowerCase();
      return {
        book: client.getLiveBinaryOrderBookByMarket(id2, { depth }),
        market: store.markets.get(id2) ?? null
      };
    }
    if (target.pool != null) {
      return {
        book: client.getLiveBinaryOrderBook(target.pool, { depth }),
        market: store.marketByPool(target.pool)
      };
    }
    throw new InvalidInputError("needs a pool or marketId");
  };
  let lendClient;
  const client = {
    config,
    // The undecorated client, on the SAME socket — deliberately a method, so
    // reaching outside the SDK's error contract is an explicit act (and so the
    // socket-opening side effect isn't hidden behind a field read).
    getViemClient: () => getClients().raw,
    get lend() {
      var _a;
      lendClient ?? (lendClient = createLendWithDeps({ getConfig, getClient }, ((_a = config.addresses) == null ? void 0 : _a.lend) ?? {}));
      return lendClient;
    },
    watchMarket: (pool) => tail.watchMarket(pool),
    watchMarkets: (opts) => tail.watchAllMarkets((opts == null ? void 0 : opts.discover) ?? false),
    watchUser: (user) => tail.watchUser(user),
    getWatchStatus: (pool) => tail.getWatchStatus(pool),
    stopLive: () => {
      tail.stopLive();
      priceFeed.stopAll();
    },
    subscribeLive: (listener) => store.subscribe(listener),
    getLiveStatus: () => store.getStatus(),
    isTailing: () => store.getStatus().mode === "tailing",
    getLiveMarkets: () => store.allMarkets(),
    getLiveMarketByPool: (pool) => store.marketByPool(pool),
    getLiveMarketByAddress: (addr) => store.marketByAddress(addr),
    getLiveFills: (pool, opts) => store.recentFills(pool, (opts == null ? void 0 : opts.limit) ?? 40),
    getLiveFundingUpdates: (pool, opts) => store.fundingUpdatesFor(pool, (opts == null ? void 0 : opts.limit) ?? 500),
    getLiveUserFills: (pool, user, opts) => store.userFills(pool, user, (opts == null ? void 0 : opts.limit) ?? 50),
    getLiveUserOrders: (pool, user, opts) => store.userOrders(pool, user, (opts == null ? void 0 : opts.limit) ?? 100),
    getLiveBinaryOrderBook: (pool, opts) => {
      const depth = (opts == null ? void 0 : opts.depth) ?? 10;
      return store.select(`bookyn:${pool.toLowerCase()}:${depth}`, () => {
        const { bids, asks } = store.bookLevels(pool, depth);
        const m = store.marketByPool(pool);
        const oneBase = 10n ** BigInt((m == null ? void 0 : m.quoteDecimals) ?? DECIMALS);
        return toBinaryBook(bids, asks, oneBase);
      });
    },
    getLiveBinaryOrderBookByMarket: (marketId, opts) => {
      const depth = (opts == null ? void 0 : opts.depth) ?? 10;
      const id2 = marketId.toLowerCase();
      return store.select(`bookynm:${id2}:${depth}`, () => {
        var _a;
        const levels = store.bookLevelsByMarket(id2, depth);
        if (!levels)
          return EMPTY_BINARY_BOOK;
        const oneBase = 10n ** BigInt(((_a = store.markets.get(id2)) == null ? void 0 : _a.quoteDecimals) ?? DECIMALS);
        return toBinaryBook(levels.bids, levels.asks, oneBase);
      });
    },
    getLiveSpotOrderBook: (pool, opts) => store.bookLevels(pool, (opts == null ? void 0 : opts.depth) ?? 12),
    // ---- P1 derived reads (analytics bundle; derived from existing data) ----
    quoteBinaryOrder: (params) => {
      const depth = params.depth ?? 10;
      let book;
      let market;
      if (params.marketId != null) {
        const id2 = params.marketId.toLowerCase();
        book = client.getLiveBinaryOrderBookByMarket(id2, { depth });
        market = store.markets.get(id2) ?? null;
      } else if (params.pool != null) {
        book = client.getLiveBinaryOrderBook(params.pool, { depth });
        market = store.marketByPool(params.pool);
      } else {
        throw new InvalidInputError("quoteBinaryOrder needs a pool or marketId");
      }
      const oneCollateral = 10n ** BigInt((market == null ? void 0 : market.quoteDecimals) ?? DECIMALS);
      return quoteBinaryOrderOverBook(book, params.side, params.quantity, oneCollateral);
    },
    getBinaryBookParams: (pool) => bookParamsFor(pool),
    getClosingPrice: (pool) => getClosingPrice(pool, getClient()),
    quoteBinaryStake: async (params) => {
      const { book, market } = resolveLiveBinaryBook(params, params.depth ?? 10);
      const pool = params.pool ?? (market == null ? void 0 : market.poolAddress) ?? (await resolvePoolTarget(params)).pool;
      const grid = await bookParamsFor(pool);
      const oneCollateral = 10n ** BigInt((market == null ? void 0 : market.quoteDecimals) ?? DECIMALS);
      return quoteBinaryStakeOverBook(book, params.side, params.stake, oneCollateral, {
        ...grid,
        slippageBps: params.slippageBps,
        slippageMinTicks: params.slippageMinTicks
      });
    },
    quoteBinarySell: async (params) => {
      const { book, market } = resolveLiveBinaryBook(params, params.depth ?? 10);
      const pool = params.pool ?? (market == null ? void 0 : market.poolAddress) ?? (await resolvePoolTarget(params)).pool;
      const grid = await bookParamsFor(pool);
      const oneCollateral = 10n ** BigInt((market == null ? void 0 : market.quoteDecimals) ?? DECIMALS);
      return quoteBinarySellOverBook(book, params.side, params.quantity, oneCollateral, {
        ...grid,
        slippageBps: params.slippageBps,
        slippageMinTicks: params.slippageMinTicks
      });
    },
    getMarketStats24h: async (target) => {
      const { pool } = await resolvePoolTarget(target);
      const nowSec = Math.floor(Date.now() / 1e3);
      const candles = await getCandles(pool, 3600, { from: nowSec - 86400, to: nowSec }, url);
      return marketStats24hFromCandles(candles, nowSec);
    },
    getBinaryPositionPnL: async (account, marketId) => {
      const market = await getBinaryMarket(marketId, url);
      if (!market) {
        throw new InvalidInputError(`getBinaryPositionPnL — no binary market ${marketId}`);
      }
      const oneCollateral = 10n ** BigInt(market.quoteDecimals ?? DECIMALS);
      const readBookTop = async () => {
        var _a, _b;
        try {
          const book = await getBinaryOrderBook(market.poolAddress, { decimals: market.quoteDecimals ?? DECIMALS, depth: 1 }, getClient());
          return { bestBid: (_a = book.yesBids[0]) == null ? void 0 : _a.price, bestAsk: (_b = book.yesAsks[0]) == null ? void 0 : _b.price };
        } catch {
          return void 0;
        }
      };
      const [fills, actions, balances, bookTop] = await Promise.all([
        // Scope the fills by MARKET, not just by pool: a binary pool is recycled
        // across successive markets, so a pool-only predicate also returns the
        // earlier markets' fills — and it does so BEFORE `limit` applies, which
        // no post-filter can repair. The pool predicate rides along because
        // `Fill` is indexed on `(pool, timestamp)` and `market_id` is not.
        getUserFills(account, { market: marketId, pool: market.poolAddress, limit: 1e3 }, url),
        getRouterActions(account, { market: marketId, limit: 1e3 }, url),
        getOutcomeBalances(account, market.marketAddress, url),
        readBookTop()
      ]);
      const events = pnlEventsFor(account, fills, actions);
      return computePositionPnL(events, { balanceYes: BigInt(balances.yes), balanceNo: BigInt(balances.no) }, market, oneCollateral, { bookTop });
    },
    getOpenPositionsWithPnL: async (account) => {
      const { positions } = await getPortfolio(account, { ordersLimit: 0, tradesLimit: 0 }, url);
      if (positions.length === 0)
        return [];
      const marketIds = [...new Set(positions.map((p) => p.market.id))];
      const [fills, actions, bookTops] = await Promise.all([
        getUserFills(account, { markets: marketIds, limit: 1e3 }, url),
        getRouterActions(account, { markets: marketIds, limit: 1e3 }, url),
        getBookTops(marketIds, url)
      ]);
      return computeOpenPositionsPnL(account, positions, fills, actions, bookTops);
    },
    getClaimable: async (account) => {
      const portfolio = await getPortfolio(account, { ordersLimit: 0, tradesLimit: 0 }, url);
      const settled = portfolio.positions.filter((p) => p.market.voided || p.market.winningOutcome != null);
      const feeCache = /* @__PURE__ */ new Map();
      const feeFor = async (id2) => {
        const hit = feeCache.get(id2);
        if (hit != null)
          return hit;
        const fees = await getMarketFees(id2, url);
        const bps = (fees == null ? void 0 : fees.settlementFeeBps) != null ? BigInt(fees.settlementFeeBps) : 0n;
        feeCache.set(id2, bps);
        return bps;
      };
      const inputs = [];
      for (const p of settled) {
        const isWinner = !p.market.voided && p.market.winningOutcome === p.outcomeIndex;
        inputs.push({
          marketId: p.market.id,
          pool: p.market.poolAddress,
          outcomeIdx: p.outcomeIndex === 1 ? 1 : 0,
          amount: BigInt(p.balance),
          winningOutcome: p.market.winningOutcome ?? null,
          voided: p.market.voided,
          status: p.market.status,
          settlementFeeBps: isWinner ? await feeFor(p.market.id) : 0n
        });
      }
      return claimableFrom(inputs);
    },
    watchPrice: (asset) => priceFeed.watchPrice(asset),
    watchPrices: async (assets) => {
      const settled = await Promise.allSettled(assets.map((a) => priceFeed.watchPrice(a)));
      const handles = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const failed = settled.find((r) => r.status === "rejected");
      if (failed) {
        handles.forEach((h) => h.stop());
        throw failed.reason;
      }
      return { stop: () => handles.forEach((h) => h.stop()) };
    },
    getPriceStatus: (asset) => priceFeed.getStatus(asset),
    subscribePrices: (listener) => priceStore.subscribe(listener),
    getLivePrice: (asset) => priceStore.getLatest(asset),
    getLivePrices: (assets) => assets.map((a) => priceStore.getLatest(a)),
    getLivePriceTicks: (asset, opts) => priceStore.getTicks(asset, (opts == null ? void 0 : opts.limit) ?? 100),
    getLivePriceFeedInfo: (asset) => priceStore.getInfo(asset),
    fetchPriceFeedInfo: (asset) => getPriceFeedInfo(feedUrl(), asset, feedQuote()),
    fetchPrice: (asset) => getPriceFeedInfo(feedUrl(), asset, feedQuote()).then((info) => info.latest),
    fetchPrices: (assets) => getLivePrices(feedUrl(), assets, feedQuote()),
    listPriceFeeds: () => listFeeds(feedUrl(), void 0, feedQuote()),
    fetchPriceHistory: (asset, opts) => getPriceHistory(feedUrl(), asset, opts, feedQuote()),
    fetchPriceCandles: (asset, resolution, opts) => getPriceCandles(feedUrl(), asset, resolution, opts, feedQuote()),
    listMarkets: (opts) => listMarkets(opts, url),
    listRegistryMarkets: () => listRegistryMarkets(url),
    countMarkets: (opts) => countMarkets(opts ?? {}, url, indexerHeaders),
    countMarketsBounded: (opts) => countMarketsBounded(opts ?? {}, url, indexerHeaders),
    getMarket: (id2) => getMarket(id2, url),
    listBinaryMarkets: (opts) => listBinaryMarkets(opts, url),
    listLiveBinaryMarkets: (filter) => listLiveBinaryMarkets(filter, url),
    listBinaryVenueIds: () => listBinaryVenueIds(url),
    listBinaryAssets: () => listBinaryAssets(url),
    countBinaryMarkets: (opts) => countBinaryMarkets(opts, url, indexerHeaders),
    countBinaryMarketsBounded: (opts) => countBinaryMarketsBounded(opts, url, indexerHeaders),
    listPastBinaryMarkets: (opts) => listPastBinaryMarkets(opts, url),
    getBinaryMarket: (id2) => getBinaryMarket(id2, url),
    getBinaryMarketByAddress: (marketAddress) => getBinaryMarketByAddress(marketAddress, url),
    getMarketFees: (id2) => getMarketFees(id2, url),
    listSpotMarkets: (opts) => listSpotMarkets(opts, url),
    getSpotMarket: (id2) => getSpotMarket(id2, url),
    getMarketStatusHistory: (marketId) => getMarketStatusHistory(marketId, url),
    listPerpMarkets: (opts) => listPerpMarkets(opts, url),
    getPerpMarket: (id2) => getPerpMarket(id2, url),
    getCandles: (pool, interval, opts) => getCandles(pool, interval, opts, url),
    getMarketActivity: (market, opts) => getMarketActivity(market, opts, url),
    getTransactionActivity: (txHash, opts) => getTransactionActivity(txHash, opts, url),
    getFills: (pool, opts) => getFills(pool, opts, url),
    getTradeContext: (id2) => getTradeContext(id2, url),
    getUserFills: (account, opts) => getUserFills(account, opts, url),
    getFill: (id2) => getFill(id2, url),
    getOrderFills: (pool, orderId, opts) => getOrderFills(pool, orderId, opts ?? {}, url),
    getOrder: (pool, orderId) => getOrder(pool, orderId, url),
    getOpenOrders: (owner, opts) => getOpenOrders(owner, opts, url),
    getOrders: (owner, opts) => getOrders(owner, opts, url),
    listSweepableOrders: (opts) => listSweepableOrders(opts ?? {}, url),
    getOutcomeBalances: (account, marketAddress) => getOutcomeBalances(account, marketAddress, url),
    getPortfolio: (account, opts) => getPortfolio(account, opts, url),
    getSpotPortfolio: (account, opts) => getSpotPortfolio(account, opts, url),
    getSpotStopOrders: (account, opts) => getSpotStopOrders(account, opts, url),
    getPerpPortfolio: (account, opts) => getPerpPortfolio(account, opts, url),
    listPerpStopOrders: (opts) => listPerpStopOrders(opts ?? {}, url),
    getPerpStopOrder: (ref) => getPerpStopOrder(ref, getClient()),
    getPerpStopOrderSomiPayment: (registry) => getPerpStopOrderSomiPayment(registry, getClient()),
    getUnclaimedPerpStopSomi: (ref) => getUnclaimedPerpStopSomi(ref, getClient()),
    listPerpOrderHistory: (account, opts) => listPerpOrderHistory(account, opts ?? {}, url),
    getSyncStatus: (chainId) => getSyncStatus(chainId, url),
    getMarketByPool: (pool) => getMarketByPool(pool, url),
    listMarketsByPool: (pool, opts) => listMarketsByPool(pool, opts ?? {}, url),
    countOrders: (owner, opts) => countOrders(owner, opts ?? {}, url, indexerHeaders),
    countUserFills: (account, opts) => countUserFills(account, opts ?? {}, url, indexerHeaders),
    getRouterActions: (account, opts) => getRouterActions(account, opts ?? {}, url),
    getMarketResolution: (marketId) => getMarketResolution(marketId, url),
    getOpeningPrices: (marketIds) => getOpeningPrices(marketIds, url),
    getResolutionPrices: (marketIds) => getResolutionPrices(marketIds, url),
    getBookTops: (marketIds) => getBookTops(marketIds, url),
    listProtocolFees: (opts) => listProtocolFees(opts ?? {}, url),
    listBuilderFees: (opts) => listBuilderFees(opts ?? {}, url),
    listSettlementFees: (opts) => listSettlementFees(opts ?? {}, url),
    listBuilderApprovals: (opts) => listBuilderApprovals(opts ?? {}, url),
    getVaultPayoutFallbacks: (owner, opts) => getVaultPayoutFallbacks(owner, opts ?? {}, url),
    getFundingPayments: (account, opts) => getFundingPayments(account, opts ?? {}, url),
    getMarginEvents: (account, opts) => getMarginEvents(account, opts ?? {}, url),
    getLiquidations: (opts) => getLiquidations(opts ?? {}, url),
    getFundingRateHistory: (pool, opts) => getFundingRateHistory(pool, opts ?? {}, url),
    listFundingRateHistory: (pool, opts) => listFundingRateHistory(pool, opts ?? {}, url),
    listFundingRateCandles: (pool, intervalSeconds, opts) => listFundingRateCandles(pool, intervalSeconds, opts ?? {}, url),
    getOpenInterestHistory: (pool, opts) => getOpenInterestHistory(pool, opts ?? {}, url),
    listPerpFees: (opts) => listPerpFees(opts ?? {}, url),
    // An indexer read living in the perp STATE module: positions are one concept,
    // and CONVENTIONS.md scopes modules by concept, never by transport direction.
    listPerpPositions: (account, opts) => listPerpPositions(account, opts ?? {}, url),
    getBinaryOrderBook: (pool, opts) => getBinaryOrderBook(pool, opts, getClient()),
    getSpotOrderBook: (pool, opts) => getSpotOrderBook(pool, opts, getClient()),
    getOrderOnchain: (pool, orderId) => getOrderOnchain(pool, orderId, getClient()),
    getOwnOpenOrdersOnchain: (pool, owner) => getOwnOpenOrdersOnchain(pool, owner, getClient()),
    getAllOpenOrdersOnchain: (pool, opts) => getAllOpenOrdersOnchain(pool, opts, getClient()),
    getPerpState: (pool) => getPerpState(pool, getClient()),
    getPerpPosition: (ref) => getPerpPosition(ref, getClient()),
    getMarginAccount: (marginBank, account) => getMarginAccount(marginBank, account, getClient()),
    getAccountHealth: (marginBank, account) => getAccountHealth(marginBank, account, getClient()),
    getLiquidationPrice: (ref) => getLiquidationPrice(ref, getClient()),
    getPerpLeverage: (ref) => getPerpLeverage(ref, getClient()),
    getPerpPositionAnalytics: (ref) => getPerpPositionAnalytics(ref, getClient()),
    listPerpPositionAnalytics: (p) => listPerpPositionAnalytics(p, getClient()),
    getMaxPerpOrderSize: (p) => getMaxPerpOrderSize(p, getClient()),
    previewPerpClosePnl: (p) => previewPerpClosePnl(p, getClient()),
    previewPerpLiquidationPrice: (p) => previewPerpLiquidationPrice(p, getClient()),
    getPerpSideHolders: (ref, opts) => getPerpSideHolders(ref, opts ?? {}, getClient()),
    getBankruptcyPrice: (ref, opts) => getBankruptcyPrice(ref, opts ?? {}, getClient()),
    getPerpSystemConfig: (marginBank) => getPerpSystemConfig(marginBank, getClient()),
    getInsuranceFundState: (fund) => getInsuranceFundState(fund, getClient()),
    getLiquidationEngineConfig: (engine) => getLiquidationEngineConfig(engine, getClient()),
    tryGetPerpAccountEquity: (marginBank, account) => tryGetPerpAccountEquity(marginBank, account, getClient()),
    getPerpCollateralBasis: (marginBank, account) => getPerpCollateralBasis(marginBank, account, getClient()),
    listPerpPoolStatuses: (p) => listPerpPoolStatuses(p, getClient()),
    listTradeablePerpPools: (p) => listTradeablePerpPools(p, getClient()),
    readPerpMarketFromChain: (p) => readPerpMarketFromChain(p, getClient()),
    isPerpPoolRegistered: (p) => isPerpPoolRegistered(p, getClient()),
    getPerpRiskParams: (pool) => getPerpRiskParams(pool, getClient()),
    previewPerpOrderMargin: (p) => previewPerpOrderMargin(p, getClient()),
    meetsPerpImForFill: (p) => meetsPerpImForFill(p, getClient()),
    quoteMeetsPerpImForOrder: (p) => quoteMeetsPerpImForOrder(p, getClient()),
    quotePerpOrderTopUp: (p) => quotePerpOrderTopUp(p, getClient()),
    getPerpLeverageImSurcharge: (marginBank, account) => getPerpLeverageImSurcharge(marginBank, account, getClient()),
    tryGetPerpLeverageImSurcharge: (marginBank, account) => tryGetPerpLeverageImSurcharge(marginBank, account, getClient()),
    getPerpMaxLeverage: (ref, opts) => getPerpMaxLeverage(ref, opts ?? {}, getClient()),
    getPerpLinkedWalletRegistry: (marginBank) => getPerpLinkedWalletRegistry(marginBank, getClient()),
    quotePerpFundingPayer: (marginBank, account) => quotePerpFundingPayer(marginBank, account, getClient()),
    getPerpMainFunding: (marginBank, account) => getPerpMainFunding(marginBank, account, getClient()),
    getPerpWalletPullCapacity: (marginBank, wallet) => getPerpWalletPullCapacity(marginBank, wallet, getClient()),
    getPerpWalletLinkage: (registry, wallet) => getPerpWalletLinkage(registry, wallet, getClient()),
    listPerpLinkedChildren: (registry, main) => listPerpLinkedChildren(registry, main, getClient()),
    getPerpMaxLinkedChildren: (registry) => getPerpMaxLinkedChildren(registry, getClient()),
    getPerpHealthSnapshot: (pool) => getPerpHealthSnapshot(pool, getClient()),
    getEffectiveImfBps: (pool) => getEffectiveImfBps(pool, getClient()),
    getVaultBalance: (p) => getVaultBalance(p, getClient()),
    getManualVaultMode: (p) => getManualVaultMode(p, getClient()),
    getAutoPullRequirement: (p) => getAutoPullRequirement(p, getClient()),
    isOperatorAuthorized: (p) => isOperatorAuthorized(p, getClient()),
    isGloballyApproved: (p) => {
      var _a;
      return isGloballyApproved(p, getClient(), (_a = config.addresses) == null ? void 0 : _a.operatorPermissionsRegistry);
    },
    isApprovedForPool: (p) => {
      var _a;
      return isApprovedForPool(p, getClient(), (_a = config.addresses) == null ? void 0 : _a.operatorPermissionsRegistry);
    },
    // Deliberately NOT given the configured address: this read asks the POOL, which is
    // the discovery path for a caller who has nothing configured.
    getOperatorPermissionsRegistry: (pool) => getOperatorPermissionsRegistry(pool, getClient()),
    getOwnLockedBalance: (p) => getOwnLockedBalance(p, getClient()),
    getLockedTokenBreakdown: (pool) => getLockedTokenBreakdown(pool, getClient()),
    convertToQuoteAtPriceCeil: (p) => convertToQuoteAtPriceCeil(p, getClient()),
    getMarketOnchain: (marketId) => {
      var _a, _b;
      const module = (_a = config.addresses) == null ? void 0 : _a.binaryModule;
      if (!module) {
        throw new NotConfiguredError("addresses.binaryModule", "getMarketOnchain (v2 resolves markets by marketId through the module)");
      }
      return getMarketOnchain(marketId, { module, settlement: (_b = config.addresses) == null ? void 0 : _b.binarySettlement }, getClient());
    },
    getOnchainResolutionPrice: (marketId) => {
      var _a;
      const module = (_a = config.addresses) == null ? void 0 : _a.binaryModule;
      if (!module) {
        throw new NotConfiguredError("addresses.binaryModule", "getOnchainResolutionPrice (the module names the market's oracle adapter)");
      }
      return getOnchainResolutionPrice(marketId, { module }, getClient());
    },
    // Pool-reuse reads (settlement-extraction v2). Chain half needs the module
    // address; indexer half (getPoolBindings/getPool) is pure GraphQL.
    getPoolCreator: (pool) => {
      var _a;
      const module = (_a = config.addresses) == null ? void 0 : _a.binaryModule;
      if (!module) {
        throw new NotConfiguredError("addresses.binaryModule", "getPoolCreator");
      }
      return getPoolCreator(pool, module, getClient());
    },
    getFreePools: (creator, collateral) => {
      var _a;
      const module = (_a = config.addresses) == null ? void 0 : _a.binaryModule;
      if (!module) {
        throw new NotConfiguredError("addresses.binaryModule", "getFreePools");
      }
      return getFreePools(creator, collateral, module, getClient());
    },
    getPoolBindings: (pool) => getPoolBindings(pool, url),
    getPool: (address) => getPool(address, url),
    getErc20Balance: (token, account) => getErc20Balance(token, account, getClient()),
    getErc20Metadata: (token) => getErc20Metadata(token, getClient()),
    getErc20Allowance: (token, owner, spender) => getErc20Allowance(token, owner, spender, getClient()),
    getOutcomeBalance: (p) => getOutcomeBalance(p, getClient()),
    getBalances: (tokens, account) => getBalances(tokens, account, getClient()),
    getStopOrderSomiPayment: (registry) => getStopOrderSomiPayment(registry, getClient()),
    getMaxBuilderFeeBpsTimes1k: (pool) => getMaxBuilderFeeBpsTimes1k(pool, getClient()),
    getBuilderApproval: (ref) => getBuilderApproval(ref, getClient()),
    getEffectiveBuilderApproval: (ref) => getEffectiveBuilderApproval(ref, getClient()),
    getContractMeta: (address, opts) => getContractMeta(address, opts ?? {}, getClient()),
    getNativeBalance: (address) => getNativeBalance(address, getClient()),
    getTransactionSummary: (hash) => getTransactionSummary(hash, getClient()),
    // Each call is an independent tape on the client's chain WebSocket endpoint —
    // deliberately NOT the LiveTail's socket (a firehose must not contend with
    // scoped watches, and the tape owns its own stall/reconnect lifecycle).
    createNetworkTape: (opts) => new NetworkTape(resolveWsUrl(), opts ?? {}),
    getHeadBlock: () => getHeadBlock(getClient()),
    getSystemInfo: () => getSystemInfo(getClient(), config.addresses ?? {}),
    // Control plane — operators/venues are INDEXER reads (like the market
    // list); only fee-param encoding + the fee cap touch the chain (the module).
    listOperators: (opts) => listOperators(opts ?? {}, url),
    countOperators: (opts) => countOperators(opts ?? {}, url, indexerHeaders),
    getOperator: (operatorId) => getOperator(operatorId, url),
    listVenues: (opts) => listVenues(opts ?? {}, url),
    countVenues: (opts) => countVenues(opts ?? {}, url, indexerHeaders),
    getVenue: (venueId) => getVenue(venueId, url),
    encodeBinaryVenueFeeParams: (vp) => {
      var _a;
      return encodeBinaryVenueFeeParams(vp, getClient(), (_a = config.addresses) == null ? void 0 : _a.binaryModule);
    },
    getMaxVenueFeeBps: () => {
      var _a;
      return getMaxVenueFeeBps(getClient(), (_a = config.addresses) == null ? void 0 : _a.binaryModule);
    },
    // Machinery directory — MarketCreators / oracle adapters / series are
    // INDEXER reads (like the operator/venue directory); the on-chain point
    // reads live on the machinery admins.
    listMarketCreators: (opts) => listMarketCreators(opts ?? {}, url),
    getMarketCreator: (creator) => getMarketCreator(creator, url),
    listOracleAdapters: (opts) => listOracleAdapters(opts ?? {}, url),
    getOracleAdapter: (adapter) => getOracleAdapter(adapter, url),
    listSeries: (opts) => listSeries(opts ?? {}, url),
    getSeries: (creator, seriesId) => getSeries(creator, seriesId, url),
    // Oracle v2 hub §8e — the user-side quote reads (chain) + the hub's indexer
    // entities (questions / hub accounts / binds / callbacks). The §8e rule:
    // attach `getSchedulingCost(def) + resolveReserve()` to every create — the
    // reserve is earmarked at onBind (no separate prepaid pre-fund).
    getSchedulingCost: (def) => getSchedulingCost(def, requireOracleHub(), getClient()),
    earmarkedOf: (operatorId) => earmarkedOf(operatorId, requireOracleHub(), getClient()),
    creditOf: (operatorId) => creditOf(operatorId, requireOracleHub(), getClient()),
    outstandingOf: (operatorId) => outstandingOf(operatorId, requireOracleHub(), getClient()),
    withdrawableOf: (operatorId) => withdrawableOf(operatorId, requireOracleHub(), getClient()),
    payerCreditOf: (payer) => payerCreditOf(payer, requireOracleHub(), getClient()),
    payerOf: (marketId) => payerOf(marketId, requireOracleHub(), getClient()),
    resolveReserve: () => resolveReserve(requireOracleHub(), getClient()),
    quoteCreateMarketValue: (def) => quoteCreateMarketValue(def, requireOracleHub(), getClient()),
    getOracleQuestion: (oracleQuestionId) => getOracleQuestion(oracleQuestionId, url),
    listOracleQuestions: (opts) => listOracleQuestions(opts ?? {}, url),
    getOperatorHubAccount: (operatorId) => getOperatorHubAccount(operatorId, url),
    listOperatorHubAccounts: (opts) => listOperatorHubAccounts(opts ?? {}, url),
    listOracleBinds: (opts) => listOracleBinds(opts ?? {}, url),
    listOracleCallbacks: (opts) => listOracleCallbacks(opts ?? {}, url),
    createTrader: (traderConfig) => createTraderWithDeps(traderConfig, { getConfig, getClient, dbg }),
    createOperatorAdmin: (adminConfig) => createOperatorAdminWithDeps(adminConfig, { getConfig, getClient }),
    createOracleHubAdmin: (adminConfig) => createOracleHubAdminWithDeps(adminConfig, { getConfig, getClient }),
    createGovernanceAdmin: (adminConfig) => createGovernanceAdminWithDeps(adminConfig, { getConfig, getClient }),
    createMarketCreatorAdmin: (adminConfig) => createMarketCreatorAdminWithDeps(adminConfig, { getConfig, getClient })
  };
  return client;
}

// node_modules/@somnia-chain/markets-sdk/dist/unified/symbols.js
var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function sanitizePart(s) {
  return s.replace(/[^A-Za-z0-9.]+/g, "");
}
function expiryCode(expirySec) {
  const d = new Date(expirySec * 1e3);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const date = `${day}${MONTHS[d.getUTCMonth()]}${String(d.getUTCFullYear() % 100).padStart(2, "0")}`;
  if (expirySec % 86400 === 0)
    return date;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${date}-${hh}${mm}`;
}
function trimStrike(strike) {
  if (!strike.includes("."))
    return strike;
  return strike.replace(/\.?0+$/, "");
}
function synthesizeSymbol(m, codeOf) {
  if (m.marketType === "SPOT") {
    const base = m.baseSymbol ? sanitizePart(m.baseSymbol) : codeOf(m.baseToken);
    const quote2 = m.quoteSymbol ? sanitizePart(m.quoteSymbol) : codeOf(m.quoteToken);
    return `${base}/${quote2}`;
  }
  if (m.marketType === "PERP") {
    const base = m.baseSymbol ? sanitizePart(m.baseSymbol) : codeOf(m.baseToken);
    const quote2 = m.quoteSymbol ? sanitizePart(m.quoteSymbol) : codeOf(m.quoteToken);
    return `${base}/${quote2}:${quote2}`;
  }
  const b = m;
  const asset = sanitizePart(b.asset) || "MKT";
  const strike = sanitizePart(trimStrike(b.strike));
  const quote = codeOf(b.collateral);
  return `${asset}-${strike}-${expiryCode(Number(b.expiry))}/${quote}`;
}
function withCollisionSuffix(symbol, m) {
  const tag = `-${m.id.replace(/^0x/, "").slice(-4).toUpperCase()}`;
  const slash = symbol.lastIndexOf("/");
  if (slash === -1)
    return `${symbol}${tag}`;
  return `${symbol.slice(0, slash)}${tag}${symbol.slice(slash)}`;
}
function outcomesOf(m) {
  if (m.marketType === "BINARY") {
    return [
      { label: "YES", index: 0 },
      { label: "NO", index: 1 }
    ];
  }
  return [];
}
function tradableSymbol(marketSymbol, outcome) {
  return outcome ? `${marketSymbol}#${outcome}` : marketSymbol;
}
function splitSymbol(symbol) {
  const i = symbol.indexOf("#");
  if (i === -1)
    return { marketSymbol: symbol };
  return { marketSymbol: symbol.slice(0, i), outcome: symbol.slice(i + 1).toUpperCase() || void 0 };
}
function isChainRef(ref) {
  return /^0x[0-9a-fA-F]{40}$/.test(ref) || /^0x[0-9a-fA-F]{64}$/.test(ref);
}
var SymbolRegistry = class {
  constructor() {
    /** marketSymbol -> market */
    __publicField(this, "bySymbol", /* @__PURE__ */ new Map());
    /** lowercased pool / market id / BinaryMarket address -> marketSymbol */
    __publicField(this, "byRef", /* @__PURE__ */ new Map());
  }
  /** (Re)build from a market list. Returns the canonical symbol per market id. */
  build(markets, codeOf) {
    this.bySymbol.clear();
    this.byRef.clear();
    const proposed = /* @__PURE__ */ new Map();
    for (const m of markets) {
      const s = synthesizeSymbol(m, codeOf);
      const arr = proposed.get(s) ?? [];
      arr.push(m);
      proposed.set(s, arr);
    }
    const canonical = /* @__PURE__ */ new Map();
    for (const [s, ms] of proposed) {
      for (const m of ms) {
        const sym = ms.length === 1 ? s : withCollisionSuffix(s, m);
        canonical.set(m.id, sym);
        this.bySymbol.set(sym, m);
        this.byRef.set(m.id.toLowerCase(), sym);
        this.byRef.set(m.poolAddress.toLowerCase(), sym);
        if (m.marketType === "BINARY")
          this.byRef.set(m.marketAddress.toLowerCase(), sym);
      }
    }
    return canonical;
  }
  /**
   *  Resolve any handle — a market/tradable symbol or an on-chain ref — to a
   *  Tradable. For outcome markets addressed WITHOUT an outcome, the default
   *  tradable is outcome 0 (YES). Throws on unknown handles.
   */
  resolve(ref) {
    let marketSymbol;
    let outcome;
    if (isChainRef(ref)) {
      const sym = this.byRef.get(ref.toLowerCase());
      if (!sym)
        throw new InvalidInputError(`unknown market ref ${ref} — call loadMarkets() first`);
      marketSymbol = sym;
    } else {
      ({ marketSymbol, outcome } = splitSymbol(ref));
    }
    const market = this.bySymbol.get(marketSymbol);
    if (!market)
      throw new InvalidInputError(`unknown symbol ${ref} — call loadMarkets() first`);
    const outcomes = outcomesOf(market);
    if (outcomes.length === 0) {
      if (outcome)
        throw new InvalidInputError(`${marketSymbol} is a ${market.marketType} market — it has no outcomes`);
      return { market, marketSymbol, symbol: marketSymbol, pool: market.poolAddress };
    }
    const chosen = outcome ? outcomes.find((o) => o.label === outcome) : outcomes[0];
    if (!chosen) {
      throw new InvalidInputError(`${marketSymbol} has no outcome "${outcome}" (has: ${outcomes.map((o) => o.label).join(", ")})`);
    }
    return {
      market,
      marketSymbol,
      symbol: tradableSymbol(marketSymbol, chosen.label),
      outcome: chosen.label,
      outcomeIndex: chosen.index,
      pool: market.poolAddress
    };
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/unified/structs.js
var TIMEFRAMES = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400
};
function toRaw(x, decimals) {
  requireConvertibleAmount(x);
  return fromHuman(x, decimals);
}
function requireConvertibleAmount(x) {
  if (!Number.isFinite(x) || x < 0) {
    throw new InvalidInputError(`invalid amount/price ${x}`);
  }
}
function floorToRaw(x, decimals) {
  requireConvertibleAmount(x);
  const wide = Math.min(decimals + 20, 100);
  const fixed = x.toFixed(wide);
  if (fixed.includes("e") || fixed.includes("E")) {
    throw new InvalidInputError(`amount/price ${x} is too large to convert exactly at ${decimals} decimals`);
  }
  const [whole, fraction = ""] = fixed.split(".");
  return BigInt(whole + fraction.padEnd(decimals, "0").slice(0, decimals));
}
function snapToGrid(x, stepRaw, decimals, options = {}) {
  if (stepRaw <= 0n) {
    throw new InvalidInputError(`invalid grid step ${stepRaw}`);
  }
  const { clamp = false, strict = false, direction = "down" } = options;
  if (strict && direction === "up") {
    throw new InvalidInputError('snapToGrid cannot combine strict with direction "up"');
  }
  const one = 10n ** BigInt(decimals);
  if (clamp && stepRaw * 2n > one) {
    throw new InvalidInputError(`grid step ${stepRaw} exceeds half of one unit (${one})`);
  }
  const raw = strict ? floorToRaw(x, decimals) : toRaw(x, decimals);
  const remainder = raw % stepRaw;
  const shortfall = stepRaw - remainder;
  const nudge = remainder !== 0n && (direction === "up" || !strict && shortfall <= raw / 2n ** 52n);
  const aligned = nudge ? raw + shortfall : raw - remainder;
  if (!clamp)
    return toHumanNum(aligned, decimals);
  if (aligned < stepRaw)
    return toHumanNum(stepRaw, decimals);
  const highest = (one - stepRaw) / stepRaw * stepRaw;
  if (aligned > highest)
    return toHumanNum(highest, decimals);
  return toHumanNum(aligned, decimals);
}
function toHumanNum(raw, decimals) {
  if (raw === null || raw === void 0)
    return 0;
  return Number(formatUnits(BigInt(raw), decimals));
}
function toDatetime(tsMs) {
  return new Date(tsMs).toISOString();
}
function toUnifiedStatus(status) {
  switch (status) {
    case "Open":
      return "open";
    case "Filled":
      return "closed";
    case "Cancelled":
      return "canceled";
    case "Expired":
      return "expired";
    default:
      return "closed";
  }
}
function precisionFromStep(step, decimals) {
  const s = Number(step ?? "1");
  if (!Number.isFinite(s) || s <= 0)
    return decimals;
  const human = s / 10 ** decimals;
  const places = Math.ceil(-Math.log10(human));
  return Math.min(decimals, Math.max(0, places));
}

// node_modules/@somnia-chain/markets-sdk/dist/unified/portfolioAnalytics.js
var TIMEFRAME_MS = {
  "24h": 24 * 60 * 60 * 1e3,
  "7d": 7 * 24 * 60 * 60 * 1e3,
  "30d": 30 * 24 * 60 * 60 * 1e3
};
var BUCKET_MS = {
  "24h": 60 * 60 * 1e3,
  "7d": 4 * 60 * 60 * 1e3,
  "30d": 24 * 60 * 60 * 1e3,
  all: 24 * 60 * 60 * 1e3
};
var DEFAULT_CEX_RATE_BPS = 10;
var MIN_CAPITAL_BASE_USD = 0.01;
var MAX_EQUITY_POINTS = 1e5;
function markAt(series, t, fallback) {
  var _a;
  if (!series || series.length === 0)
    return fallback;
  let best;
  for (const [ts, price] of series) {
    if (ts > t)
      break;
    best = price;
  }
  return best ?? ((_a = series[0]) == null ? void 0 : _a[1]) ?? fallback;
}
function computePortfolioAnalytics(events, opts) {
  var _a;
  const { timeframe, asOf, marks } = opts;
  const cexRateBps = opts.cexRateBps ?? DEFAULT_CEX_RATE_BPS;
  if (!Number.isFinite(asOf)) {
    throw new InvalidInputError(`asOf must be a finite epoch-ms number, got ${asOf}`);
  }
  for (let k = 0; k < events.length; k += 1) {
    const t = events[k].timestamp;
    if (!Number.isFinite(t)) {
      throw new InvalidInputError(`events[${k}].timestamp must be a finite epoch-ms number, got ${t}`);
    }
  }
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const windowStart = timeframe === "all" ? ((_a = sorted[0]) == null ? void 0 : _a.timestamp) ?? asOf : asOf - TIMEFRAME_MS[timeframe];
  const bucketMs = BUCKET_MS[timeframe];
  if (!Number.isFinite(windowStart)) {
    throw new InvalidInputError(`windowStart must be a finite epoch-ms number, got ${windowStart} for timeframe "${timeframe}"`);
  }
  if (!Number.isFinite(bucketMs) || bucketMs <= 0) {
    throw new InvalidInputError(`bucket size must be a finite positive number of ms, got ${bucketMs} for timeframe "${timeframe}"`);
  }
  const impliedPoints = (asOf - windowStart) / bucketMs;
  if (impliedPoints > MAX_EQUITY_POINTS) {
    throw new InvalidInputError(`timeframe "${timeframe}" spans ${Math.round(impliedPoints)} sample points between ${windowStart} and ${asOf}, above the ${MAX_EQUITY_POINTS} supported — the earliest event timestamp or asOf is implausible`);
  }
  const books = /* @__PURE__ */ new Map();
  const book = (market) => {
    let b = books.get(market);
    if (!b) {
      b = { qty: 0, cost: 0 };
      books.set(market, b);
    }
    return b;
  };
  const applyTrade = (e) => {
    const b = book(e.market);
    if (e.side === "buy") {
      b.qty += e.baseAmount;
      b.cost += e.quoteAmount;
      return { realized: 0, matchedProceeds: 0 };
    }
    const avg = b.qty > 0 ? b.cost / b.qty : 0;
    const sold = Math.min(e.baseAmount, b.qty);
    const costOut = avg * sold;
    b.qty -= sold;
    b.cost -= costOut;
    const matchedProceeds = e.baseAmount > 0 ? e.quoteAmount * sold / e.baseAmount : 0;
    return { realized: matchedProceeds - costOut, matchedProceeds };
  };
  const unrealizedAt = (t) => {
    let total = 0;
    for (const [market, b] of books) {
      if (b.qty <= 0)
        continue;
      const mark = markAt(marks.series.get(market), t, marks.lastPrice.get(market) ?? 0);
      total += b.qty * mark - b.cost;
    }
    return total;
  };
  let i = 0;
  while (i < sorted.length && sorted[i].timestamp < windowStart) {
    const e = sorted[i];
    if (e.kind === "trade")
      applyTrade(e);
    i += 1;
  }
  let carriedInValue = 0;
  for (const [market, b] of books) {
    if (b.qty > 0) {
      carriedInValue += b.qty * markAt(marks.series.get(market), windowStart, marks.lastPrice.get(market) ?? 0);
    }
  }
  const unrealizedAtStart = unrealizedAt(windowStart);
  const equity = [{ t: windowStart, valueUsd: 0 }];
  let cumRealized = 0;
  let periodVolume = 0;
  const tradeFlows = [];
  const fundingFlows = [];
  for (let t = windowStart + bucketMs; ; t += bucketMs) {
    const sampleT = Math.min(t, asOf);
    while (i < sorted.length && sorted[i].timestamp <= sampleT) {
      const e = sorted[i];
      if (e.kind === "funding") {
        fundingFlows.push({
          t: e.timestamp,
          valueUsd: e.direction === "in" ? e.valueUsd : -e.valueUsd
        });
        i += 1;
        continue;
      }
      const { realized, matchedProceeds } = applyTrade(e);
      cumRealized += realized;
      periodVolume += e.quoteAmount;
      tradeFlows.push({
        t: e.timestamp,
        valueUsd: e.side === "buy" ? e.quoteAmount : -matchedProceeds
      });
      i += 1;
    }
    equity.push({
      t: sampleT,
      valueUsd: cumRealized + unrealizedAt(sampleT) - unrealizedAtStart
    });
    if (sampleT >= asOf)
      break;
  }
  const buckets = [];
  for (let k = 1; k < equity.length; k += 1) {
    const prev = equity[k - 1];
    const cur = equity[k];
    buckets.push({ t: cur.t, pnlUsd: cur.valueUsd - prev.valueUsd });
  }
  const totalUsd = equity[equity.length - 1].valueUsd;
  const capitalBasis = fundingFlows.length > 0 ? "funding" : "trades";
  const flows = capitalBasis === "funding" ? fundingFlows : tradeFlows;
  const endT = equity[equity.length - 1].t;
  const spanMs = endT - windowStart;
  let netFlow = 0;
  let weightedFlow = 0;
  for (const f of flows) {
    netFlow += f.valueUsd;
    const weight = spanMs > 0 ? (endT - f.t) / spanMs : 1;
    weightedFlow += weight * f.valueUsd;
  }
  const depositedUsd = carriedInValue + netFlow;
  const weightedCapitalUsd = capitalBasis === "funding" ? carriedInValue + weightedFlow : depositedUsd;
  const mwrrReturn = weightedCapitalUsd < MIN_CAPITAL_BASE_USD ? null : totalUsd / weightedCapitalUsd;
  let lifetimeVolume = 0;
  let sessionVolume = 0;
  for (const e of sorted) {
    if (e.kind !== "trade")
      continue;
    lifetimeVolume += e.quoteAmount;
    if (opts.sessionSince !== void 0 && e.timestamp >= opts.sessionSince) {
      sessionVolume += e.quoteAmount;
    }
  }
  const rate = cexRateBps / 1e4;
  return {
    timeframe,
    asOf,
    equity,
    pnl: { totalUsd, buckets },
    mwrr: {
      return: mwrrReturn,
      gainUsd: totalUsd,
      depositedUsd,
      weightedCapitalUsd,
      capitalBasis
    },
    volume: {
      periodUsd: periodVolume,
      lifetimeUsd: lifetimeVolume,
      ...opts.sessionSince !== void 0 ? { sessionUsd: sessionVolume } : {}
    },
    feesSaved: {
      cexRateBps,
      periodUsd: periodVolume * rate,
      lifetimeUsd: lifetimeVolume * rate
    }
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js
var UNSET = Symbol("unset");
var PRICE_TIMEFRAMES = { "1m": "M1", "1h": "H1", "1d": "D1" };
var VALID_RESOLUTIONS = /* @__PURE__ */ new Set(["M1", "H1", "D1"]);
var TRADE_PAGE = 200;
var MAX_TRADE_PAGES = 20;
function asDiscoveryFailure(err) {
  if (err instanceof SomniaMarketsError)
    return err;
  return new RpcError("perp market discovery", err instanceof Error ? err.message : String(err), { cause: err });
}
var SomniaMarkets = class {
  constructor(config) {
    /** The native engine — bigint-exact, address-keyed. The escape hatch. */
    __publicField(this, "client");
    /** Unified markets keyed by MARKET symbol (populated by loadMarkets). */
    __publicField(this, "markets", {});
    /** All market symbols (populated by loadMarkets). */
    __publicField(this, "symbols", []);
    /**
     *  Capability map — which unified verbs this venue supports (the ccxt
     *  `exchange.has` convention, for capability-probing bot code). Every listed
     *  verb is implemented here, so every flag is `true`.
     */
    __publicField(this, "has", {
      /** {@link SomniaMarkets.fetchMarkets} */
      fetchMarkets: true,
      /** {@link SomniaMarkets.fetchOrderBook} */
      fetchOrderBook: true,
      /** {@link SomniaMarkets.fetchTrades} */
      fetchTrades: true,
      /** {@link SomniaMarkets.fetchOHLCV} */
      fetchOHLCV: true,
      /** {@link SomniaMarkets.fetchBalance} */
      fetchBalance: true,
      /** {@link SomniaMarkets.fetchOpenOrders} */
      fetchOpenOrders: true,
      /** {@link SomniaMarkets.fetchMyTrades} */
      fetchMyTrades: true,
      /** {@link SomniaMarkets.fetchStatus} */
      fetchStatus: true,
      /** {@link SomniaMarkets.createOrder} */
      createOrder: true,
      /** {@link SomniaMarkets.cancelOrder} */
      cancelOrder: true,
      /** {@link SomniaMarkets.watchOrderBook} */
      watchOrderBook: true,
      /** {@link SomniaMarkets.watchTrades} */
      watchTrades: true,
      /** {@link SomniaMarkets.watchOrders} */
      watchOrders: true,
      /** {@link SomniaMarkets.watchMyTrades} */
      watchMyTrades: true,
      /** {@link SomniaMarkets.fetchPositions} */
      fetchPositions: true,
      /** {@link SomniaMarkets.fetchFundingRate} */
      fetchFundingRate: true,
      /**
       *  {@link SomniaMarkets.fetchFundingRateHistory} — the key did not previously exist
       *  in this map, so it had to be ADDED rather than flipped.
       */
      fetchFundingRateHistory: true,
      /** {@link SomniaMarkets.watchPrice} */
      watchPrice: true,
      /** {@link SomniaMarkets.fetchPrice} */
      fetchPrice: true,
      /** {@link SomniaMarkets.fetchPriceOHLCV} */
      fetchPriceOHLCV: true
    });
    __publicField(this, "registry", new SymbolRegistry());
    // Not readonly: setSigner() rebinds this after construction (wallet connect /
    // disconnect), which also drops the memoized trader.
    __publicField(this, "signerConfig");
    /** The configured protocol addresses, so perp discovery can read an override. */
    __publicField(this, "addresses");
    __publicField(this, "traderInstance", null);
    /** token address (lowercased) -> { code, decimals } for symbols + balances. */
    __publicField(this, "currencies", /* @__PURE__ */ new Map());
    /**
     *  binary pool (lowercased) -> the tick/lot/minQuantity grid the pool
     *  enforces. Binary rows come off the indexer with these fields undefined
     *  (the indexer never sees them), so loadMarkets() reads them from the pool;
     *  the precision helpers are synchronous and read only from here.
     */
    __publicField(this, "bookParams", /* @__PURE__ */ new Map());
    /**
     *  perp pool (lowercased) -> its live chain-tier gates, refreshed by every
     *  loadMarkets(). Empty when no PerpPoolFactory could be reached, which is what
     *  leaves `perpStatus` absent rather than guessed.
     */
    __publicField(this, "perpStatuses", /* @__PURE__ */ new Map());
    /**
     *  perp pools (lowercased) the FACTORY knows and the indexer does not — the
     *  rows loadMarkets() synthesized from the chain. Drives
     *  {@link UnifiedMarket.indexed}.
     */
    __publicField(this, "chainOnlyPerps", /* @__PURE__ */ new Set());
    __publicField(this, "perpDiscoveryFailure", null);
    __publicField(this, "perpDiscoveryPartial", null);
    __publicField(this, "watches", new AsyncCache());
    __publicField(this, "priceWatches", new AsyncCache());
    __publicField(this, "channels", /* @__PURE__ */ new Map());
    __publicField(this, "unsubscribe", null);
    __publicField(this, "unsubscribePrices", null);
    const { privateKey, account, walletClient, ...clientConfig } = config;
    this.client = createClient(clientConfig);
    this.signerConfig = { privateKey, account, walletClient };
    this.addresses = clientConfig.addresses;
  }
  // ------------------------------------------------------------- signer bits
  /**
   *  The raw write tier bound to this exchange's signer — bigint-exact
   *  `placeOrder`/`mintSet`/`faucet`/… for anything the unified verbs don't
   *  cover.
   *
   *  **Gotchas**
   *
   *  Built lazily; throws if no signer was configured.
   */
  get trader() {
    this.traderInstance ?? (this.traderInstance = this.client.createTrader(this.signerConfig));
    return this.traderInstance;
  }
  /**
   *  Bind (or replace) the exchange's signer after construction. Browser apps
   *  construct the exchange at boot for public reads, then call this when the
   *  user's wallet connects — and again with `{}` on disconnect, which returns
   *  the exchange to unauthenticated reads. Replaces the trader every
   *  authenticated verb and `walletAddress` resolve against; live watches and
   *  market data are unaffected.
   */
  setSigner(signer) {
    this.signerConfig = {
      account: signer.account,
      privateKey: signer.privateKey,
      walletClient: signer.walletClient
    };
    this.traderInstance = null;
  }
  /** The authenticated wallet address, if a signer was configured. */
  get walletAddress() {
    const { privateKey, account, walletClient } = this.signerConfig;
    if (walletClient == null ? void 0 : walletClient.account)
      return walletClient.account.address;
    if (typeof account === "object")
      return account.address;
    if (typeof account === "string")
      return account;
    if (privateKey)
      return privateKeyToAccount(privateKey).address;
    return void 0;
  }
  /**
   *  The wallet address, or {@link SignerRequiredError} naming the caller.
   *
   * **Details**
   *
   * - `operation`: The public method requiring the signer; it appears in the error so the caller sees which call needs a signer, not just "a method".
   */
  requireAddress(operation) {
    const a = this.walletAddress;
    if (!a)
      throw new SignerRequiredError(operation);
    return a;
  }
  // ------------------------------------------------------------- markets
  /**
   *  Why chain-tier perp discovery did not run on the last {@link loadMarkets}, or
   *  `null` when it ran (or was never applicable).
   *
   *  `loadMarkets()` contains a discovery failure rather than throwing, because it is
   *  the implicit prerequisite of nearly every symbol-based verb and a chain failure
   *  must not take the SPOT and OUTCOME market lists down with it. This is where that
   *  contained failure is reported, with the underlying error preserved in `cause`.
   *
   *  **When to use**
   *
   *  Check it after `loadMarkets()` whenever a SHORT perp list would be worse than an
   *  error — a market page, an order router, anything that would otherwise present
   *  "this market does not exist". Then either tell the user the list is incomplete, or
   *  retry with **`loadMarkets(true)`**: a bare `loadMarkets()` early-returns once any
   *  market is cached, so it never re-runs discovery and this value would stay stale.
   *
   *  **Gotchas**
   *
   *  - Do NOT infer this from `perpStatus` being absent. That works only when the indexer already carries a perp row to inspect; with a configured factory and an indexer carrying none, a failed discovery yields an EMPTY perp list with no market to check. This accessor answers in both cases.
   *  - `null` does not mean the venue has perps. A chain with no perps plane deployed (local anvil) never attempts discovery and reports `null` too.
   *
   * **Example** (Refusing to show a possibly-short perp list)
   *
   * ```ts
   * await exchange.loadMarkets();
   * if (exchange.perpDiscoveryError) {
   *   // A bare loadMarkets() would early-return the cached registry and never retry.
   *   await exchange.loadMarkets(true);
   * }
   * if (exchange.perpDiscoveryError) {
   *   const partial = exchange.perpDiscoveryPartialFailure;
   *   throw new Error(
   *     partial
   *       ? `perp list incomplete: ${partial.failed} of ${partial.total} markets unread`
   *       : "perp discovery failed; the perp list may be short",
   *   );
   * }
   * ```
   */
  get perpDiscoveryError() {
    return this.perpDiscoveryFailure;
  }
  /**
   *  How much of the chain-only perp set was lost when discovery PARTIALLY failed, or
   *  `null` when it did not.
   *
   *  Typed counts rather than prose in a message, so a consumer can decide on them —
   *  `{ failed: 1, total: 4 }` reads as "three of four chain-only markets are listed".
   *  Always `null` when {@link perpDiscoveryError} is null, and also null when discovery
   *  failed outright rather than partly (nothing was read, so there is no ratio).
   */
  get perpDiscoveryPartialFailure() {
    return this.perpDiscoveryPartial;
  }
  /**
   *  Load (or reload) the market registry: every market as a unified,
   *  symbol-keyed market object. Call once before anything symbol-based.
   *
   *  **Perp markets come from two sources.** The indexer's rows are unioned with the
   *  PerpPoolFactory's, because the indexer's perp set is a curated manifest and a pool
   *  deployed after it was written is live on chain and absent there. A market only the
   *  chain knows carries {@link UnifiedMarket.indexed} `false`; read that field's docs
   *  before touching anything history-derived on it.
   *
   *  **A chain failure is contained, not thrown.** This method is the implicit
   *  prerequisite of nearly every symbol-based verb, so letting a discovery failure out
   *  would take the SPOT and OUTCOME lists down with it — lists that need no chain read
   *  at all. The indexer read still throws: its failure means there is no registry to
   *  return. A contained discovery failure is reported by
   *  {@link perpDiscoveryError}, and that includes the PARTIAL case where some
   *  chain-only markets were read and others were not.
   *
   *  **Gotchas**
   *
   *  - Early-returns the cached registry unless `reload` is true, so a retry after a discovery failure must pass `true`.
   *
   * **Details**
   *
   * - `reload`: Re-read everything, including the live tradeability gates and the binary pools' grids.
   */
  async loadMarkets(reload = false) {
    if (!reload && this.symbols.length > 0)
      return this.markets;
    const indexerRows = await this.client.listRegistryMarkets();
    this.chainOnlyPerps.clear();
    this.perpDiscoveryFailure = null;
    this.perpDiscoveryPartial = null;
    const { statuses, chainOnly, failed } = await this.discoverPerpPools(indexerRows).catch((err) => {
      this.perpDiscoveryFailure = asDiscoveryFailure(err);
      return { statuses: /* @__PURE__ */ new Map(), chainOnly: [], failed: [] };
    });
    if (failed.length > 0 && this.perpDiscoveryFailure === null) {
      this.perpDiscoveryFailure = asDiscoveryFailure(failed[0]);
      this.perpDiscoveryPartial = { failed: failed.length, total: failed.length + chainOnly.length };
    }
    this.perpStatuses = statuses;
    const rows = [...indexerRows, ...chainOnly];
    const need = /* @__PURE__ */ new Set();
    for (const m of rows) {
      if (m.marketType === "BINARY")
        need.add(lower0x(m.collateral));
      else {
        if (!m.baseSymbol && !m.baseIsNative)
          need.add(lower0x(m.baseToken));
        if (!m.quoteSymbol)
          need.add(lower0x(m.quoteToken));
      }
    }
    for (const t of this.currencies.keys())
      need.delete(t);
    await Promise.all([...need].map(async (token) => {
      const viem = this.client.getViemClient();
      const [code, decimals] = await Promise.all([
        viem.readContract({ address: token, abi: erc20ReadAbi, functionName: "symbol" }).then((s) => String(s)).catch(() => token.slice(2, 8).toUpperCase()),
        viem.readContract({ address: token, abi: erc20ReadAbi, functionName: "decimals" }).then((d) => Number(d)).catch(() => 18)
      ]);
      this.currencies.set(token, { code, decimals });
    }));
    const codeOf = (token) => {
      var _a;
      return ((_a = this.currencies.get(lower0x(token))) == null ? void 0 : _a.code) ?? token.slice(2, 8).toUpperCase();
    };
    const pools = /* @__PURE__ */ new Set();
    for (const m of rows)
      if (m.marketType === "BINARY")
        pools.add(lower0x(m.poolAddress));
    if (reload)
      this.bookParams.clear();
    for (const p of this.bookParams.keys())
      pools.delete(p);
    await Promise.all([...pools].map(async (pool) => {
      const params = await this.client.getBinaryBookParams(pool).catch(() => null);
      if (params)
        this.bookParams.set(pool, params);
    }));
    const canonical = this.registry.build(rows, codeOf);
    this.markets = {};
    for (const m of rows) {
      const symbol = canonical.get(m.id) ?? unreachable(`registry.build omitted market ${m.id}`);
      this.markets[symbol] = this.toUnifiedMarket(m, symbol, codeOf);
      if (m.marketType === "BINARY") {
        this.currencies.set(lower0x(m.collateral), { code: codeOf(m.collateral), decimals: m.quoteDecimals });
      } else {
        if (!m.baseIsNative)
          this.currencies.set(lower0x(m.baseToken), { code: m.baseSymbol ?? codeOf(m.baseToken), decimals: m.baseDecimals });
        this.currencies.set(lower0x(m.quoteToken), { code: m.quoteSymbol ?? codeOf(m.quoteToken), decimals: m.quoteDecimals });
      }
    }
    this.symbols = Object.keys(this.markets).sort();
    return this.markets;
  }
  /**
   *  The chain's answer to "which perp markets exist, and are they tradeable" —
   *  plus a synthesized row for each one the indexer is missing.
   *
   *  Finding the factory is the whole trick, and the bank is the door. Every
   *  indexed perp row carries its `marginBank`, and `getSystemConfig()` reports
   *  the factory that bank actually calls, so the common case needs no
   *  configuration at all and cannot drift from the deployment. A configured
   *  `addresses.perpPoolFactory` wins when present, and is the only route when the
   *  indexer has no perp row to bootstrap from.
   *
   *  Returns empty when there is no route to a factory. That is not a failure: a
   *  chain with no perps plane deployed (local anvil) is the ordinary case, and it
   *  must leave the indexer-only behaviour exactly as it was.
   *
   *  THROWS on a route that exists but cannot be read, deliberately — the caller
   *  owns the containment policy and documents it, so this stays a straight read
   *  that a test can drive into failure.
   */
  async discoverPerpPools(indexerRows) {
    var _a, _b;
    const empty = { statuses: /* @__PURE__ */ new Map(), chainOnly: [], failed: [] };
    const indexed = indexerRows.filter((m) => m.marketType === "PERP");
    let factory = (_a = this.addresses) == null ? void 0 : _a.perpPoolFactory;
    let collateralToken;
    if (!factory) {
      const bank = (_b = indexed[0]) == null ? void 0 : _b.marginBank;
      if (!bank)
        return empty;
      const wiring = await this.client.getPerpSystemConfig(bank);
      if (wiring.perpPoolFactory === zeroAddress)
        return empty;
      factory = wiring.perpPoolFactory;
      collateralToken = wiring.collateralToken;
    }
    const statuses = /* @__PURE__ */ new Map();
    for (const s of await this.client.listPerpPoolStatuses({ factory })) {
      statuses.set(lower0x(s.pool), s);
    }
    const known = new Set(indexed.map((m) => lower0x(m.poolAddress)));
    const missing = [...statuses.values()].filter((s) => !known.has(lower0x(s.pool)));
    const first = missing[0];
    if (!first)
      return { statuses, chainOnly: [], failed: [] };
    const sibling = indexed[0];
    const source = sibling ? { token: sibling.quoteToken, decimals: sibling.quoteDecimals, symbol: sibling.quoteSymbol } : { token: collateralToken ?? (await this.client.getPerpSystemConfig(first.marginBank)).collateralToken };
    const synthesized = await this.synthesizePerps(missing, source, factory).catch((err) => ({
      rows: [],
      failed: [err]
    }));
    return { statuses, chainOnly: synthesized.rows, failed: synthesized.failed };
  }
  /**
   *  Chain-read one row per factory pool the indexer is missing.
   *
   *  `collateral.decimals` / `.symbol` are supplied when a sibling indexed row
   *  already carried them, and read from the token otherwise.
   */
  async synthesizePerps(missing, collateral, factory) {
    const token = collateral.token;
    const erc20 = { address: token, abi: erc20ReadAbi };
    const collateralDecimals = collateral.decimals ?? Number(await this.client.getViemClient().readContract({ ...erc20, functionName: "decimals" }));
    const collateralSymbol = collateral.symbol !== void 0 ? collateral.symbol : await this.client.getViemClient().readContract({ ...erc20, functionName: "symbol" }).then(String).catch((err) => {
      if (isMissingContractView(err))
        return null;
      throw err;
    });
    const settled = await Promise.allSettled(missing.map((status) => this.client.readPerpMarketFromChain({
      status,
      collateralToken: token,
      collateralDecimals,
      collateralSymbol,
      factory
    })));
    const rows = [];
    const failed = [];
    for (const r of settled) {
      if (r.status === "fulfilled")
        rows.push(r.value);
      else
        failed.push(r.reason);
    }
    for (const r of rows)
      this.chainOnlyPerps.add(r.id);
    return { rows, failed };
  }
  toUnifiedMarket(m, symbol, codeOf) {
    if (m.marketType === "SPOT") {
      const s = m;
      return {
        id: m.id,
        symbol,
        type: "spot",
        base: s.baseSymbol ?? codeOf(s.baseToken),
        quote: s.quoteSymbol ?? codeOf(s.quoteToken),
        active: true,
        contract: false,
        precision: {
          price: precisionFromStep(s.tickSize, s.quoteDecimals),
          amount: precisionFromStep(s.lotSize, s.baseDecimals)
        },
        limits: { amount: { min: s.minQuantity ? toHumanNum(s.minQuantity, s.baseDecimals) : void 0 } },
        indexed: true,
        info: m
      };
    }
    if (m.marketType === "PERP") {
      const p = m;
      const quote = p.quoteSymbol ?? codeOf(p.quoteToken);
      const status = this.perpStatuses.get(lower0x(p.poolAddress));
      return {
        id: m.id,
        symbol,
        type: "swap",
        base: p.baseSymbol ?? codeOf(p.baseToken),
        quote,
        // A linear perp settles in its quote (collateral) currency.
        settle: quote,
        // Gate-derived, and the two gates are read INDEPENDENTLY on purpose. Folding
        // them through `tradeable` was wrong: it collapses to null whenever registration
        // is unknown, so a pool the factory reports as RESTRICTED — known close-only —
        // came back `active: true`, restoring the exact state this change removes.
        //
        // `restricted` is knowledge and closes the market on its own. Only the UNKNOWN
        // registration gate fails open, so an unreadable bank does not hide a live
        // market.
        active: status ? !status.restricted && status.registered !== false : true,
        contract: true,
        precision: {
          price: precisionFromStep(p.tickSize, p.quoteDecimals),
          amount: precisionFromStep(p.lotSize, p.baseDecimals)
        },
        limits: { amount: { min: p.minQuantity ? toHumanNum(p.minQuantity, p.baseDecimals) : void 0 } },
        indexed: !this.chainOnlyPerps.has(m.id),
        ...status ? { perpStatus: { restricted: status.restricted, registered: status.registered, tradeable: status.tradeable } } : {},
        info: m
      };
    }
    const b = m;
    const now = Math.floor(Date.now() / 1e3);
    const inWindow = Number(b.tradingStart) <= now && now < Number(b.expiry);
    const bp = this.bookParams.get(lower0x(b.poolAddress));
    return {
      id: m.id,
      symbol,
      type: "binary",
      base: symbol.split("/")[0] ?? symbol,
      quote: codeOf(b.collateral),
      settle: codeOf(b.collateral),
      active: inWindow && b.status !== "Resolved" && b.status !== "Voided",
      contract: false,
      precision: {
        price: bp ? precisionFromStep(bp.tickSize.toString(), b.quoteDecimals) : b.quoteDecimals,
        amount: bp ? precisionFromStep(bp.lotSize.toString(), b.baseDecimals) : b.baseDecimals
      },
      limits: { amount: { min: bp ? toHumanNum(bp.minQuantity, b.baseDecimals) : void 0 } },
      outcomes: outcomesOf(m).map((o) => ({ symbol: tradableSymbol(symbol, o.label), label: o.label, index: o.index })),
      indexed: true,
      info: m
    };
  }
  /**
   *  Resolve any handle (symbol, tradable symbol, pool/market address, market
   *  id) to its tradable. Requires loadMarkets().
   */
  market(ref) {
    return this.registry.resolve(ref);
  }
  /**
   *  Snap a price to the market's tick grid (rounds down; binary prices are
   *  also clamped inside (0, 1)).
   *
   *  **When to use**
   *
   *  Use before createOrder with computed prices.
   *
   *  Spot/perp ticks come from the market row; binary ticks come from the pool,
   *  read once by {@link loadMarkets} — so a pool recycled mid-session keeps the
   *  grid captured at load time until `loadMarkets(true)` refreshes it.
   *
   * **Gotchas**
   *
   * - Throws {@link InvalidInputError} if the market is binary and its pool's parameters could not be read — quantizing against a guessed grid is what produced off-tick rejections, so this fails loudly instead.
   */
  priceToPrecision(ref, price) {
    const t = this.market(ref);
    const decimals = this.decimalsOf(t).price;
    const tickRaw = this.tickOf(t, "priceToPrecision");
    return snapToGrid(price, tickRaw, decimals, {
      clamp: t.market.marketType === "BINARY"
    });
  }
  /**
   *  Snap an amount to the market's lot grid (rounds down).
   *
   *  Spot/perp lots come from the market row; binary lots come from the pool,
   *  read once by {@link loadMarkets} — so a pool recycled mid-session keeps the
   *  grid captured at load time until `loadMarkets(true)` refreshes it.
   *
   * **Gotchas**
   *
   * - Throws {@link InvalidInputError} if the market is binary and its pool's parameters could not be read. Previously such a market fell back to a one-whole-token lot, silently flooring every sub-token amount to 0.
   */
  amountToPrecision(ref, amount) {
    const t = this.market(ref);
    return snapToGrid(amount, this.lotOf(t, "amountToPrecision"), this.decimalsOf(t).amount, {
      strict: true
    });
  }
  /**
   *  Every market as an array — {@link loadMarkets} (called if needed), minus
   *  the symbol keying.
   *
   *  **When to use**
   *
   *  Use as the ccxt-shaped sibling for list-style consumers.
   */
  async fetchMarkets() {
    await this.loadMarkets();
    return Object.values(this.markets);
  }
  // ------------------------------------------------------------- helpers
  /**
   *  The market's price grid in RAW quote units. Binary ticks come from the pool
   *  (and throw when that read failed, rather than quantizing against a guess);
   *  spot/perp ticks come from the market row, falling back to the venue's
   *  `10 ** (decimals - 3)` convention when the row carries none.
   *
   *  One definition shared by {@link priceToPrecision} and the write path, so a
   *  caller who pre-snaps and a caller who does not cannot be aligned against
   *  different grids.
   */
  tickOf(t, operation) {
    if (t.market.marketType === "BINARY") {
      return this.requireBookParams(t, operation).tickSize;
    }
    const decimals = this.decimalsOf(t).price;
    return t.market.tickSize ? BigInt(t.market.tickSize) : 10n ** BigInt(decimals - 3);
  }
  /** The market's amount grid in RAW base units. See {@link tickOf}. */
  lotOf(t, operation) {
    if (t.market.marketType === "BINARY") {
      return this.requireBookParams(t, operation).lotSize;
    }
    const decimals = this.decimalsOf(t).amount;
    return t.market.lotSize ? BigInt(t.market.lotSize) : 10n ** BigInt(decimals);
  }
  decimalsOf(t) {
    return { price: t.market.quoteDecimals, amount: t.market.baseDecimals };
  }
  /**
   *  The binary pool's enforced grid, or a throw. Only loadMarkets() populates
   *  the map, so an absent entry means that pool's read failed during the last
   *  load — not that the caller passed a bad ref.
   */
  requireBookParams(t, operation) {
    const bp = this.bookParams.get(lower0x(t.pool));
    if (!bp) {
      throw new InvalidInputError(`${operation}: no book parameters for binary market ${t.symbol} (pool ${t.pool}). The pool's getOrderBookParameters read failed during loadMarkets(); retry with loadMarkets(true).`);
    }
    return bp;
  }
  /** Native book → this tradable's [price, amount][] view, human units. */
  bookView(t, native) {
    const d = this.decimalsOf(t);
    const lvl = (l) => [toHumanNum(l.price, d.price), toHumanNum(l.quantity, d.amount)];
    if (t.market.marketType === "BINARY") {
      const b = native;
      return t.outcomeIndex === 1 ? { bids: b.noBids.map(lvl), asks: b.noAsks.map(lvl) } : { bids: b.yesBids.map(lvl), asks: b.yesAsks.map(lvl) };
    }
    const s = native;
    return { bids: s.bids.map(lvl), asks: s.asks.map(lvl) };
  }
  sideView(t, side) {
    if (!side)
      return void 0;
    const yesBuy = side === "BUY_YES" || side === "SELL_NO";
    if (t.market.marketType === "BINARY" && t.outcomeIndex === 1)
      return yesBuy ? "sell" : "buy";
    return yesBuy ? "buy" : "sell";
  }
  /** YES-terms raw price for this tradable's human price (NO inverts). */
  toNativePrice(t, price) {
    const d = this.decimalsOf(t);
    const raw = toRaw(price, d.price);
    if (t.market.marketType === "BINARY" && t.outcomeIndex === 1)
      return 10n ** BigInt(d.price) - raw;
    return raw;
  }
  priceView(t, rawYesTerms, d) {
    const p = toHumanNum(rawYesTerms, d);
    return t.market.marketType === "BINARY" && t.outcomeIndex === 1 ? 1 - p : p;
  }
  /**
   *  An OHLC row through this tradable's lens. NO-outcome tradables mirror the
   *  price axis (p → 1−p), which also SWAPS high and low — the trap every
   *  candle-shaped read must avoid. RULE for new verbs: never invert prices,
   *  sides, or OHLC inline — go through {@link priceView} / {@link sideView} /
   *  this, so a verb cannot forget the lens. (The 1−p mirror is inherently
   *  BINARY: a categorical N-outcome book has no such pairwise mirror, so
   *  outcome views there will need a real per-outcome book, not a wider lens.)
   */
  ohlcView(t, raw, d) {
    const open = this.priceView(t, raw.open, d);
    const close = this.priceView(t, raw.close, d);
    const a = this.priceView(t, raw.high, d);
    const b = this.priceView(t, raw.low, d);
    return { open, close, high: Math.max(a, b), low: Math.min(a, b) };
  }
  // ------------------------------------------------------------- fetch*
  /**
   *  One-shot book read from the contract (head-fresh; no watch needed).
   *
   *  **When to use**
   *
   *  Use when one book snapshot is enough. For a continuously-current
   *  zero-round-trip book, use {@link watchOrderBook}.
   */
  async fetchOrderBook(ref, limit = 10) {
    const t = this.market(ref);
    const native = t.market.marketType === "BINARY" ? await this.client.getBinaryOrderBook(t.pool, { depth: limit, decimals: t.market.quoteDecimals }) : await this.client.getSpotOrderBook(t.pool, { depth: limit });
    return { symbol: t.symbol, ...this.bookView(t, native), timestamp: Date.now(), info: native };
  }
  /** Recent public trades (indexer, newest first). */
  async fetchTrades(ref, since, limit = 50) {
    const t = this.market(ref);
    const d = this.decimalsOf(t);
    const rows = await this.client.getFills(t.pool, { limit });
    return rows.map((f) => {
      const price = this.priceView(t, f.fillPrice, d.price);
      const amount = toHumanNum(f.quantity, d.amount);
      const tsMs = Number(f.timestamp) * 1e3;
      const takerBuysBase = f.takerIsBid ?? void 0;
      let side = takerBuysBase === void 0 ? void 0 : takerBuysBase ? "buy" : "sell";
      if (t.market.marketType === "BINARY" && t.outcomeIndex === 1 && side)
        side = side === "buy" ? "sell" : "buy";
      return { id: f.id, symbol: t.symbol, price, amount, cost: price * amount, side, txHash: f.txHash, timestamp: tsMs, datetime: toDatetime(tsMs), info: f };
    }).filter((tr) => since === void 0 || tr.timestamp >= since);
  }
  /**
   * OHLCV candles (indexer), oldest first as [ms,o,h,l,c,vol] rows.
   * Timeframes: 1m 5m 15m 1h 4h 1d.
   *
   * **Example** (Reading candles)
   *
   * The last 24 hourly candles, destructured per row.
   *
   * ```ts
   * const candles = await exchange.fetchOHLCV("SOMI/USDC", "1h", undefined, 24);
   * for (const [ts, open, high, low, close, volume] of candles) {
   *   console.log(new Date(ts).toISOString(), open, high, low, close, volume);
   * }
   * ```
   */
  async fetchOHLCV(ref, timeframe = "5m", since, limit = 500) {
    const t = this.market(ref);
    const interval = TIMEFRAMES[timeframe];
    if (!interval)
      throw new InvalidInputError(`unknown timeframe ${timeframe} (have: ${Object.keys(TIMEFRAMES).join(" ")})`);
    const d = this.decimalsOf(t);
    const rows = await this.client.getCandles(t.pool, interval, { limit });
    return rows.map((c) => {
      const v = this.ohlcView(t, { open: c.openPrice, high: c.high, low: c.low, close: c.closePrice }, d.price);
      const ts = Number(c.bucketStart) * 1e3;
      return [ts, v.open, v.high, v.low, v.close, toHumanNum(c.baseVolume, d.amount)];
    }).filter((row) => since === void 0 || row[0] >= since);
  }
  /**
   * Rolling 24h ticker (indexer): OHLC + base/quote volume folded from the
   * hourly candles, `last` from the freshest fill. NO-outcome tradables view
   * prices through the 1−p lens like every other read.
   *
   * **Example** (Reading a ticker)
   *
   * Drive a price strip off one call.
   *
   * ```ts
   * const tk = await exchange.fetchTicker("SOMI/USDC");
   * console.log(tk.last, tk.percentage, tk.baseVolume);
   * ```
   */
  async fetchTicker(ref) {
    const t = this.market(ref);
    const d = this.decimalsOf(t);
    const nowSec = Math.floor(Date.now() / 1e3);
    const rows = await this.client.getCandles(t.pool, 3600, {
      from: nowSec - 86400,
      limit: 25
    });
    const stats = marketStats24hFromCandles(rows, nowSec);
    const windowed = stats.openPrice24h !== null && stats.high24h !== null && stats.low24h !== null ? this.ohlcView(
      t,
      // `close` is a placeholder for the shared view; `last` below is
      // derived from the freshest fill instead.
      { open: stats.openPrice24h, high: stats.high24h, low: stats.low24h, close: stats.openPrice24h },
      d.price
    ) : void 0;
    const open = windowed == null ? void 0 : windowed.open;
    const high = windowed == null ? void 0 : windowed.high;
    const low = windowed == null ? void 0 : windowed.low;
    const lastCandle = rows[rows.length - 1];
    const lastRaw = lastCandle ? lastCandle.closePrice : t.market.lastPrice;
    const last = lastRaw != null ? this.priceView(t, lastRaw, d.price) : void 0;
    const change = last !== void 0 && open !== void 0 ? last - open : void 0;
    const percentage = change !== void 0 && open ? change / open : void 0;
    const perp = isPerpMarket(t.market) ? await this.client.getPerpState(t.pool).catch(() => void 0) : void 0;
    const now = Date.now();
    return {
      symbol: t.symbol,
      timestamp: now,
      datetime: toDatetime(now),
      ...open !== void 0 ? { open } : {},
      ...high !== void 0 ? { high } : {},
      ...low !== void 0 ? { low } : {},
      ...last !== void 0 ? { last } : {},
      ...change !== void 0 ? { change } : {},
      ...percentage !== void 0 ? { percentage } : {},
      baseVolume: toHumanNum(stats.baseVolume24h, d.amount),
      quoteVolume: toHumanNum(stats.volume24h, d.price),
      ...perp ? {
        // Both conditions, matching perpMarkForPnl. `_tryMarkPrice` currently
        // returns (false, 0) on a zero price, so `ok` already implies non-zero —
        // but that is the CONTRACT's invariant, not this client's, and the cost of
        // enforcing it locally is one comparison. A zero mark reaching the wire is
        // the failure DEX-1855 fixed: downstream, an unguarded
        // `markPrice - entryPrice` reads as a 100% loss on every open position.
        ...perp.markPriceOk && perp.markPrice > 0n ? { markPrice: toHumanNum(perp.markPrice, d.price) } : {},
        indexPrice: toHumanNum(perp.indexPrice, d.price),
        // The SAME per-8h axis as fetchFundingRate and fetchFundingRateHistory. A
        // header on one basis beside a chart on another is a wrong number that
        // looks right.
        fundingRate: Number(fundingRate8h(perp.fundingRate, perp.fundingWindowSec)) / 1e18,
        fundingTimestamp: Number(perp.nextFundingAt) * 1e3,
        openInterest: toHumanNum(perp.openInterest, d.amount)
      } : {},
      info: perp ? { ...stats, perp } : stats
    };
  }
  /**
   * Wallet balances for every currency the loaded markets use (+ native).
   *
   * **Gotchas**
   *
   * `free === total`: funds escrowed in resting orders live in the pools, not
   * the wallet, so they simply don't appear here.
   *
   * - Throws {@link SignerRequiredError} - balances are per-account, so this needs a signer (or an `account`) even though it only reads.
   * - Throws {@link IndexerError} - `loadMarkets()` needed the indexer and it was unreachable. Distinct from an empty result: no balances is `{}`, not a throw.
   * - Throws {@link RpcError} - a chain balance read did not complete.
   *
   * **Example** (Reading balances)
   *
   * ERC-20s key by currency code; binary outcome holdings key by TRADABLE symbol.
   *
   * ```ts
   * const bal = await exchange.fetchBalance();
   * console.log(bal.USDC?.total);                              // collateral in the wallet
   * console.log(bal["BTC-95000-31DEC26/USDC#YES"]?.total);     // YES shares held
   * ```
   */
  async fetchBalance() {
    const addr = this.requireAddress("fetchBalance");
    await this.loadMarkets();
    const out = {};
    const reads = [...this.currencies.entries()].map(async ([token, { code, decimals }]) => {
      const raw = await this.client.getErc20Balance(token, addr).catch(() => 0n);
      const total = toHumanNum(raw, decimals);
      out[code] = { free: total, used: 0, total };
    });
    const nativeCurrency = this.client.config.chain.nativeCurrency;
    const native = this.client.getNativeBalance(addr).then((raw) => {
      const total = toHumanNum(raw, nativeCurrency.decimals);
      out[nativeCurrency.symbol] = { free: total, used: 0, total };
    }).catch(() => void 0);
    const binary = this.client.getPortfolio(addr).then((p) => {
      for (const pos of p.positions) {
        const side = pos.outcomeIndex === 1 ? "BUY_NO" : "BUY_YES";
        const t = this.tryResolvePool(pos.market.poolAddress, side);
        if (!t)
          continue;
        const total = toHumanNum(pos.balance, pos.market.quoteDecimals);
        out[t.symbol] = { free: total, used: 0, total };
      }
    }).catch(() => void 0);
    await Promise.all([...reads, native, binary]);
    return out;
  }
  /**
   *  Open orders (indexer view).
   *
   *  **When to use**
   *
   *  Use for an occasional snapshot; a trading loop should prefer
   *  {@link watchOrders}.
   *
   *  **Details**
   *
   *  `limit` is applied BY THE QUERY, per venue — not to the merged result. An
   *  unscoped call reads all three venues, so it can return up to 3 × `limit`
   *  rows; a `ref`-scoped call reads only that venue. The default is 200 per
   *  venue.
   *
   * - `ref`: Restrict to one tradable (symbol or address). Omit for all.
   * - `limit`: Max orders PER VENUE the query returns (default 200).
   *
   *  **Gotchas**
   *
   *  The indexer view lags the chain slightly.
   *
   *  On SPOT the same limit also bounds the PENDING STOP ORDERS the underlying
   *  portfolio read returns — one query variable caps both sets. That list is
   *  not part of this verb's result, so the coupling is invisible here, but a
   *  caller reading `client.getSpotPortfolio` directly with a small
   *  `ordersLimit` will see a correspondingly short `pendingStopOrders`.
   */
  async fetchOpenOrders(ref, limit) {
    const addr = this.requireAddress("fetchOpenOrders");
    const t = ref ? this.market(ref) : void 0;
    const opts = limit === void 0 ? {} : { ordersLimit: limit };
    const out = [];
    if (!t || t.market.marketType === "BINARY") {
      const p = await this.client.getPortfolio(addr, opts);
      for (const o of p.openOrders)
        out.push(...this.mapPortfolioOrder(o, t));
    }
    if (!t || t.market.marketType === "SPOT") {
      const p = await this.client.getSpotPortfolio(addr, opts);
      for (const o of p.openOrders)
        out.push(...this.mapSpotPortfolioOrder(o, t));
    }
    if (!t || t.market.marketType === "PERP") {
      const p = await this.client.getPerpPortfolio(addr, opts);
      for (const o of p.openOrders)
        out.push(...this.mapSpotPortfolioOrder(o, t));
    }
    return out;
  }
  /**
   * The wallet's orders across every lifecycle status (indexer), newest
   * first — the history counterpart to {@link fetchOpenOrders}. Scope to one
   * tradable with `ref`; page with `limit`/`params.offset`, both forwarded to
   * the query as a true offset window over one ordered set. (Its siblings page
   * differently: {@link fetchMyTrades} pages a fill tape to satisfy `limit`,
   * and {@link fetchOpenOrders} applies its limit per venue.)
   *
   * **Example** (Reading order history)
   *
   * The last 50 orders on one book, whatever became of them.
   *
   * ```ts
   * const orders = await exchange.fetchOrders("SOMI/USDC", undefined, 50);
   * for (const o of orders) console.log(o.status, o.side, o.amount, o.txHash);
   * ```
   */
  async fetchOrders(ref, since, limit = 100, params = {}) {
    const addr = this.requireAddress("fetchOrders");
    const t = ref ? this.market(ref) : void 0;
    const rows = await this.client.getOrders(addr, {
      limit,
      offset: params.offset ?? 0,
      ...t ? { pool: t.pool } : {}
    });
    const out = [];
    for (const o of rows) {
      const rt = this.tryResolvePool(o.pool, o.side ?? void 0);
      if (!rt)
        continue;
      if ((t == null ? void 0 : t.outcome) && rt.outcome !== t.outcome)
        continue;
      const d = this.decimalsOf(rt);
      const tsMs = Number(o.placedAtTimestamp) * 1e3;
      if (since !== void 0 && tsMs < since)
        continue;
      out.push({
        id: o.orderId,
        symbol: rt.symbol,
        side: rt.market.marketType === "BINARY" ? (
          // A null side (an unbridged row) still knows its YES-book
          // direction — derive the BinarySide from isBid and go through
          // the lens, so NO-outcome tradables don't show it inverted.
          this.sideView(rt, o.side ?? (o.isBid ? "BUY_YES" : "SELL_YES"))
        ) : o.isBid ? "buy" : "sell",
        price: this.priceView(rt, o.price, d.price),
        amount: toHumanNum(o.fullQuantity, d.amount),
        filled: toHumanNum(o.filledQuantity, d.amount),
        remaining: toHumanNum(o.quantityRemaining, d.amount),
        status: toUnifiedStatus(o.status),
        txHash: o.placedTxHash,
        timestamp: tsMs,
        datetime: toDatetime(tsMs),
        info: o
      });
    }
    return out;
  }
  mapPortfolioOrder(o, scope) {
    if (scope && o.market.poolAddress.toLowerCase() !== scope.pool.toLowerCase())
      return [];
    const t = this.tryResolvePool(o.market.poolAddress, o.side ?? void 0);
    if (!t)
      return [];
    if ((scope == null ? void 0 : scope.outcome) && t.outcome !== scope.outcome)
      return [];
    const d = this.decimalsOf(t);
    const tsMs = Number(o.placedAtTimestamp) * 1e3;
    return [
      {
        id: o.orderId,
        symbol: t.symbol,
        side: this.sideView(t, o.side ?? void 0) ?? "buy",
        price: this.priceView(t, o.price, d.price),
        amount: toHumanNum(o.fullQuantity, d.amount),
        filled: toHumanNum(o.filledQuantity, d.amount),
        remaining: toHumanNum(o.quantityRemaining, d.amount),
        status: "open",
        txHash: o.placedTxHash,
        timestamp: tsMs,
        datetime: toDatetime(tsMs),
        info: o
      }
    ];
  }
  // Shared by SPOT and PERP: both are plain isBid base/quote orders and the
  // mapper only touches the fields the two portfolio rows have in common.
  mapSpotPortfolioOrder(o, scope) {
    if (scope && o.market.poolAddress.toLowerCase() !== scope.pool.toLowerCase())
      return [];
    const t = this.tryResolvePool(o.market.poolAddress);
    if (!t)
      return [];
    const d = this.decimalsOf(t);
    const tsMs = Number(o.placedAtTimestamp) * 1e3;
    return [
      {
        id: o.orderId,
        symbol: t.symbol,
        side: o.isBid ? "buy" : "sell",
        price: toHumanNum(o.price, d.price),
        amount: toHumanNum(o.fullQuantity, d.amount),
        filled: toHumanNum(o.filledQuantity, d.amount),
        remaining: toHumanNum(o.quantityRemaining, d.amount),
        status: "open",
        txHash: o.placedTxHash,
        timestamp: tsMs,
        datetime: toDatetime(tsMs),
        info: o
      }
    ];
  }
  /**
   * The wallet's portfolio metrics plane over a timeframe: equity curve
   * (cumulative realized + unrealized PnL), per-bucket PnL, money-weighted
   * return, volume, and fees saved versus a comparison taker rate. Computed
   * client-side from the wallet's indexed fills (avg-cost basis) marked to
   * candle closes — no server aggregate involved.
   *
   * SPOT-scoped today: binary outcomes settle rather than mark, and the perp
   * account plane (funding, margin) joins the fold as new event kinds when
   * perp analytics land. Fills are paged to exhaustion — truncating would
   * drop the OLDEST fills and silently corrupt the carried-in cost basis,
   * not just undercount volume. Fills whose taker direction the indexer has
   * not resolved (`takerIsBid` null), or where the wallet's role (maker vs
   * taker) is unknowable, are skipped rather than guessed.
   *
   * The money-weighted return needs to know what capital the wallet put in.
   * Fills alone cannot say — capital that never passed through a trade is
   * invisible to them — so without `funding` the capital base is a trades-only
   * proxy that overstates the return for a wallet trading a small part of its
   * balance. Pass `funding` to measure against real external capital, and read
   * `mwrr.capitalBasis` to see which definition applied.
   *
   * **Example** (Measuring portfolio performance)
   *
   * ```ts
   * const p = await exchange.fetchPortfolioAnalytics("7d");
   * console.log(p.pnl.totalUsd, p.mwrr.return, p.equity.length);
   * ```
   */
  async fetchPortfolioAnalytics(timeframe, params = {}) {
    const addr = this.requireAddress("fetchOrders");
    const addrLc = addr.toLowerCase();
    const asOf = Date.now();
    const PAGE = 1e3;
    const fills = [];
    for (let offset = 0; ; offset += PAGE) {
      const page = await this.client.getUserFills(addr, { limit: PAGE, offset });
      fills.push(...page);
      if (page.length < PAGE)
        break;
    }
    const events = [];
    const touched = /* @__PURE__ */ new Map();
    for (const f of fills) {
      const t = this.tryResolvePool(f.pool);
      if (!t || t.market.marketType !== "SPOT")
        continue;
      if (f.takerIsBid == null)
        continue;
      const takerIsBid = f.takerIsBid;
      const isTaker = (f.taker ?? "").toLowerCase() === addrLc;
      const isMaker = (f.maker ?? "").toLowerCase() === addrLc;
      if (!isTaker && !isMaker)
        continue;
      const rawTs = f.timestamp;
      if (rawTs == null || String(rawTs).trim() === "")
        continue;
      const tsMs = Number(rawTs) * 1e3;
      if (!Number.isFinite(tsMs))
        continue;
      const d = this.decimalsOf(t);
      touched.set(t.symbol, t);
      events.push({
        kind: "trade",
        timestamp: tsMs,
        market: t.symbol,
        side: (isTaker ? takerIsBid : !takerIsBid) ? "buy" : "sell",
        baseAmount: toHumanNum(f.quantity, d.amount),
        quoteAmount: toHumanNum(f.quoteQuantity, d.price)
      });
    }
    if (params.funding)
      events.push(...params.funding);
    const bucketSec = timeframe === "24h" ? 3600 : timeframe === "7d" ? 14400 : 86400;
    const firstEventMs = events.length > 0 ? Math.min(...events.map((e) => e.timestamp)) : asOf;
    const windowStartMs = timeframe === "all" ? firstEventMs : asOf - { "24h": 864e5, "7d": 6048e5, "30d": 2592e6 }[timeframe];
    const series = /* @__PURE__ */ new Map();
    const lastPrice = /* @__PURE__ */ new Map();
    await Promise.all([...touched.values()].map(async (t) => {
      const d = this.decimalsOf(t);
      const rows = await this.client.getCandles(t.pool, bucketSec, {
        from: Math.floor(windowStartMs / 1e3) - bucketSec,
        limit: 1e3
      });
      series.set(t.symbol, rows.map((c) => [Number(c.bucketStart) * 1e3, this.priceView(t, c.closePrice, d.price)]));
      if (t.market.lastPrice != null) {
        lastPrice.set(t.symbol, this.priceView(t, t.market.lastPrice, d.price));
      }
    }));
    return computePortfolioAnalytics(events, {
      timeframe,
      asOf,
      marks: { series, lastPrice },
      ...params.sessionSince !== void 0 ? { sessionSince: params.sessionSince } : {},
      cexRateBps: params.cexRateBps ?? DEFAULT_CEX_RATE_BPS
    });
  }
  /**
   *  My historical trades, newest-first across every venue.
   *
   *  **Details**
   *
   *  Reads the unified fill tape (`getUserFills`), so the scope, the window and
   *  the limit are applied by the INDEXER rather than to an already-truncated
   *  page. This is what makes a narrow question answerable: a `ref`-scoped call
   *  returns that market's fills however old they are, where a per-venue read
   *  would have capped at its newest 50 across all markets first and left
   *  nothing to filter.
   *
   *  `limit` counts rows YOU receive. Fills whose pool is not in the loaded
   *  registry are unresolvable and are skipped, so the read pages until it has
   *  `limit` resolvable rows or the tape runs out — asking the query for exactly
   *  `limit` would under-deliver by however many it then dropped.
   *
   * - `ref`: Restrict to one tradable (symbol or address). Omit for all.
   * - `since`: Lower time bound, **milliseconds** — same clock as {@link UnifiedTrade.timestamp}, so a value read off a previous row can be passed straight back. Converted to the indexer's unix seconds internally.
   * - `limit`: Max rows to return (default 50).
   */
  async fetchMyTrades(ref, since, limit = 50) {
    const addr = this.requireAddress("fetchMyTrades");
    await this.loadMarkets();
    const t = ref ? this.market(ref) : void 0;
    const pool = t == null ? void 0 : t.pool;
    const sinceSec = since === void 0 ? void 0 : Math.floor(since / 1e3);
    const out = [];
    const page = Math.max(limit, TRADE_PAGE);
    for (let offset = 0, pages = 0; out.length < limit && pages < MAX_TRADE_PAGES; pages++) {
      const rows = await this.client.getUserFills(addr, {
        ...pool ? { pool } : {},
        ...sinceSec !== void 0 ? { since: sinceSec } : {},
        limit: page,
        offset
      });
      for (const row of rows) {
        if (out.length >= limit)
          break;
        const trade = this.fillToUnifiedTrade(row, t);
        if (trade)
          out.push(trade);
      }
      if (rows.length < page)
        break;
      offset += rows.length;
    }
    return out;
  }
  /**
   *  One fill row through the asking tradable's lens, or null when the row's
   *  pool is not in the registry or falls outside `scope`.
   *
   *  Binary rows carry the account's YES/NO side, which selects the outcome
   *  tradable — and NO mirrors both price and side, so both go through
   *  {@link priceView} / {@link sideView} rather than being read raw.
   */
  fillToUnifiedTrade(row, scope) {
    var _a, _b;
    const account = (_a = this.walletAddress) == null ? void 0 : _a.toLowerCase();
    const asMaker = (row.maker ?? "").toLowerCase() === account;
    const side = asMaker ? row.makerSide : ((_b = row.takerOrder) == null ? void 0 : _b.side) ?? row.takerSide;
    const rt = this.tryResolvePool(row.pool, side ?? void 0);
    if (!rt)
      return null;
    if (scope && rt.pool.toLowerCase() !== scope.pool.toLowerCase())
      return null;
    if ((scope == null ? void 0 : scope.outcome) && rt.outcome !== scope.outcome)
      return null;
    const d = this.decimalsOf(rt);
    const binary = rt.market.marketType === "BINARY";
    const price = binary ? this.priceView(rt, row.fillPrice, d.price) : toHumanNum(row.fillPrice, d.price);
    const amount = toHumanNum(row.quantity, d.amount);
    const cost = binary ? price * amount : toHumanNum(row.quoteQuantity, d.price);
    const tsMs = Number(row.timestamp) * 1e3;
    return {
      id: row.id,
      symbol: rt.symbol,
      price,
      amount,
      cost,
      side: binary ? this.sideView(rt, side ?? void 0) : this.takerSideView(row, asMaker),
      txHash: row.txHash,
      timestamp: tsMs,
      datetime: toDatetime(tsMs),
      info: row
    };
  }
  /** Spot/perp direction FROM THIS ACCOUNT's seat: the maker is the taker's mirror. */
  takerSideView(row, asMaker) {
    if (row.takerIsBid == null)
      return void 0;
    const bought = asMaker ? !row.takerIsBid : row.takerIsBid;
    return bought ? "buy" : "sell";
  }
  /**
   * Exchange health.
   *
   * **Details**
   *
   * "ok" unless a live watch is missing its socket — "connecting" while the
   * first WS handshake is still in flight (~1s after a watch opens), "error"
   * once a previously-live socket is lost.
   */
  async fetchStatus() {
    const s = this.client.getLiveStatus();
    const status = s.watchCount > 0 && !s.wsConnected ? s.headBlock > 0 ? "error" : "connecting" : "ok";
    return { status, updated: Date.now(), info: s };
  }
  tryResolvePool(pool, side) {
    try {
      const base = this.registry.resolve(pool);
      if (base.market.marketType !== "BINARY" || !side)
        return base;
      const outcome = side === "BUY_YES" || side === "SELL_YES" ? "YES" : "NO";
      return this.registry.resolve(`${base.marketSymbol}#${outcome}`);
    } catch {
      return null;
    }
  }
  tryResolveByMarketAddress(marketAddress, side, scope) {
    try {
      const base = this.registry.resolve(marketAddress);
      if (scope && base.pool.toLowerCase() !== scope.pool.toLowerCase())
        return null;
      const rt = side ? this.tryResolvePool(base.pool, side) : base;
      if (!rt)
        return null;
      if ((scope == null ? void 0 : scope.outcome) && rt.outcome !== scope.outcome)
        return null;
      return rt;
    } catch {
      return null;
    }
  }
  // ------------------------------------------------------------- watch*
  /** Hold the ref-counted market watch behind a symbol (idempotent). */
  async ensureWatch(t) {
    await this.watches.getOrCreate(t.marketSymbol, () => this.client.watchMarket(t.pool));
  }
  /**
   *  Streaming semantics: resolves with the channel's current value on first
   *  call, then each subsequent call resolves when the underlying (memoized)
   *  native ref CHANGES — reference equality is the change detector.
   */
  nextTick(key, getNative, map) {
    this.ensureListener();
    const existing = this.channels.get(key);
    const ch = existing ?? { last: UNSET, waiters: [], getNative, map };
    if (!existing)
      this.channels.set(key, ch);
    const current = getNative();
    if (ch.last === UNSET || !Object.is(current, ch.last)) {
      ch.last = current;
      return Promise.resolve(map(current));
    }
    return new Promise((resolve2) => ch.waiters.push({ resolve: resolve2 }));
  }
  ensureListener() {
    const drain = () => {
      for (const ch of this.channels.values()) {
        if (ch.waiters.length === 0)
          continue;
        const v = ch.getNative();
        if (Object.is(v, ch.last))
          continue;
        ch.last = v;
        const mapped = ch.map(v);
        for (const w of ch.waiters.splice(0))
          w.resolve(mapped);
      }
    };
    this.unsubscribe ?? (this.unsubscribe = this.client.subscribeLive(drain));
    this.unsubscribePrices ?? (this.unsubscribePrices = this.client.subscribePrices(drain));
  }
  /**
   * Streaming book off the local store: zero round-trips, current to the last
   * block; each await resolves on the next book change.
   *
   * **Example** (Watching the order book)
   *
   * A quoting loop: wake on every book change, read the touch.
   *
   * ```ts
   * while (true) {
   *   const book = await exchange.watchOrderBook("SOMI/USDC", 5);
   *   const [bestBid] = book.bids[0] ?? [];
   *   const [bestAsk] = book.asks[0] ?? [];
   *   console.log(`bid ${bestBid} / ask ${bestAsk}`);
   * }
   * ```
   */
  async watchOrderBook(ref, limit = 10) {
    const t = this.market(ref);
    await this.ensureWatch(t);
    return this.nextTick(`ob:${t.symbol}:${limit}`, () => t.market.marketType === "BINARY" ? this.client.getLiveBinaryOrderBook(t.pool, { depth: limit }) : this.client.getLiveSpotOrderBook(t.pool, { depth: limit }), (native) => ({ symbol: t.symbol, ...this.bookView(t, native), timestamp: Date.now(), info: native }));
  }
  /**
   * Streaming public trades (the live tape), newest first.
   *
   * **Example** (Watching trades)
   *
   * Print each fill as it lands (`[0]` is always the latest).
   *
   * ```ts
   * while (true) {
   *   const [latest] = await exchange.watchTrades("SOMI/USDC", 1);
   *   if (latest) console.log(`${latest.side ?? "?"} ${latest.amount} @ ${latest.price}`);
   * }
   * ```
   */
  async watchTrades(ref, limit = 50) {
    const t = this.market(ref);
    await this.ensureWatch(t);
    const d = this.decimalsOf(t);
    return this.nextTick(`tr:${t.symbol}:${limit}`, () => this.client.getLiveFills(t.pool, { limit }), (fills) => fills.map((f) => {
      const price = this.priceView(t, f.fillPrice, d.price);
      const amount = toHumanNum(f.quantity, d.amount);
      const tsMs = Number(f.timestamp) * 1e3;
      const side = t.market.marketType === "BINARY" ? this.sideView(t, f.takerSide) : f.takerIsBid === void 0 ? void 0 : f.takerIsBid ? "buy" : "sell";
      return { id: f.id, symbol: t.symbol, price, amount, cost: price * amount, side, txHash: f.txHash, timestamp: tsMs, datetime: toDatetime(tsMs), info: f };
    }));
  }
  /**
   * Streaming view of MY orders on this tradable (authenticated).
   *
   * **When to use**
   *
   * Use to learn that a resting order filled: its status flips to "closed".
   *
   * **Example** (Waiting for an order)
   *
   * Place a limit order, then block until it fully fills (or dies).
   *
   * ```ts
   * const placed = await exchange.createOrder(symbol, "limit", "buy", 10, 0.62);
   * while (placed.status === "open") {
   *   const orders = await exchange.watchOrders(symbol); // resolves on the next change
   *   const mine = orders.find((o) => o.id === placed.id);
   *   if (!mine || mine.status !== "open") break; // filled, canceled, or expired
   * }
   * ```
   */
  async watchOrders(ref, limit = 100) {
    const t = this.market(ref);
    const addr = this.requireAddress("watchOrders");
    await this.ensureWatch(t);
    const d = this.decimalsOf(t);
    return this.nextTick(`ord:${t.symbol}:${addr}`, () => this.client.getLiveUserOrders(t.pool, addr, { limit }), (orders) => orders.filter((o) => {
      if (t.market.marketType !== "BINARY" || !t.outcome)
        return true;
      if (!o.side)
        return true;
      const oc = o.side === "BUY_YES" || o.side === "SELL_YES" ? "YES" : "NO";
      return oc === t.outcome;
    }).map((o) => {
      const tsMs = Number(o.createdAt) * 1e3;
      return {
        id: o.orderId,
        symbol: t.symbol,
        side: (t.market.marketType === "BINARY" ? this.sideView(t, o.side) : o.isBid ? "buy" : "sell") ?? "buy",
        price: this.priceView(t, o.price, d.price),
        amount: toHumanNum(o.fullQuantity, d.amount),
        filled: toHumanNum(o.filledQuantity, d.amount),
        remaining: toHumanNum(o.quantityRemaining, d.amount),
        status: toUnifiedStatus(o.status),
        timestamp: tsMs,
        datetime: toDatetime(tsMs),
        info: o
      };
    }));
  }
  /** Streaming view of MY fills on this tradable (authenticated). */
  async watchMyTrades(ref, limit = 50) {
    const t = this.market(ref);
    const addr = this.requireAddress("watchMyTrades");
    await this.ensureWatch(t);
    const d = this.decimalsOf(t);
    const lcAddr = addr.toLowerCase();
    return this.nextTick(`mytr:${t.symbol}:${addr}`, () => this.client.getLiveUserFills(t.pool, addr, { limit }), (fills) => fills.map((f) => {
      var _a, _b;
      const price = this.priceView(t, f.fillPrice, d.price);
      const amount = toHumanNum(f.quantity, d.amount);
      const tsMs = Number(f.timestamp) * 1e3;
      const mySide = ((_a = f.taker) == null ? void 0 : _a.toLowerCase()) === lcAddr ? f.takerSide : ((_b = f.maker) == null ? void 0 : _b.toLowerCase()) === lcAddr ? f.makerSide : void 0;
      return { id: f.id, symbol: t.symbol, price, amount, cost: price * amount, side: this.sideView(t, mySide), timestamp: tsMs, datetime: toDatetime(tsMs), info: f };
    }));
  }
  // ------------------------------------------------------------- price feeds
  /** Hold the ref-counted price watch behind an asset (idempotent). */
  async ensurePriceWatch(asset) {
    const key = asset.toUpperCase();
    await this.priceWatches.getOrCreate(key, () => this.client.watchPrice(key));
  }
  toUnifiedPrice(asset, live) {
    if (!live)
      return null;
    const tsMs = live.blockTimestamp * 1e3;
    return { symbol: asset.toUpperCase(), price: live.price, ema: live.ema, timestamp: tsMs, datetime: toDatetime(tsMs), info: live };
  }
  /**
   *  Streaming price off the local price store: zero round-trips, current to the
   *  last pushed tick; each await resolves on the next price change.
   *
   *  **Details**
   *
   *  First call hydrates the ref-counted feed watch.
   *
   *  **Gotchas**
   *
   *  Requires `config.priceFeed` to be set.
   */
  async watchPrice(asset) {
    const key = asset.toUpperCase();
    await this.ensurePriceWatch(key);
    return this.nextTick(`px:${key}`, () => this.client.getLivePrice(key), (live) => this.toUnifiedPrice(key, live) ?? { symbol: key, price: 0, ema: 0, timestamp: Date.now(), datetime: toDatetime(Date.now()), info: null });
  }
  /**
   *  One-shot current price (indexer HTTP read; no watch needed), or null if the
   *  feed has no observations yet.
   */
  async fetchPrice(asset) {
    const live = await this.client.fetchPrice(asset);
    return this.toUnifiedPrice(asset, live);
  }
  /**
   *  OHLC price candles (EMA oracle), oldest first as [ms,o,h,l,c,vol] rows.
   *
   *  **Details**
   *
   *  Timeframes: 1m 1h 1d (aliases for the feed's M1/H1/D1).
   *
   *  **Gotchas**
   *
   *  `vol` is the oracle update count for the bucket (NOT trade volume).
   */
  async fetchPriceOHLCV(asset, timeframe = "1m", since, limit = 500) {
    const resolution = PRICE_TIMEFRAMES[timeframe] ?? timeframe;
    if (!VALID_RESOLUTIONS.has(resolution)) {
      throw new InvalidInputError(`unknown price timeframe ${timeframe} (have: ${Object.keys(PRICE_TIMEFRAMES).join(" ")})`);
    }
    const rows = await this.client.fetchPriceCandles(asset, resolution, { limit, from: since ? Math.floor(since / 1e3) : void 0 });
    return rows.map((c) => [c.bucketStart * 1e3, c.open, c.high, c.low, c.close, c.count]);
  }
  // ------------------------------------------------------------- writes
  /**
   * Place an order.
   *
   * **Details**
   *
   * Works identically for every market kind: the tradable symbol carries the
   * outcome, `side` is plain buy/sell, prices and amounts are human units in the
   * tradable's own terms. `type: "market"` computes a crossing limit from the
   * best opposite level ± `params.slippage` (default 1%) and sends it IOC.
   * Resolves once mined, with fills decoded from the same round-trip.
   *
   * **Gotchas**
   *
   * A NO price is the NO probability — the YES-terms complement is handled
   * internally.
   *
   * The price and quantity are ALIGNED to the market's tick and lot grids before
   * they are sent, because the pool rejects an off-grid value outright. Alignment
   * never moves a value against you: a buy price rounds down, a sell price rounds
   * up, and a quantity always rounds down, so the order is never larger or worse
   * priced than you asked for. The returned {@link UnifiedOrder} carries what was
   * actually placed, which may differ from the arguments by up to one tick or lot
   * — read `price` and `amount` back from it rather than assuming your inputs.
   * Pre-aligning with {@link priceToPrecision} / {@link amountToPrecision} makes
   * this a no-op, since aligning an aligned value changes nothing.
   *
   * Note {@link priceToPrecision} always rounds DOWN, for either side; this path
   * is side-aware instead, so for a sell the two can differ by one tick.
   *
   * A quantity below one whole lot throws {@link InvalidInputError} rather than
   * silently placing a zero-quantity order.
   *
   * - Throws {@link SignerRequiredError} - the exchange was built without a `privateKey` / `account` / `walletClient`.
   * - Throws {@link InvalidInputError} - unknown symbol (call `loadMarkets()` first), a `"limit"` order with no price, or a `"market"` order whose opposite book side is empty so no crossing price exists.
   * - Throws {@link ContractRevertError} - the chain rejected the order. Branch on `errorName` for the protocol's own reason (e.g. `InsufficientBalance`, `ExpiredOrderMustBeCancelled`).
   * - Throws {@link RpcError} - the send never got an answer from the node.
   * - Throws {@link IndexerError} - a symbol lookup needed the indexer and it was unreachable.
   *
   * **Example** (Placing binary orders)
   *
   * Rest a bid at 62% on YES, then take the NO book at market.
   *
   * ```ts
   * const rested = await exchange.createOrder("BTC-95000-31DEC26/USDC#YES", "limit", "buy", 25, 0.62);
   * console.log(rested.status, rested.filled); // "open" 0 — or "closed" if it crossed
   *
   * const taken = await exchange.createOrder("BTC-95000-31DEC26/USDC#NO", "market", "sell", 10, undefined, {
   *   slippage: 0.02, // accept up to 2% past the best bid
   * });
   * ```
   */
  async createOrder(ref, type, side, amount, price, params = {}) {
    var _a;
    const t = this.market(ref);
    const d = this.decimalsOf(t);
    const lotRaw = this.lotOf(t, "createOrder");
    const quantity = toRaw(amount, d.amount) / lotRaw * lotRaw;
    if (quantity <= 0n) {
      throw new InvalidInputError(`amount ${amount} is below one lot on ${t.symbol} (lot ${toHumanNum(lotRaw, d.amount)}) — it would place a zero-quantity order`);
    }
    let limitPrice = price;
    if (type === "market") {
      limitPrice = await this.crossingPrice(t, side, params.slippage ?? 0.01);
    }
    if (limitPrice === void 0) {
      throw new InvalidInputError("a limit order needs a price");
    }
    limitPrice = snapToGrid(limitPrice, this.tickOf(t, "createOrder"), d.price, {
      direction: side === "buy" ? "down" : "up",
      clamp: t.market.marketType === "BINARY"
    });
    const orderType = type === "market" ? ORDER_TYPE.MARKET : params.postOnly || params.timeInForce === "PO" ? ORDER_TYPE.POST_ONLY : params.timeInForce === "FOK" ? ORDER_TYPE.FILL_OR_KILL : params.timeInForce === "IOC" ? ORDER_TYPE.MARKET : ORDER_TYPE.LIMIT;
    let result2;
    if (t.market.marketType === "BINARY") {
      const yesish = t.outcomeIndex !== 1;
      const binarySide = yesish ? side === "buy" ? "BUY_YES" : "SELL_YES" : side === "buy" ? "BUY_NO" : "SELL_NO";
      result2 = await this.trader.placeOrder({
        pool: t.pool,
        side: binarySide,
        price: this.toNativePrice(t, limitPrice),
        quantity,
        orderType,
        builder: params.builder,
        builderFeeBpsTimes1k: params.builderFeeBpsTimes1k
      });
    } else if (t.market.marketType === "PERP") {
      result2 = await this.trader.placePerpOrder({
        pool: t.pool,
        isBid: side === "buy",
        price: toRaw(limitPrice, d.price),
        quantity,
        orderType,
        builder: params.builder,
        builderFeeBpsTimes1k: params.builderFeeBpsTimes1k
      });
    } else {
      const s = t.market;
      result2 = await this.trader.placeSpotOrder({
        pool: t.pool,
        isBid: side === "buy",
        price: toRaw(limitPrice, d.price),
        quantity,
        baseDecimals: s.baseDecimals,
        quoteToken: s.quoteToken,
        baseToken: s.baseToken,
        baseIsNative: s.baseIsNative,
        orderType,
        builder: params.builder,
        builderFeeBpsTimes1k: params.builderFeeBpsTimes1k
      });
    }
    const filledRaw = result2.fills.reduce((acc, f) => acc + f.quantityFilled, 0n);
    const filled = toHumanNum(filledRaw, d.amount);
    const placedAmount = toHumanNum(quantity, d.amount);
    const remaining = Math.max(0, placedAmount - filled);
    const rests = orderType === ORDER_TYPE.LIMIT || orderType === ORDER_TYPE.POST_ONLY;
    const now = Date.now();
    return {
      id: ((_a = result2.orderId) == null ? void 0 : _a.toString()) ?? result2.hash,
      symbol: t.symbol,
      type,
      side,
      price: limitPrice,
      amount: placedAmount,
      filled,
      remaining,
      // fully filled → closed; resting remainder → open; IOC/market remainder → canceled
      status: remaining <= 0 ? "closed" : rests && result2.orderId !== void 0 ? "open" : "canceled",
      txHash: result2.hash,
      timestamp: now,
      datetime: toDatetime(now),
      info: result2
    };
  }
  async crossingPrice(t, side, slippage) {
    var _a, _b;
    const book = this.client.getWatchStatus(t.pool) === "live" ? { symbol: t.symbol, ...this.bookView(t, t.market.marketType === "BINARY" ? this.client.getLiveBinaryOrderBook(t.pool, { depth: 1 }) : this.client.getLiveSpotOrderBook(t.pool, { depth: 1 })) } : await this.fetchOrderBook(t.symbol, 1);
    const best = side === "buy" ? (_a = book.asks[0]) == null ? void 0 : _a[0] : (_b = book.bids[0]) == null ? void 0 : _b[0];
    if (best === void 0) {
      throw new InvalidInputError(`cannot price a market ${side} on ${t.symbol} — the opposite side of the book is empty`);
    }
    const padded = side === "buy" ? best * (1 + slippage) : best * (1 - slippage);
    return snapToGrid(padded, this.tickOf(t, "createOrder"), this.decimalsOf(t).price, {
      direction: side === "buy" ? "up" : "down",
      // Binary prices are probabilities: clamp inside (0, 1) — to a whole tick
      // either side, not the one raw unit this used before, which is not itself
      // on the grid of any venue whose tick exceeds a single unit.
      //
      // `createOrder`, the only caller, clamps again on the way out, so this is
      // redundant for that path and no test can distinguish it. Kept because the
      // pre-existing code bounded the value here, and returning an out-of-range
      // probability from a helper that computes one is a trap for the next caller.
      clamp: t.market.marketType === "BINARY"
    });
  }
  /**
   * Cancel a resting order by id (from createOrder / watchOrders).
   *
   * **Gotchas**
   *
   * - Throws {@link SignerRequiredError} - no signer on this exchange.
   * - Throws {@link InvalidInputError} - unknown symbol.
   * - Throws {@link ContractRevertError} - the cancel did not land; `errorName` says why (an already-filled or already-canceled order reverts).
   * - Throws {@link RpcError} - the send never got an answer from the node.
   *
   * **Example** (Cancelling an open order)
   *
   * ```ts
   * const placed = await exchange.createOrder("SOMI/USDC", "limit", "buy", 10, 0.55);
   * if (placed.status === "open") await exchange.cancelOrder(placed.id, "SOMI/USDC");
   * ```
   */
  async cancelOrder(id2, ref) {
    const t = this.market(ref);
    const res = await this.trader.cancelOrder({ pool: t.pool, orderId: id2 });
    return { id: id2, symbol: t.symbol, status: "canceled", info: res };
  }
  // ------------------------------------------------- stop orders
  /** The spot tradable + its stop registry, or a loud error naming the gap. */
  requireStopVenue(ref) {
    const t = this.market(ref);
    if (t.market.marketType !== "SPOT") {
      throw new InvalidInputError(`stop orders are not available on ${t.market.marketType} markets yet`);
    }
    const registry = t.market.stopRegistry;
    if (!registry) {
      throw new InvalidInputError(`${t.symbol} has no stop-order registry`);
    }
    return { t, registry };
  }
  /**
   * Place a stop / take-profit order: rests OFF the book on the market's
   * stop registry and fires as a market or limit order when the pool's mark
   * price crosses `triggerPrice`. The trigger direction is inferred from
   * which side of the current mark the trigger sits on; pass
   * `params.triggerDirection` to pin it explicitly.
   *
   * **Gotchas**
   *
   * The trigger, limit price and quantity are aligned to the market's grids, and
   * the trigger aligns AWAY from the mark so it cannot land on it (a trigger equal
   * to the mark fires the instant it is armed). The limit price aligns like any
   * order price — a buy down, a sell up — so it never becomes worse than stated.
   *
   * Those two rules are independent, so a limit set exactly EQUAL to the trigger
   * can end up one tick inside it: a buy stop at trigger `0.5004`, limit `0.5004`
   * on a `0.001` grid arms at `0.501` and rests a `0.500` bid, which may not fill.
   * That is deliberate — pulling the limit up to meet the trigger would make you
   * pay more than you asked. Set the limit a tick or two past the trigger when you
   * want the triggered order to cross.
   *
   * **Example** (Placing a stop order)
   *
   * A stop-loss: sell 5 if the mark drops to 1.10.
   *
   * ```ts
   * const stop = await exchange.createStopOrder("SOMI/USDC", "market", "sell", 5, 1.10);
   * // …later: await exchange.cancelStopOrder(stop.id, "SOMI/USDC");
   * ```
   */
  async createStopOrder(ref, type, side, amount, triggerPrice, price, params = {}) {
    const { t, registry } = this.requireStopVenue(ref);
    const s = t.market;
    const d = this.decimalsOf(t);
    if (type === "limit" && price === void 0) {
      throw new InvalidInputError("a limit stop order needs a price");
    }
    let direction = params.triggerDirection;
    if (!direction) {
      const fresh = await this.client.getMarketByPool(t.pool).catch(() => null);
      const markRaw = (fresh == null ? void 0 : fresh.markPrice) ?? (fresh == null ? void 0 : fresh.lastPrice);
      const mark = markRaw != null ? toHumanNum(markRaw, d.price) : void 0;
      if (mark === void 0 || mark === triggerPrice) {
        throw new InvalidInputError("cannot infer the trigger direction — pass params.triggerDirection");
      }
      direction = triggerPrice > mark ? "above" : "below";
    }
    const tickRaw = this.tickOf(t, "createStopOrder");
    const lotRaw = this.lotOf(t, "createStopOrder");
    const priceDirection = side === "buy" ? "down" : "up";
    const limitPrice = price !== void 0 ? toRaw(snapToGrid(price, tickRaw, d.price, { direction: priceDirection }), d.price) : void 0;
    const alignedQuantity = toRaw(amount, d.amount) / lotRaw * lotRaw;
    if (alignedQuantity <= 0n) {
      throw new InvalidInputError(`amount ${amount} is below one lot on ${t.symbol} (lot ${toHumanNum(lotRaw, d.amount)}) — it would place a zero-quantity stop order`);
    }
    const alignedTrigger = snapToGrid(triggerPrice, tickRaw, d.price, {
      direction: direction === "above" ? "up" : "down"
    });
    const result2 = await this.trader.placeSpotStopOrder({
      registry,
      pool: t.pool,
      isBid: side === "buy",
      quantity: alignedQuantity,
      triggerPrice: toRaw(alignedTrigger, d.price),
      // 0 = GTE (mark ≥ trigger), 1 = LTE (mark ≤ trigger).
      triggerOperator: direction === "above" ? 0 : 1,
      // 1 = MARKET at trigger, 0 = LIMIT.
      stopOrderType: type === "market" ? 1 : 0,
      ...limitPrice !== void 0 ? { limitPrice } : {},
      quoteToken: s.quoteToken,
      baseToken: s.baseToken,
      baseIsNative: s.baseIsNative
    });
    if (result2.stopOrderId === void 0) {
      throw new RpcError("createStopOrder", `stop order tx ${result2.hash} landed but PendingOrderCreated was not in the receipt (ABI/deployment drift?) — registry id unknown; recover via the registry directly`);
    }
    const now = Date.now();
    return {
      id: result2.stopOrderId.toString(),
      symbol: t.symbol,
      type,
      side,
      // The ALIGNED values, not the caller's — this describes the stop that is
      // now armed on-chain, which is what a caller reconciling against it needs.
      amount: toHumanNum(alignedQuantity, d.amount),
      triggerPrice: alignedTrigger,
      triggerDirection: direction,
      ...limitPrice !== void 0 ? { price: toHumanNum(limitPrice, d.price) } : {},
      status: "pending",
      timestamp: now,
      datetime: toDatetime(now),
      txHash: result2.hash,
      info: result2
    };
  }
  /**
   * The wallet's pending (armed, untriggered) stop orders, newest first.
   * Scope to one tradable with `ref`.
   */
  async fetchOpenStopOrders(ref) {
    const addr = this.requireAddress("fetchOrders");
    const t = ref ? this.market(ref) : void 0;
    const rows = await this.client.getSpotStopOrders(addr, {
      status: "PENDING",
      ...t ? { pool: t.pool } : {}
    });
    const out = [];
    for (const o of rows) {
      const rt = this.tryResolvePool(o.market.poolAddress);
      if (!rt)
        continue;
      const d = this.decimalsOf(rt);
      const tsMs = Number(o.createdAt) * 1e3;
      out.push({
        id: o.orderId,
        symbol: rt.symbol,
        type: o.orderType === 1 ? "market" : "limit",
        side: o.isBid ? "buy" : "sell",
        amount: toHumanNum(o.quantity, d.amount),
        triggerPrice: toHumanNum(o.triggerPrice, d.price),
        triggerDirection: o.triggerOperator === 0 ? "above" : "below",
        status: "pending",
        ...o.placedOrderId != null ? { triggeredOrderId: o.placedOrderId } : {},
        timestamp: tsMs,
        datetime: toDatetime(tsMs),
        info: o
      });
    }
    return out;
  }
  /**
   * Cancel a pending stop order on its registry (refunds the keeper
   * payment). `id` comes from {@link fetchOpenStopOrders}.
   */
  async cancelStopOrder(id2, ref) {
    const { t, registry } = this.requireStopVenue(ref);
    const res = await this.trader.cancelStopOrder({ registry, orderId: id2 });
    return { id: id2, symbol: t.symbol, status: "canceled", info: res };
  }
  // ------------------------------------------------- perp specifics
  /** Live funding-rate + mark/index snapshot for a perp market (chain read). */
  async fetchFundingRate(ref) {
    const t = this.requirePerpMarket(ref);
    const m = t.market;
    const s = await this.client.getPerpState(t.pool);
    const now = Date.now();
    return {
      symbol: t.symbol,
      // Gated on BOTH, matching perpMarkForPnl and fetchTicker. `tryGetMarkPrice`
      // returns (ok, price) and the price word is meaningless when ok is false;
      // `_tryMarkPrice` also maps a zero price to (false, 0), so `ok` implies non-zero
      // today — enforced here anyway rather than trusted, because a mark of 0 on the
      // wire is the sentinel mistake this whole change exists to prevent.
      markPrice: s.markPriceOk && s.markPrice > 0n ? toHumanNum(s.markPrice, m.quoteDecimals) : void 0,
      indexPrice: toHumanNum(s.indexPrice, m.quoteDecimals),
      // Normalized to the same per-8h axis as fetchFundingRateHistory. Load-bearing: the
      // chain value is per CALCULATION WINDOW, and if the live reading and the history
      // sat on different axes, a chart's newest point would jump relative to the series
      // it extends. `info` carries fundingWindowSec / fundingIntervalSec for anyone who
      // needs the per-interval or annualized form.
      fundingRate: Number(fundingRate8h(s.fundingRate, s.fundingWindowSec)) / 1e18,
      // The NEXT settlement time, which is what a ccxt consumer expects here — the last
      // anchor plus the settlement interval. Previously reported the ORACLE's updatedAt,
      // which is a different clock entirely and drifts from the funding schedule.
      // Settlement is permissionless and lazy, so this can be in the past.
      fundingTimestamp: Number(s.nextFundingAt) * 1e3,
      timestamp: now,
      datetime: toDatetime(now),
      info: s
    };
  }
  /**
   *  Historical funding rates for a perp market, oldest first (ccxt-standard shape).
   *
   *  Reads the INDEXED series rather than the chain: only one funding value is readable
   *  on chain at a time. Positional `(symbol, since, limit)` follows the ccxt convention
   *  set by `fetchOHLCV`, unlike the object-options readers on the client.
   *
   *  `fundingRate` is normalized to a per-8h fraction using each row's own
   *  `fundingWindowSec`, so the series stays consistent across a parameter change. The
   *  raw indexed row is on `info` for anything more specific — including `spanStart` /
   *  `spanEnd`, which matter because a row's accrual reaches BACKWARDS from its timestamp
   *  and a lazily-settled one can cover hours.
   *
   *  `since` is a CURSOR, not just a window bound: passing it walks FORWARD from that
   *  point, so the ccxt pagination idiom terminates.
   *
   * **Details**
   *
   * - `ref`: market symbol or pool address
   * - `since`: unix MILLISECONDS (ccxt convention), inclusive; acts as a forward cursor
   * - `limit`: max rows (default 100)
   *
   * **Example** (Paging through funding history)
   *
   *  ```ts
   *  let since = startOfHistory;
   *  for (;;) {
   *    const page = await exchange.fetchFundingRateHistory("BTC/USDSO:USDSO", since, 100);
   *    if (page.length === 0) break;
   *    consume(page);
   *    since = page[page.length - 1].timestamp + 1;   // advances
   *  }
   *  ```
   *
   *  Without the forward ordering this loop spins: the underlying read pages newest-first,
   *  so narrowing the window from below still returns the newest N and `since` never gets
   *  past the tail. Omitting `since` keeps the newest-first behaviour, which is what a
   *  "latest funding" read wants — `fetchOHLCV` has the same split.
   */
  async fetchFundingRateHistory(ref, since, limit) {
    const t = this.requirePerpMarket(ref);
    const m = t.market;
    const rows = await this.client.listFundingRateHistory(t.pool, {
      limit: limit ?? 100,
      // ccxt speaks milliseconds; the indexer stores unix seconds.
      // With `since` the read ASCENDS, so the page starts at the cursor rather than at the
      // newest row — the whole point, and it means no reverse is needed below.
      ...since != null ? { from: Math.floor(since / 1e3), order: "asc" } : {}
    });
    return (since != null ? rows : rows.slice().reverse()).map((r) => {
      const ts = Number(r.timestamp) * 1e3;
      return {
        symbol: t.symbol,
        markPrice: r.markPrice == null ? void 0 : toHumanNum(BigInt(r.markPrice), m.quoteDecimals),
        indexPrice: toHumanNum(BigInt(r.indexPrice), m.quoteDecimals),
        fundingRate: Number(fundingRate8h(BigInt(r.fundingRate), r.fundingWindowSec)) / 1e18,
        fundingTimestamp: ts,
        timestamp: ts,
        datetime: toDatetime(ts),
        info: r
      };
    });
  }
  /**
   *  Open perp positions (authenticated; on-chain MarginBank reads). Pass
   *  symbols to scope; defaults to every loaded perp market.
   */
  async fetchPositions(refs) {
    const addr = this.requireAddress("fetchPositions");
    await this.loadMarkets();
    const tradables = refs ? refs.map((r) => this.requirePerpMarket(r)) : Object.values(this.markets).filter((m) => m.type === "swap").map((m) => this.market(m.symbol));
    const out = await Promise.all(tradables.map(async (t) => {
      const m = t.market;
      const [pos, state] = await Promise.all([
        this.client.getPerpPosition({ marginBank: m.marginBank, account: addr, pool: t.pool }),
        this.client.getPerpState(t.pool)
      ]);
      if (pos.size === 0n)
        return null;
      const long = pos.size > 0n;
      const size = toHumanNum(long ? pos.size : -pos.size, m.baseDecimals);
      const entryPrice = toHumanNum(pos.avgEntryPrice, m.quoteDecimals);
      const mark = perpMarkForPnl(state);
      const markPrice = toHumanNum(mark.price, m.quoteDecimals);
      const tsMs = Number(pos.lastUpdatedTimestampNs / 1000000n);
      const liqRaw = await this.client.getLiquidationPrice({ marginBank: m.marginBank, account: addr, pool: t.pool }).catch(() => null);
      return {
        symbol: t.symbol,
        side: long ? "long" : "short",
        contracts: size,
        entryPrice,
        markPrice,
        unrealizedPnl: (markPrice - entryPrice) * (long ? size : -size),
        liquidationPrice: liqRaw != null ? toHumanNum(liqRaw, m.quoteDecimals) : void 0,
        timestamp: tsMs,
        datetime: toDatetime(tsMs),
        // markFromIndex says whether markPrice/unrealizedPnl came from the mark feed or
        // fell back to the index — surface it if you display PnL.
        info: { position: pos, state, markFromIndex: mark.fromIndex }
      };
    }));
    return out.filter((p) => p !== null);
  }
  /**
   *  Deposit collateral into the perp MarginBank (human quote units, e.g.
   *  USDso). One cross-margin balance covers every perp market.
   */
  async depositMargin(ref, amount) {
    const t = this.requirePerpMarket(ref);
    const m = t.market;
    const res = await this.trader.depositMargin({
      marginBank: m.marginBank,
      amount: toRaw(amount, m.quoteDecimals)
    });
    return { hash: res.hash, info: res };
  }
  /** Withdraw free collateral from the perp MarginBank (human quote units). */
  async withdrawMargin(ref, amount) {
    const t = this.requirePerpMarket(ref);
    const m = t.market;
    const res = await this.trader.withdrawMargin({
      marginBank: m.marginBank,
      amount: toRaw(amount, m.quoteDecimals)
    });
    return { hash: res.hash, info: res };
  }
  requirePerpMarket(ref) {
    const t = this.market(ref);
    if (t.market.marketType !== "PERP") {
      throw new InvalidInputError(`${t.marketSymbol} is not a perp market`);
    }
    return t;
  }
  // ------------------------------------------- outcome-market specifics
  /**
   * Mint complete sets: `amount` collateral → `amount` of EVERY outcome.
   *
   * **Example** (Minting complete sets)
   *
   * Mint 100 sets (100 USDC → 100 YES + 100 NO), then sell the side you don't want.
   *
   * ```ts
   * await exchange.mintSet("BTC-95000-31DEC26/USDC", 100);
   * await exchange.createOrder("BTC-95000-31DEC26/USDC#NO", "limit", "sell", 100, 0.38);
   * ```
   */
  async mintSet(ref, amount) {
    const t = this.requireOutcomeMarket(ref);
    const res = await this.trader.mintSet({ pool: t.pool, amount: toRaw(amount, t.market.baseDecimals) });
    return { hash: res.hash, info: res };
  }
  /** Burn complete sets back to collateral. */
  async burnSet(ref, amount) {
    const t = this.requireOutcomeMarket(ref);
    const res = await this.trader.burnSet({ pool: t.pool, amount: toRaw(amount, t.market.baseDecimals) });
    return { hash: res.hash, info: res };
  }
  /**
   * Redeem winning outcome tokens for collateral (post-resolution). Settlement-
   * extraction v2: module-routed by `marketId` (the winning outcome is read off
   * the BinaryMarket contract when not resolved yet in the indexed row).
   *
   * **Example** (Redeeming a winning position)
   *
   * After resolution, redeem the winning side found in the balance map.
   *
   * ```ts
   * const bal = await exchange.fetchBalance();
   * const winning = bal["BTC-95000-31DEC26/USDC#YES"]?.total ?? 0;
   * if (winning > 0) await exchange.redeem("BTC-95000-31DEC26/USDC", winning);
   * ```
   */
  async redeem(ref, amount) {
    const t = this.requireOutcomeMarket(ref);
    const bm = t.market;
    const res = await this.trader.redeem({
      marketId: bm.marketId,
      market: bm.marketAddress,
      // Use the indexed winning outcome when present to skip the on-chain read.
      outcomeIdx: bm.winningOutcome == null ? void 0 : bm.winningOutcome,
      amount: toRaw(amount, t.market.baseDecimals)
    });
    return { hash: res.hash, info: res };
  }
  requireOutcomeMarket(ref) {
    const t = this.market(ref);
    if (t.market.marketType !== "BINARY") {
      throw new InvalidInputError(`${t.marketSymbol} is not an outcome market`);
    }
    return t;
  }
  // ------------------------------------------------------------- lifecycle
  /**
   *  Release every watch + channel this exchange holds and stop the client's
   *  live machinery.
   *
   *  **Details**
   *
   *  The instance stays usable for one-shot fetch calls.
   */
  async close() {
    var _a, _b;
    for (const p of this.watches.values()) {
      await p.then((h) => h.stop()).catch(() => void 0);
    }
    this.watches.clear();
    for (const p of this.priceWatches.values()) {
      await p.then((h) => h.stop()).catch(() => void 0);
    }
    this.priceWatches.clear();
    (_a = this.unsubscribe) == null ? void 0 : _a.call(this);
    this.unsubscribe = null;
    (_b = this.unsubscribePrices) == null ? void 0 : _b.call(this);
    this.unsubscribePrices = null;
    this.channels.clear();
    this.client.stopLive();
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/addresses.js
var SOMNIA_TESTNET_ADDRESSES = {
  binaryModule: "0x3ecC694Cef705358864a646142ac17A90E29e388",
  binaryPoolBeacon: "0x85C01B5ef4F4ed59caC69749565e309f01b14Dbc",
  binaryPoolImpl: "0x48e523c9f22f98548d263f0aD444D732e5202C0E",
  binarySettlement: "0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23",
  clobFactory: "0x1a478019Ae4d24249a962934af0f129CE98B5e6f",
  collateral: "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E",
  collateralRouter: "0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C",
  marketCreator: "0x138CfA6b80475b8c03d7E468b2442278E51e645a",
  marketCreatorFactory: "0xE6bEE93cE87c9E6e62aCb621caa7832EE47b4F6B",
  marketsCore: "0x2802504314685D89bF6C992CA5a8e7cC78bc0294",
  oracleHub: "0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b",
  testUsdc: "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E",
  lend: SOMNIA_TESTNET_LEND
};
var SOMNIA_MAINNET_ADDRESSES = {
  binaryModule: "0x3ecC694Cef705358864a646142ac17A90E29e388",
  binaryPoolBeacon: "0x85C01B5ef4F4ed59caC69749565e309f01b14Dbc",
  binaryPoolImpl: "0x48e523c9f22f98548d263f0aD444D732e5202C0E",
  binarySettlement: "0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23",
  clobFactory: "0x1a478019Ae4d24249a962934af0f129CE98B5e6f",
  collateral: "0x00000022dA000002656c64D9eA6011ea952D008A",
  collateralRouter: "0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C",
  marketCreator: "0xfe81C4e8EfFb7df27Eb21881f80AF2BF8DCF0c39",
  marketCreatorFactory: "0xE6bEE93cE87c9E6e62aCb621caa7832EE47b4F6B",
  marketsCore: "0x2802504314685D89bF6C992CA5a8e7cC78bc0294",
  oracleHub: "0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b",
  testUsdc: "0x00000022dA000002656c64D9eA6011ea952D008A",
  lend: SOMNIA_MAINNET_LEND
};

// node_modules/@somnia-chain/markets-sdk/dist/queryKeys.js
var QUERY_KEY_SCOPE = "somnia-markets";
function pruned(opts) {
  const out = {};
  for (const [k, v] of Object.entries(opts)) {
    if (v !== void 0)
      out[k] = v;
  }
  return out;
}
function id(value) {
  return value == null ? null : value.toLowerCase();
}
function marketsKey(opts) {
  return [
    QUERY_KEY_SCOPE,
    "markets",
    pruned({ marketType: opts == null ? void 0 : opts.marketType, limit: opts == null ? void 0 : opts.limit, offset: opts == null ? void 0 : opts.offset })
  ];
}
function portfolioKey(account, opts) {
  return [
    QUERY_KEY_SCOPE,
    "portfolio",
    id(account),
    pruned({ ordersLimit: opts == null ? void 0 : opts.ordersLimit, tradesLimit: opts == null ? void 0 : opts.tradesLimit, since: opts == null ? void 0 : opts.since })
  ];
}
function candlesKey(pool, intervalSeconds, opts) {
  return [
    QUERY_KEY_SCOPE,
    "candles",
    id(pool),
    intervalSeconds,
    pruned({ limit: opts == null ? void 0 : opts.limit, from: opts == null ? void 0 : opts.from, to: opts == null ? void 0 : opts.to })
  ];
}
function marketActivityKey(market, opts) {
  return [
    QUERY_KEY_SCOPE,
    "marketActivity",
    id(market),
    pruned({
      limit: opts == null ? void 0 : opts.limit,
      since: opts == null ? void 0 : opts.since,
      until: opts == null ? void 0 : opts.until,
      pool: (opts == null ? void 0 : opts.pool) == null ? void 0 : opts.pool.toLowerCase(),
      kinds: (opts == null ? void 0 : opts.kinds) == null ? void 0 : [...opts.kinds].sort().join(",")
    })
  ];
}
function tradeContextKey(id2) {
  return [QUERY_KEY_SCOPE, "tradeContext", id2 ?? null];
}
function transactionActivityKey(txHash, opts) {
  return [QUERY_KEY_SCOPE, "transactionActivity", id(txHash), pruned({ limit: opts == null ? void 0 : opts.limit })];
}
function marketFeesKey(marketId) {
  return [QUERY_KEY_SCOPE, "marketFees", id(marketId)];
}
function operatorsKey(opts) {
  var _a;
  return [
    QUERY_KEY_SCOPE,
    "operators",
    pruned({
      owner: (_a = opts == null ? void 0 : opts.owner) == null ? void 0 : _a.toLowerCase(),
      enabled: opts == null ? void 0 : opts.enabled,
      limit: opts == null ? void 0 : opts.limit,
      offset: opts == null ? void 0 : opts.offset
    })
  ];
}
function marketCreatorsKey(opts) {
  var _a, _b;
  return [
    QUERY_KEY_SCOPE,
    "marketCreators",
    pruned({
      owner: (_a = opts == null ? void 0 : opts.owner) == null ? void 0 : _a.toLowerCase(),
      operatorId: opts == null ? void 0 : opts.operatorId,
      venueId: (_b = opts == null ? void 0 : opts.venueId) == null ? void 0 : _b.toLowerCase(),
      limit: opts == null ? void 0 : opts.limit,
      offset: opts == null ? void 0 : opts.offset
    })
  ];
}
function oracleAdaptersKey(opts) {
  var _a;
  return [
    QUERY_KEY_SCOPE,
    "oracleAdapters",
    pruned({
      owner: (_a = opts == null ? void 0 : opts.owner) == null ? void 0 : _a.toLowerCase(),
      approved: opts == null ? void 0 : opts.approved,
      limit: opts == null ? void 0 : opts.limit,
      offset: opts == null ? void 0 : opts.offset
    })
  ];
}
function syncStatusKey(chainId) {
  return [QUERY_KEY_SCOPE, "syncStatus", chainId];
}
function maxVenueFeeBpsKey() {
  return [QUERY_KEY_SCOPE, "maxVenueFeeBps"];
}
function marketOnchainKey(marketId) {
  return [QUERY_KEY_SCOPE, "marketOnchain", id(marketId)];
}

// node_modules/@somnia-chain/markets-sdk/dist/binary/plugin.js
var BINARY_MACHINERY_STEPS = [
  {
    id: "market-creator",
    label: "Market creator + policy",
    description: "Stamp a MarketCreator (+ its policy) from the factory, bound to this operator/venue, the core module, and the protocol OracleHub (the one approved oracle adapter — nothing to mint or arm)."
  },
  {
    id: "funding",
    label: "Fund the creator",
    description: "Send native to the creator — each roll pays reactivity gas plus the create value getSchedulingCost(def) + resolveReserve() (the reserve is attached to the create and earmarked per-market at onBind; surplus accrues to the operator's withdrawable credit)."
  },
  {
    id: "series",
    label: "Series",
    description: "Register one or more rolling up/down series (asset + interval + settlement window) under the creator."
  }
];
var binaryMarketTypePlugin = {
  marketType: MARKET_TYPE_BINARY_V1,
  label: "Binary (up/down) v1",
  machinerySteps: BINARY_MACHINERY_STEPS,
  encodeVenueFeeParams: (params, client, binaryModule) => encodeBinaryVenueFeeParams(params, client, binaryModule),
  decodeVenueFeeParams: (feeParams) => {
    var _a;
    return ((_a = decodeBinaryVenueFeeParams(feeParams)) == null ? void 0 : _a.params) ?? null;
  }
};

// node_modules/@somnia-chain/markets-sdk/dist/marketTypes/index.js
var MARKET_TYPE_PLUGINS = Object.freeze({
  [binaryMarketTypePlugin.marketType.toLowerCase()]: binaryMarketTypePlugin
});
function getMarketTypePlugin(marketType) {
  return MARKET_TYPE_PLUGINS[marketType.toLowerCase()];
}
function listMarketTypePlugins() {
  return Object.values(MARKET_TYPE_PLUGINS);
}

// node_modules/@somnia-chain/markets-sdk/dist/preflight.js
var ZERO = "0x0000000000000000000000000000000000000000";
var isZero = (a) => a == null || /^0x0*$/.test(a);
var eqAddr = (a, b) => a.toLowerCase() === b.toLowerCase();
function result(blockers, warnings) {
  return { ok: blockers.length === 0, blockers, warnings };
}
var HUB_MIN_FREE_BALANCE_WEI = 32n * 10n ** 18n;
var MIN_SERIES_INTERVAL_SEC = 60;
function preflightOperator(op) {
  const blockers = [];
  const warnings = [];
  if (!eqAddr(op.owner, op.caller)) {
    blockers.push(`Connected wallet ${op.caller} does not own this operator (owner is ${op.owner}).`);
  }
  if (!op.enabled)
    blockers.push("Operator is disabled (its kill switch is off) — enable it before creating markets.");
  if (isZero(op.feeRecipient)) {
    warnings.push("Operator has no default fee recipient — fees fall to the zero address unless a venue overrides it.");
  }
  return result(blockers, warnings);
}
function preflightVenue(v) {
  const blockers = [];
  const warnings = [];
  if (!eqAddr(v.operatorOwner, v.caller)) {
    blockers.push(`Connected wallet ${v.caller} does not own this venue's operator (owner is ${v.operatorOwner}).`);
  }
  if (!v.creationEnabled)
    blockers.push("Venue creation is disabled — flip creationEnabled on before creating markets.");
  if (!v.moduleBound) {
    blockers.push("No module is bound for this venue's market type in MarketsCore — the protocol admin must bind one first.");
  }
  return result(blockers, warnings);
}
function preflightHub(h) {
  const blockers = [];
  const warnings = [];
  if (!h.status.approved) {
    blockers.push("OracleHub is not approved on the module — the protocol admin must run setAdapterApproved(hub, true).");
  }
  if (h.status.balanceWei < HUB_MIN_FREE_BALANCE_WEI) {
    blockers.push(`OracleHub balance ${h.status.balanceWei} wei is below the ${HUB_MIN_FREE_BALANCE_WEI} wei (32 STT) reactivity-bond floor — fund the hub.`);
  }
  if (!h.precompileAvailable) {
    warnings.push("Connected chain has no reactivity precompile (local anvil) — enableReactivity / triggerRoll will not work here; use testnet/mainnet.");
  } else if (h.status.subscriptionId === 0n) {
    blockers.push("OracleHub reactivity is not armed (subscriptionId is 0) — the protocol admin must run enableReactivity.");
  }
  return result(blockers, warnings);
}
function preflightCreateQuote(q) {
  const blockers = [];
  const warnings = [];
  const createValueWei = q.schedulingCostWei + q.resolveReserveWei;
  if (q.balanceWei < createValueWei) {
    blockers.push(`Balance ${q.balanceWei} wei cannot cover the create value ${createValueWei} wei (scheduling cost ${q.schedulingCostWei} + resolveReserve ${q.resolveReserveWei}) — fund the creator.`);
  }
  return result(blockers, warnings);
}
function preflightMarketCreator(c) {
  const blockers = [];
  const warnings = [];
  if (c.precompileAvailable && c.balanceWei === 0n) {
    warnings.push("Market creator holds no native balance — fund it before triggering rolls (each roll attaches the oracle scheduling cost + resolveReserve, which is earmarked per-market at onBind, plus reactivity gas).");
  }
  if (!c.precompileAvailable) {
    warnings.push("Connected chain has no reactivity precompile (local anvil) — triggerRoll will not work here.");
  }
  return result(blockers, warnings);
}
function preflightSeries(s) {
  const blockers = [];
  const warnings = [];
  if (s.seriesId === 0)
    blockers.push("seriesId must be non-zero (the module rejects 0 with UnknownSeries).");
  if (s.asset.trim().length === 0)
    blockers.push('Series asset label is empty — set a non-empty asset (e.g. "BTC/USDT").');
  if (s.intervalSec < MIN_SERIES_INTERVAL_SEC) {
    blockers.push(`Series intervalSec ${s.intervalSec} is below the ${MIN_SERIES_INTERVAL_SEC}s minimum (InvalidSeriesConfig).`);
  }
  if (isZero(s.collateral))
    blockers.push("Series collateral is the zero address — set the venue's collateral token.");
  return result(blockers, warnings);
}
function preflightRoll(r) {
  const blockers = [];
  const warnings = [];
  if (r.seriesIntervalSec === 0)
    blockers.push("Series is not registered on-chain — register it before rolling.");
  if (!r.precompileAvailable) {
    blockers.push("Connected chain has no reactivity precompile (local anvil) — triggerRoll cannot run here; use testnet/mainnet.");
  }
  if (r.creatorBalanceWei === 0n) {
    blockers.push("Market creator holds no native balance — fund it so the roll can pay its reactivity gas.");
  }
  return result(blockers, warnings);
}
function preflightChain(connectedChainId, expectedChainId) {
  const blockers = [];
  if (connectedChainId !== expectedChainId) {
    blockers.push(`Wallet is on chain ${connectedChainId}, expected ${expectedChainId} — switch networks.`);
  }
  return result(blockers, []);
}
function isLocalPrecompileUnavailable(chainId) {
  return chainId === 31337 || chainId === 1337;
}

// node_modules/@somnia-chain/markets-sdk/dist/unified/quotes.js
function walkConsumingBase(levels, baseBudget) {
  let remainingBase = baseBudget;
  let totalBase = 0;
  let totalQuote = 0;
  let levelsConsumed = 0;
  for (const [price, qty] of levels) {
    if (price <= 0)
      continue;
    const fillAtLevel = Math.min(remainingBase, qty);
    totalBase += fillAtLevel;
    totalQuote += fillAtLevel * price;
    remainingBase -= fillAtLevel;
    if (fillAtLevel > 0)
      levelsConsumed += 1;
    if (remainingBase <= 0)
      break;
  }
  return totalBase === 0 ? null : { totalBase, totalQuote, levelsConsumed };
}
function walkConsumingQuote(levels, quoteBudget) {
  let remainingQuote = quoteBudget;
  let totalBase = 0;
  let totalQuote = 0;
  let levelsConsumed = 0;
  for (const [price, qty] of levels) {
    if (price <= 0)
      continue;
    const levelCost = qty * price;
    const fillAtLevel = Math.min(remainingQuote, levelCost);
    totalBase += fillAtLevel / price;
    totalQuote += fillAtLevel;
    remainingQuote -= fillAtLevel;
    if (fillAtLevel > 0)
      levelsConsumed += 1;
    if (remainingQuote <= 0)
      break;
  }
  return totalBase === 0 ? null : { totalBase, totalQuote, levelsConsumed };
}
function estimateMarketOrder(book, side, amount, denomination = "base") {
  if (amount <= 0)
    return null;
  const levels = side === "buy" ? book.asks : book.bids;
  if (levels.length === 0)
    return null;
  const filled = denomination === "quote" ? walkConsumingQuote(levels, amount) : walkConsumingBase(levels, amount);
  if (!filled || filled.totalBase === 0)
    return null;
  return {
    averagePrice: filled.totalQuote / filled.totalBase,
    baseFilled: filled.totalBase,
    quoteFilled: filled.totalQuote,
    levelsConsumed: filled.levelsConsumed
  };
}
function bookMidPrice(book) {
  var _a, _b;
  const bestBid = (_a = book.bids[0]) == null ? void 0 : _a[0];
  const bestAsk = (_b = book.asks[0]) == null ? void 0 : _b[0];
  return bestBid !== void 0 && bestAsk !== void 0 ? (bestBid + bestAsk) / 2 : null;
}
function fillsWithinSlippage(book, side, amount, slippage, denomination = "base") {
  const mid = bookMidPrice(book);
  if (amount <= 0 || mid === null)
    return false;
  const isBuy = side === "buy";
  const levels = isBuy ? book.asks : book.bids;
  const boundPrice = isBuy ? mid * (1 + slippage) : mid * (1 - slippage);
  let capacity = 0;
  for (const [price, qty] of levels) {
    if (isBuy ? price > boundPrice : price < boundPrice)
      break;
    capacity += denomination === "quote" ? qty * price : qty;
    if (capacity >= amount)
      return true;
  }
  return capacity >= amount;
}
export {
  ANSWER_TYPE,
  CADENCE_LADDER_SEC,
  CADENCE_TOLERANCE_SEC,
  CANCEL_ORDER_FOR_SELECTOR,
  CANDLE_INTERVALS,
  ContractRevertError,
  DECIMALS,
  DEFAULT_CEX_RATE_BPS,
  DEFAULT_FEES,
  DEFAULT_SLIPPAGE_BPS,
  DEFAULT_SLIPPAGE_MIN_TICKS,
  EIGHT_HOURS_SEC,
  FUNDING_PRECISION,
  HUB_MIN_FREE_BALANCE_WEI,
  IndexerError,
  InvalidInputError,
  MARGIN_STATUS,
  MARKET_TYPE_BINARY_V1,
  MARKET_TYPE_PLUGINS,
  MIN_SERIES_INTERVAL_SEC,
  NATIVE_TOKEN_SENTINEL,
  NetworkTape,
  NotConfiguredError,
  ONE_HOUR_SEC,
  ONE_YEAR_SEC,
  ORDER_KIND,
  ORDER_KIND_SIDE,
  ORDER_TYPE,
  PERP_POOL_FACTORY_MARKET_STATUS_INTERFACE_ID,
  PERP_STOP_DROP_REASON,
  PLACE_ORDER_FOR_SELECTOR2 as PLACE_ORDER_FOR_SELECTOR,
  PRICE_FEED_DECIMALS,
  PRICE_RESOLUTION_SECONDS,
  QUERY_KEY_SCOPE,
  QUESTION_SOURCE_TYPE,
  RAY,
  RpcError,
  SELF_MATCHING_OPTION,
  SOMNIA_MAINNET_ADDRESSES,
  SOMNIA_MAINNET_LEND,
  SOMNIA_TESTNET_ADDRESSES,
  SOMNIA_TESTNET_LEND,
  SOMNIA_TESTNET_PRICE_FEED,
  SignerRequiredError,
  SomniaMarkets,
  SomniaMarketsError,
  TIMEFRAMES,
  ZERO as ZERO_ADDRESS,
  accrueCompounded,
  accrueLinear,
  annualizedFundingRate,
  averageEntryPrice,
  balanceFloor,
  binaryFillsFor,
  binaryFillsFromPortfolio,
  binaryMarketTypePlugin,
  binaryModuleReadAbi,
  binaryModuleWriteAbi,
  binaryPoolWriteAbi,
  binaryResolutionMode,
  binarySettlementAbi,
  bookMidPrice,
  boundaryPrice,
  buildFundingRateSeries,
  byNewestFirst,
  cadenceBandSec,
  candlesKey,
  ceilRawAmount,
  claimableFrom,
  computeBinaryPnl,
  computePortfolioAnalytics,
  computePositionPnL,
  consoleDebugSink,
  contractErrorsAbi,
  debugCollector,
  decodeBinaryVenueFeeParams,
  decodeOutcomeId,
  decodePerpStopOrderIds,
  decodeRevert,
  densifyFundingBuckets,
  erc20VaultWriteAbi,
  erc20WriteAbi,
  erc6909Abi,
  estPayoutFor,
  estimateMarketOrder,
  fillKind,
  fillsWithinSlippage,
  floorRawBalance,
  formatIntervalLabel,
  fromHuman,
  fundingRate1h,
  fundingRate8h,
  fundingRatePerInterval,
  getMarketTypePlugin,
  intervalsPerWindow,
  isBinaryMarket,
  isFundingStale,
  isLocalPrecompileUnavailable,
  isPerpMarket,
  isSpotMarket,
  lendDebtTokenAbi,
  lendGatewayAbi,
  lendPoolAbi,
  lendRayRateToApy,
  lendUiPoolDataProviderAbi,
  listMarketTypePlugins,
  marginBankWriteAbi,
  markOutcomePosition,
  markYesPrice,
  marketActivityKey,
  marketCreatorsKey,
  marketFeesKey,
  marketIntervalLabel,
  marketKey,
  marketOnchainKey,
  marketStats24hFromCandles,
  marketsKey,
  maxVenueFeeBpsKey,
  midYesPrice,
  normalizeFundingRate,
  operatorRegistryWriteAbi,
  operatorsKey,
  oracleAdaptersKey,
  oracleHubAbi,
  oracleHubEventsAbi,
  orderBookBatchWriteAbi,
  orderBookEventsAbi,
  outcomeId,
  outcomeMarkPrice,
  perpLiquidationPrice,
  perpMarkForPnl,
  perpOrderMarginQuote,
  perpPoolWriteAbi,
  perpPositionAnalytics,
  pnlEventsFor,
  portfolioKey,
  positionMarkState,
  preflightChain,
  preflightCreateQuote,
  preflightHub,
  preflightMarketCreator,
  preflightOperator,
  preflightRoll,
  preflightSeries,
  preflightVenue,
  priceToProbability,
  probabilityToPrice,
  quoteBinaryOrderOverBook,
  quoteBinarySellOverBook,
  quoteBinaryStakeOverBook,
  rayMul,
  realizedFundingPerBase,
  resolveIntervalSec,
  sideOfKind,
  slippageForCrossing,
  snapIntervalSec,
  snapToCadence,
  spotPoolOperatorRegistryReadAbi,
  spotPoolWriteAbi,
  spotStopRegistryEventsAbi,
  spotStopRegistryWriteAbi,
  syncStatusKey,
  toHuman,
  toHumanString,
  tradeContextKey,
  transactionActivityKey,
  upPercent,
  upProbability
};
//# sourceMappingURL=@somnia-chain_markets-sdk.js.map
