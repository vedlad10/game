import {
  formatTransactionReceipt
} from "./chunk-556T3CNV.js";
import {
  parseAbi
} from "./chunk-35QB63S7.js";
import {
  privateKeyToAccount
} from "./chunk-TEKXKFXC.js";
import {
  __publicField
} from "./chunk-L6OFPWCY.js";

// node_modules/@somnia-chain/markets-sdk/dist/errors.js
var PREFIX = "@somnia-chain/markets-sdk: ";
var SomniaMarketsError = class extends Error {
  constructor(message, options) {
    super(message.startsWith(PREFIX) ? message : PREFIX + message, options);
    this.name = "SomniaMarketsError";
  }
};
var InvalidInputError = class extends SomniaMarketsError {
  /**
   * Creates an invalid-input error with an optional underlying cause.
   *
   * **Details**
   *
   * - `message`: What was wrong with the input.
   * - `options`: Standard `cause` passthrough.
   */
  constructor(message, options) {
    super(message, options);
    this.name = "InvalidInputError";
  }
};
var NotConfiguredError = class extends SomniaMarketsError {
  /**
   * Creates a missing-configuration error for one operation.
   *
   * **Details**
   *
   * - `what`: The config key or contract the operation needs (e.g. `"addresses.oracleHub"`).
   * - `detail`: What was being attempted, and how to supply it.
   */
  constructor(what, detail) {
    super(`${detail} — needs ${what}`);
    __publicField(this, "what");
    this.what = what;
    this.name = "NotConfiguredError";
  }
};
var SignerRequiredError = class extends SomniaMarketsError {
  /**
   * Creates a signer-required error for one authenticated operation.
   *
   * **Details**
   *
   * - `operation`: The method that needs a signer (e.g. `"createOrder"`).
   */
  constructor(operation) {
    super(`${operation} is authenticated — construct SomniaMarkets with a privateKey / account / walletClient`);
    __publicField(this, "operation");
    this.operation = operation;
    this.name = "SignerRequiredError";
  }
};
var IndexerError = class extends SomniaMarketsError {
  /**
   * Creates an indexer error with operation context and an optional cause.
   *
   * **Details**
   *
   * - `operation`: GraphQL operation name that failed (e.g. `"listBinaryMarkets"`).
   * - `detail`: Why it failed (HTTP status, GraphQL error message, "empty response").
   * - `options`: Standard `cause` passthrough — the underlying fetch/GraphQL failure.
   */
  constructor(operation, detail, options) {
    super(`indexer ${operation} failed: ${detail}`, options);
    __publicField(this, "operation");
    this.operation = operation;
    this.name = "IndexerError";
  }
};
var RpcError = class extends SomniaMarketsError {
  /**
   * Creates an RPC error with operation context and an optional cause.
   *
   * **Details**
   *
   * - `operation`: What was attempted (e.g. `"eth_sendRawTransaction"`, `"watchBook"`).
   * - `detail`: Why it failed.
   * - `options`: Standard `cause` passthrough — the underlying viem/transport error.
   */
  constructor(operation, detail, options) {
    super(`rpc ${operation} failed: ${detail}`, options);
    __publicField(this, "operation");
    this.operation = operation;
    this.name = "RpcError";
  }
};
var ContractRevertError = class extends SomniaMarketsError {
  constructor(fields, options) {
    super(revertMessage(fields), options);
    /** The decoded Solidity error name, or `undefined` when the revert didn't match a known error. */
    __publicField(this, "errorName");
    /** Decoded arguments of the custom error, positionally, when `errorName` is set. */
    __publicField(this, "args");
    /** A plain `require`/`revert` string reason, when the revert carried one instead of a custom error. */
    __publicField(this, "reason");
    /** Raw revert data as returned by the node, when present. */
    __publicField(this, "data");
    /** The contract that reverted, when known. */
    __publicField(this, "address");
    /** The function that was called, when known. */
    __publicField(this, "functionName");
    this.name = "ContractRevertError";
    this.errorName = fields.errorName;
    this.args = fields.args;
    this.reason = fields.reason;
    this.data = fields.data;
    this.address = fields.address;
    this.functionName = fields.functionName;
  }
};
function revertMessage(fields) {
  var _a;
  const where = fields.functionName ? `${fields.functionName} reverted` : "call reverted";
  if (fields.errorName !== void 0) {
    const args = ((_a = fields.args) == null ? void 0 : _a.length) ? `(${fields.args.map(formatArg).join(", ")})` : "()";
    return `${where}: ${fields.errorName}${args}`;
  }
  if (fields.reason !== void 0)
    return `${where}: ${fields.reason}`;
  if (fields.data !== void 0 && fields.data !== "0x") {
    return `${where} with unrecognized error data ${fields.data}`;
  }
  return `${where} without error data`;
}
function formatArg(arg) {
  if (typeof arg === "bigint")
    return arg.toString();
  if (typeof arg === "string")
    return arg;
  return JSON.stringify(arg) ?? String(arg);
}

// node_modules/@somnia-chain/markets-sdk/dist/tradeAbi.js
var erc20WriteAbi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
]);
var binaryPoolWriteAbi = parseAbi([
  // Settlement-extraction v2: the generic `placeOrder`/`placeOrderFor`/`amendOrder`
  // entries REVERT `UseBinaryPlacement` on a binary pool — the YES/NO order kind is
  // now an explicit param (v2 frees `userData` for opaque MM bookkeeping). `kind`
  // is the OrderKind enum (0 BUY_YES, 1 SELL_YES, 2 BUY_NO, 3 SELL_NO); `price` is
  // always the YES-side price. builderFee MUST be uint96 (selector-critical, as v1).
  // `payable` mirrors the on-chain signature (binary pools take no msg.value, but
  // the selector includes it). Returns (success, id).
  "function placeBinaryOrder(uint8 kind, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k, uint64 userData) payable returns (bool success, uint128 id)",
  "function placeBinaryOrderFor(address owner, uint8 kind, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k, uint64 userData) payable returns (bool success, uint128 id)",
  "function cancelOrder(uint128 orderId)",
  // Shrink a resting order's remaining quantity IN PLACE (keeps price-time queue priority,
  // unlike amend which re-inserts at the back). Inherited from the OrderBook base and NOT
  // gated on a binary pool — BinaryPool implements the `_onOrderReduced` -> `_refundPartial`
  // hook, so the freed collateral / outcome escrow is returned to the owner. `orderId` is the
  // uint128 OrderId; `newQuantityRemaining` must be a lotSize multiple, >= minQuantity, and
  // < the order's current remaining (reverts `ExpiredOrderMustBeCancelled` on an expired order).
  "function reduceOrder(uint128 orderId, uint256 newQuantityRemaining)",
  // Permissionless keeper drains for the resting book (inherited from the OrderBook base,
  // callable by anyone on a binary pool). Both return locked escrow to each cleaned order's
  // owner and are best-effort (skip non-expired / stale entries rather than reverting):
  //  - cancelExpiredOrders: clean an explicit list of expired orders by id.
  //  - sweepExpiredAtLevel: walk one price level from the best order, cleaning up to maxCount
  //    expired orders; returns how many it cleaned.
  "function cancelExpiredOrders(uint128[] orderIds)",
  "function sweepExpiredAtLevel(bool isBid, uint256 price, uint256 maxCount) returns (uint256 cleaned)",
  // Permissionless closing-price capture (TRAD-106, capture-generation pools only): once the
  // market's expiry passes, stores the closing book's bid/ask mid and lifts the closing-book
  // lock (post-expiry removals of orders that were alive at the close revert CloseNotCaptured
  // until the market is terminal or this has run). maxSteps is a per-side scan budget in orders
  // visited (0 = pool default 256); CaptureStepsExhausted asks for a bigger budget.
  "function captureClose(uint256 maxSteps)",
  // Builder/routing opt-in (SpotPool parity): a trader approves a builder to charge up to
  // maxFeeBpsTimes1k per order they submit with that builder code; 0 revokes.
  "function approveBuilder(address builder, uint256 maxFeeBpsTimes1k)",
  "function getBuilderApproval(address user, address builder) view returns (uint256)",
  // Effective (pool-cap-clamped) approval + the protocol-wide builder-fee ceiling —
  // for client-side pre-flight of a non-zero builderFeeBpsTimes1k before placing.
  "function getEffectiveBuilderApproval(address user, address builder) view returns (uint256)",
  "function getMaxBuilderFeeBpsTimes1k() view returns (uint256)",
  // Mint complete-pair: pool pulls `amount` collateral from caller, mints
  // `amount` YES to yesTo and `amount` NO to noTo. (Pool surface unchanged in v2.)
  "function mintSet(address yesTo, address noTo, uint256 amount)",
  // Burn complete-pair: caller surrenders `amount` YES + `amount` NO, gets
  // `amount` collateral back (credited via the pool's vault).
  "function burnSet(uint256 amount)"
  // NOTE: `redeem` is GONE from the pool in v2 — redemption moved to the
  // BinarySettlement singleton (see binarySettlementAbi in readsAbi.ts). The
  // module's `redeem(operatorId, venueId, marketId, …)` is the trader-facing
  // route (binaryModuleWriteAbi); `redeemDirect` uses the settlement directly.
]);
var spotPoolWriteAbi = parseAbi([
  "function placeOrder(bool isBid, uint64 userData, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k) payable",
  "function cancelOrder(uint128 orderId)",
  // The SINGULAR amend — same `AmendOrderRequest` tuple as the batch, different
  // revert surface, which is why it is wrapped separately rather than as a
  // one-element batch: it raises the replacement's own landing-time reason
  // (`PostOnlyWouldCross`, `SelfMatchCancelTaker`, `ImmediateOrCancelNoFill`,
  // `FillOrKillNotFillable`, `OrderAlreadyExpired`) where the batch wraps it as
  // `AmendReplacementRejected(requestIndex, reason)`. Non-payable, like the batch.
  // Tuple field order is selector-critical.
  "function amendOrder((uint128 oldOrderId, bool alwaysPlace, (bool isBid, uint64 userData, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k) newOrder) request) returns (uint128 newOrderId)"
]);
var orderBookBatchWriteAbi = parseAbi([
  "function placeOrders((bool isBid, uint64 userData, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k)[] requests) returns (bool[] successes, uint128[] ids)",
  "function cancelOrders(uint128[] orderIds) returns (bool[] cancelled)",
  "function reduceOrders((uint128 orderId, uint256 newQuantityRemaining)[] requests)",
  "function amendOrders((uint128 oldOrderId, bool alwaysPlace, (bool isBid, uint64 userData, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k) newOrder)[] requests) returns (uint128[] newOrderIds)",
  "error EmptyBatch()"
]);
var perpPoolWriteAbi = parseAbi([
  "function placeOrder(bool isBid, uint64 userData, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k)",
  "function cancelOrder(uint128 orderId)",
  "function updateFunding()",
  "function marginBank() view returns (address)"
]);
var marginBankWriteAbi = parseAbi([
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function setMaxLeverage(address perpPool, uint16 leverageX)"
]);
var erc20VaultWriteAbi = parseAbi([
  "function withdraw(address token, uint256 amount)",
  "function deposit(address token, uint256 amount)",
  "function depositNative() payable",
  "function depositNativeFor(address owner) payable"
]);
var spotVaultModeAbi = parseAbi([
  "function setManualVaultMode(bool enabled)",
  "function getManualVaultMode(address user) view returns (bool)"
]);
var spotStopRegistryWriteAbi = parseAbi([
  "function createPendingOrder(((bool isBid, address owner, uint64 userData, uint256 quantity) order, uint8 orderType, uint256 triggerPrice, uint8 triggerOperator, uint256 limitPrice, address builder, uint96 builderFeeBpsTimes1k) orderWithTrigger) payable returns (uint128)",
  "function cancelPendingOrder(uint128 orderId)",
  "function somiPaymentPerOrder() view returns (uint256)"
]);
var spotStopRegistryEventsAbi = parseAbi([
  "event PendingOrderCreated(uint128 indexed orderId, address indexed owner, bool isBid, uint256 quantity, uint256 triggerPrice, uint8 triggerOperator, uint8 orderType, address builder, uint96 builderFeeBpsTimes1k)",
  "event PendingOrderTriggered(uint128 indexed pendingOrderId, bool success, uint128 indexed spotOrderId)",
  "event PendingOrderCancelled(uint128 indexed orderId)",
  "event InertOrderCancelled(uint128 indexed orderId, address indexed owner, uint256 somiCredited)"
]);
var perpStopRegistryWriteAbi = parseAbi([
  "function createPendingOrder(((bool isBid, address owner, uint64 userData, uint256 quantity) order, uint8 orderType, uint256 triggerPrice, uint8 triggerOperator, uint256 limitPrice, address builder, uint96 builderFeeBpsTimes1k) orderWithTrigger) payable returns (uint128 pendingOrderId)",
  "function createTriggerOrder(((bool isBid, address owner, uint64 userData, uint256 quantity) order, uint8 orderType, uint256 triggerPrice, uint8 triggerOperator, uint256 limitPrice, address builder, uint96 builderFeeBpsTimes1k) orderWithTrigger, uint8 intent) payable returns (uint128 pendingOrderId)",
  "function createLinkedPendingOrders(((bool isBid, address owner, uint64 userData, uint256 quantity) order, uint8 orderType, uint256 triggerPrice, uint8 triggerOperator, uint256 limitPrice, address builder, uint96 builderFeeBpsTimes1k) gteOrder, ((bool isBid, address owner, uint64 userData, uint256 quantity) order, uint8 orderType, uint256 triggerPrice, uint8 triggerOperator, uint256 limitPrice, address builder, uint96 builderFeeBpsTimes1k) lteOrder) payable returns (uint128 gteOrderId, uint128 lteOrderId)",
  "function linkPendingOrders(uint128 orderIdA, uint128 orderIdB)",
  "function cancelPendingOrder(uint128 orderId)",
  "function cancelPendingOrders(uint128[] orderIds)",
  "function getPendingOrder(uint128 orderId) view returns (bool live, (((bool isBid, address owner, uint64 userData, uint256 quantity) order, uint8 orderType, uint256 triggerPrice, uint8 triggerOperator, uint256 limitPrice, address builder, uint96 builderFeeBpsTimes1k) orderWithTrigger, uint128 orderId, uint256 somiPaid, uint128 siblingOrderId, uint8 intent) order)",
  "function somiPaymentPerOrder() view returns (uint256)",
  // SOMI the registry owes an account. TWO paths credit it, and they have different
  // audiences:
  //   1. A cancel refunds the trigger-gas payment by direct transfer; if that transfer
  //      FAILS the registry credits the balance instead and emits SomiRefundFailed
  //      (PerpStopOrderRegistry `_cancelPendingOrder`). That is the contract-owner case
  //      — a multisig or smart account with no payable receiver.
  //   2. `_cancelInertOrders` (reached from `cancelInertOrders` / `removeSubscription`,
  //      i.e. an operator winding a registry down) credits EVERY owner UNCONDITIONALLY,
  //      with no failed transfer involved. **EOAs included.**
  // So a non-zero balance is NOT diagnostic of a contract owner: any account holding
  // stops when a registry is retired has one. Note the trigger path is the opposite —
  // `somiPaid` is consumed on every fire and never refunded.
  //
  // `claimSomi` is caller-scoped: it pays msg.sender, never an arbitrary account, and
  // reverts NothingToClaim on a zero balance. Its sibling `withdrawSomi(recipient,
  // amount)` is OWNER-only and cannot touch unclaimed balances, so it is not wrapped.
  "function claimSomi()",
  "function unclaimedSomi(address user) view returns (uint256)"
]);
var perpStopRegistryEventsAbi = parseAbi([
  "event PendingOrderCreated(uint128 indexed orderId, address indexed owner, bool isBid, uint256 quantity, uint256 triggerPrice, uint8 triggerOperator, uint8 orderType, address builder, uint96 builderFeeBpsTimes1k)",
  "event PendingOrdersLinked(uint128 indexed gteOrderId, uint128 indexed lteOrderId, address indexed owner)"
]);
var operatorAuthorizationReadAbi = parseAbi([
  "function isOperatorAuthorized(address owner, address operator, bytes4 selector) view returns (bool)"
]);
var spotPoolStopReadAbi = parseAbi([
  "function getAutoPullRequirement(address owner, bool isBid, uint256 price, uint256 quantity, uint96 builderFeeBpsTimes1k) view returns (address inputToken, uint256 requiredAmount, uint256 delta)"
]);
var spotPoolLockReadAbi = parseAbi([
  "function getOwnLockedBalance() view returns (uint256 lockedBase, uint256 lockedQuote)",
  "function getLockedTokenBreakdown() view returns ((uint256 principalLocked, uint256 lockedSurplus, uint256 leftover) base, (uint256 principalLocked, uint256 lockedSurplus, uint256 leftover) quote)",
  "function convertToQuoteAtPriceCeil(uint256 baseQuantity, uint256 priceQuote) view returns (uint256)"
]);
var operatorRegistryWriteAbi = parseAbi([
  "function setOperatorApprovalGlobal(address operator, bytes4[] selectors, bool approved)",
  "function setOperatorApprovalForPool(address pool, address operator, bytes4[] selectors, bool approved)",
  "function isGloballyApproved(address owner, address operator, bytes4 selector) view returns (bool)",
  "function isApprovedForPool(address pool, address owner, address operator, bytes4 selector) view returns (bool)"
]);
var binaryMarketReadAbi = parseAbi([
  // Settlement v3: the market stores a payout VECTOR, not a single winner —
  // `winningOutcome()` was removed and reverts on the deployed contract. Derive
  // the winning index as the argmax of this vector (gated on isResolved).
  "function payoutNumerators() view returns (uint256[])",
  "function isResolved() view returns (bool)",
  "function isVoided() view returns (bool)",
  "function pool() view returns (address)",
  "function outcomeToken() view returns (address)",
  "function yesId() view returns (uint256)",
  "function noId() view returns (uint256)"
]);
var collateralRouterWriteAbi = [
  {
    type: "function",
    name: "mintCompleteSetNative",
    stateMutability: "payable",
    inputs: [
      { name: "operatorId", type: "uint32" },
      { name: "venueId", type: "bytes32" },
      { name: "marketId", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "mintCompleteSetPermit2",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operatorId", type: "uint32" },
      { name: "venueId", type: "bytes32" },
      { name: "marketId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      {
        name: "permit",
        type: "tuple",
        components: [
          {
            name: "permitted",
            type: "tuple",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint256" }
            ]
          },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      },
      { name: "sig", type: "bytes" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "redeemNative",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operatorId", type: "uint32" },
      { name: "venueId", type: "bytes32" },
      { name: "marketId", type: "bytes32" },
      { name: "outcomeIdx", type: "uint8" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  }
];

// node_modules/@somnia-chain/markets-sdk/dist/config.js
var SOMNIA_TESTNET_PRICE_FEED = {
  url: "https://price-feed.dev.oracle.somnia.host/v1/graphql",
  quote: "USDC"
};
var DEFAULT_FEES = {
  maxFeePerGas: 60000000000n,
  maxPriorityFeePerGas: 0n
};
var DEFAULT_GAS = 10000000n;
function resolvePriceFeed(config) {
  const feed = config.priceFeed;
  if (!feed) {
    throw new NotConfiguredError("config.priceFeed = { url } — the price-feed indexer's GraphQL endpoint", "this price-feed read");
  }
  return {
    url: feed.url,
    wsUrl: feed.wsUrl ?? feed.url.replace(/^https?/i, (m) => m.length === 5 ? "wss" : "ws"),
    // Uppercased to match the feed's canonical quote casing; undefined ⇒ no filter.
    quote: feed.quote ? feed.quote.toUpperCase() : void 0
  };
}

// node_modules/@somnia-chain/markets-sdk/dist/txSend.js
function resolveSigner(config, label, opts = {}) {
  const localAccount = config.privateKey ? privateKeyToAccount(config.privateKey, opts.nonceManager ? { nonceManager: opts.nonceManager } : {}) : typeof config.account === "object" && "signTransaction" in config.account ? config.account : void 0;
  const walletClient = config.walletClient;
  if (!localAccount && !walletClient) {
    throw new SignerRequiredError(label);
  }
  const resolved = localAccount ?? config.account ?? (walletClient == null ? void 0 : walletClient.account);
  if (!resolved) {
    throw new SignerRequiredError(label);
  }
  const from = resolved;
  const fromAddress = typeof from === "string" ? from : from.address;
  return { localAccount, walletClient, from, fromAddress };
}
function isMethodUnsupported(e) {
  var _a;
  const code = (e == null ? void 0 : e.code) ?? ((_a = e == null ? void 0 : e.cause) == null ? void 0 : _a.code);
  if (code === -32601 || code === -32602)
    return true;
  const msg = ((e == null ? void 0 : e.message) ?? "").toLowerCase();
  return msg.includes("method not found") || msg.includes("not supported") || msg.includes("does not exist");
}
async function broadcastSigned(client, serialized, opts) {
  var _a, _b, _c, _d;
  const request = client.request;
  const send = (method) => opts.retryCount === void 0 ? request({ method, params: [serialized] }) : request({ method, params: [serialized] }, { retryCount: opts.retryCount });
  if (((_a = opts.isRealtimeSupported) == null ? void 0 : _a.call(opts)) ?? true) {
    try {
      const raw = await send("realtime_sendRawTransaction");
      if (raw == null)
        throw new Error(`${opts.label}: realtime_sendRawTransaction returned no receipt`);
      return formatTransactionReceipt(raw);
    } catch (e) {
      if (!isMethodUnsupported(e)) {
        (_b = opts.onRejected) == null ? void 0 : _b.call(opts);
        throw opts.decorateError ? opts.decorateError(e, "realtime_sendRawTransaction") : e;
      }
      (_c = opts.onRealtimeUnsupported) == null ? void 0 : _c.call(opts);
    }
  }
  try {
    const hash = await send("eth_sendRawTransaction");
    return await opts.waitReceipt(hash);
  } catch (e) {
    (_d = opts.onRejected) == null ? void 0 : _d.call(opts);
    throw opts.decorateError ? opts.decorateError(e, "eth_sendRawTransaction") : e;
  }
}
async function waitReceiptViaHeads(publicClient, hash) {
  const immediate = await publicClient.getTransactionReceipt({ hash }).catch(() => void 0);
  if (immediate)
    return immediate;
  return new Promise((resolve, reject) => {
    let settled = false;
    let unwatch;
    const finish = (fn) => {
      if (settled)
        return;
      settled = true;
      unwatch == null ? void 0 : unwatch();
      fn();
    };
    const check = async () => {
      const r = await publicClient.getTransactionReceipt({ hash }).catch(() => void 0);
      if (r)
        finish(() => resolve(r));
    };
    unwatch = publicClient.watchBlockNumber({
      poll: false,
      emitOnBegin: false,
      onBlockNumber: check,
      onError: (e) => finish(() => reject(e))
    });
    void check();
  });
}

export {
  SomniaMarketsError,
  InvalidInputError,
  NotConfiguredError,
  SignerRequiredError,
  IndexerError,
  RpcError,
  ContractRevertError,
  erc20WriteAbi,
  binaryPoolWriteAbi,
  spotPoolWriteAbi,
  orderBookBatchWriteAbi,
  perpPoolWriteAbi,
  marginBankWriteAbi,
  erc20VaultWriteAbi,
  spotVaultModeAbi,
  spotStopRegistryWriteAbi,
  spotStopRegistryEventsAbi,
  perpStopRegistryWriteAbi,
  perpStopRegistryEventsAbi,
  operatorAuthorizationReadAbi,
  spotPoolStopReadAbi,
  spotPoolLockReadAbi,
  operatorRegistryWriteAbi,
  binaryMarketReadAbi,
  collateralRouterWriteAbi,
  resolveSigner,
  broadcastSigned,
  waitReceiptViaHeads,
  SOMNIA_TESTNET_PRICE_FEED,
  DEFAULT_FEES,
  DEFAULT_GAS,
  resolvePriceFeed
};
//# sourceMappingURL=chunk-YALXW3ZM.js.map
