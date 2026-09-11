import {
  DEFAULT_FEES,
  DEFAULT_GAS,
  broadcastSigned,
  erc20WriteAbi
} from "./chunk-YALXW3ZM.js";
import {
  defineChain
} from "./chunk-556T3CNV.js";
import {
  encodeFunctionData,
  parseAbi
} from "./chunk-35QB63S7.js";
import "./chunk-TEKXKFXC.js";
import "./chunk-V4HZ2GWO.js";
import {
  isAddress,
  numberToHex,
  pad
} from "./chunk-RTKA4PG2.js";
import "./chunk-S5SRPMHC.js";
import "./chunk-ENL6RYZW.js";
import "./chunk-L6OFPWCY.js";

// node_modules/@somnia-chain/markets-sdk/dist/chains/bridge/abi.js
var warpRouterAbi = parseAbi([
  "function transferRemote(uint32 destination, bytes32 recipient, uint256 amount) payable returns (bytes32 messageId)",
  // Interchain gas quote for a destination. This lane has NO InterchainGasPaymaster
  // and its Mailbox `requiredHook` is a protocol-fee hook quoting 0, so today this
  // returns 0 on every router — the relayer absorbs delivery gas. Read it anyway
  // rather than assuming: the hook's owner could price it later.
  "function quoteGasPayment(uint32 destinationDomain) view returns (uint256)",
  // The enrolled counterpart router for a domain, left-padded to bytes32. Reverts
  // `No router enrolled for domain: <n>` when the lane doesn't exist — which is
  // also what `transferRemote` does for an unenrolled destination.
  "function routers(uint32 domain) view returns (bytes32)",
  // Gas the router asks the destination to provision for delivery (44k native,
  // 64k–68k collateral/synthetic on this lane). Informational for callers.
  "function destinationGas(uint32 domain) view returns (uint256)",
  // The escrowed ERC-20 on a collateral router. NOTE: a NATIVE router answers with
  // the zero address rather than reverting — never treat the result as an ERC-20
  // without checking. Use the registry's `model` instead of probing.
  "function token() view returns (address)",
  "function owner() view returns (address)",
  "function mailbox() view returns (address)",
  "function interchainSecurityModule() view returns (address)"
]);

// node_modules/@somnia-chain/markets-sdk/dist/chains/bridge/types.js
var BridgeToken = {
  /** Native gas coin of every Somnia network. Native on BOTH sides of its route. */
  STT: "STT",
  /** Somnia USD test stable, 18 decimals. */
  USDso: "USDso",
  /** Wrapped Bitcoin — **8 decimals**, on the canonical token AND the synthetic. */
  WBTC: "WBTC",
  /** Wrapped ETH, 18 decimals. */
  WETH: "WETH",
  /** Hyperlane Bridge Test Token — a throwaway used to verify the lane. */
  HBTT: "HBTT"
};

// node_modules/@somnia-chain/markets-sdk/dist/chains/definitions/hidekiTestnet.js
var hidekiTestnet = defineChain({
  id: 50383,
  name: "Hideki Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  blockTime: 10,
  rpcUrls: {
    default: {
      http: ["https://api.hideki.infra.testnet.somnia.network"],
      webSocket: ["wss://api.hideki.infra.testnet.somnia.network/ws"]
    }
  },
  contracts: {
    multicall3: {
      address: "0x540B091b608f54E603c5dC19F6b2d955e1d2D131",
      blockCreated: 265712387
    }
  },
  testnet: true
});

// node_modules/@somnia-chain/markets-sdk/dist/chains/definitions/somniaElwood.js
var somniaElwood = defineChain({
  id: 50313,
  name: "Somnia Elwood Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  blockTime: 100,
  rpcUrls: {
    default: {
      http: ["https://api.elwood.infra.testnet.somnia.network"],
      webSocket: ["wss://api.elwood.infra.testnet.somnia.network/ws"]
    }
  },
  testnet: true
});

// node_modules/@somnia-chain/markets-sdk/dist/chains/definitions/somniaLocal.js
var somniaLocal = defineChain({
  id: 31337,
  name: "Somnia Local",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"]
    }
  },
  testnet: true
});

// node_modules/@somnia-chain/markets-sdk/dist/chains/definitions/somniaMainnet.js
var somniaMainnet = defineChain({
  id: 5031,
  name: "Somnia",
  nativeCurrency: { name: "Somnia", symbol: "SOMI", decimals: 18 },
  blockTime: 100,
  rpcUrls: {
    default: {
      http: ["https://api.infra.mainnet.somnia.network"],
      webSocket: ["wss://api.infra.mainnet.somnia.network/ws"]
    }
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: "https://explorer.somnia.network",
      apiUrl: "https://explorer.somnia.network/api"
    }
  },
  contracts: {
    multicall3: {
      address: "0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11",
      blockCreated: 38516341
    }
  },
  testnet: false
});

// node_modules/@somnia-chain/markets-sdk/dist/chains/definitions/somniaShannon.js
var somniaShannon = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  blockTime: 100,
  rpcUrls: {
    default: {
      http: ["https://api.infra.testnet.somnia.network", "https://dream-rpc.somnia.network"],
      webSocket: ["wss://api.infra.testnet.somnia.network/ws", "wss://dream-rpc.somnia.network/ws"]
    }
  },
  blockExplorers: {
    default: {
      name: "Somnia Testnet Explorer",
      url: "https://shannon-explorer.somnia.network",
      apiUrl: "https://shannon-explorer.somnia.network/api"
    }
  },
  contracts: {
    multicall3: {
      address: "0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223",
      blockCreated: 71314235
    }
  },
  testnet: true
});

// node_modules/@somnia-chain/markets-sdk/dist/chains/chainId.js
var ChainId = {
  /** Somnia mainnet (`5031`). Not bridged yet. */
  somniaMainnet: somniaMainnet.id,
  /** Somnia Testnet — Shannon (`50312`), the general-purpose testnet. Bridged. */
  somniaShannon: somniaShannon.id,
  /** Somnia Testnet — Elwood (`50313`), the testnet regenesis. Not bridged yet. */
  somniaElwood: somniaElwood.id,
  /** Hideki Testnet (`50383`) — the low-latency Tokyo network. Bridged. */
  hidekiTestnet: hidekiTestnet.id,
  /** The local anvil stack (`31337`). Never bridged. */
  somniaLocal: somniaLocal.id
};

// node_modules/@somnia-chain/markets-sdk/dist/chains/bridge/registry.js
var HYPERLANE_NAME = {
  [ChainId.somniaShannon]: "somniatestnet",
  [ChainId.hidekiTestnet]: "hidekitestnet"
};
var BRIDGE_TOKENS = [
  // ---- STT: native on BOTH sides. No wrapped token anywhere; delivery pays out of
  // the destination router's own balance, so each side needs seeded liquidity.
  {
    token: BridgeToken.STT,
    chainId: ChainId.somniaShannon,
    network: HYPERLANE_NAME[ChainId.somniaShannon],
    model: "native",
    router: "0xB04373932bc05347757da6b8a226d7657584aB35",
    address: null,
    decimals: 18,
    name: "Somnia Test Token",
    destinations: [ChainId.hidekiTestnet],
    requiresDestinationLiquidity: true
  },
  {
    token: BridgeToken.STT,
    chainId: ChainId.hidekiTestnet,
    network: HYPERLANE_NAME[ChainId.hidekiTestnet],
    model: "native",
    router: "0xB04373932bc05347757da6b8a226d7657584aB35",
    address: null,
    decimals: 18,
    name: "Somnia Test Token",
    destinations: [ChainId.somniaShannon],
    requiresDestinationLiquidity: true
  },
  // ---- USDso: collateral on Shannon (its home), synthetic on Hideki.
  {
    token: BridgeToken.USDso,
    chainId: ChainId.somniaShannon,
    network: HYPERLANE_NAME[ChainId.somniaShannon],
    model: "collateral",
    router: "0x7BDe621181e9889D6824b2CF789856b58b79c29D",
    address: "0x9c32F3827A1a99f0cf9B213de8b53eC3d57bb171",
    decimals: 18,
    name: "USDso",
    destinations: [ChainId.hidekiTestnet],
    requiresDestinationLiquidity: false
  },
  {
    token: BridgeToken.USDso,
    chainId: ChainId.hidekiTestnet,
    network: HYPERLANE_NAME[ChainId.hidekiTestnet],
    model: "synthetic",
    router: "0xed7993A74dAe1e6656B704A424DcD8711aAf4F72",
    // A HypERC20 synthetic IS its own ERC-20 — the router address is the token.
    address: "0xed7993A74dAe1e6656B704A424DcD8711aAf4F72",
    decimals: 18,
    name: "USDso",
    destinations: [ChainId.somniaShannon],
    requiresDestinationLiquidity: false
  },
  // ---- WBTC: 8 decimals on BOTH sides — the synthetic inherited them correctly.
  {
    token: BridgeToken.WBTC,
    chainId: ChainId.somniaShannon,
    network: HYPERLANE_NAME[ChainId.somniaShannon],
    model: "collateral",
    router: "0x04CaeE4642Ed7dA2C94AcF83751004e3FdE97a58",
    address: "0x4e85DC48a70DA1298489d5B6FC2492767d98f384",
    decimals: 8,
    name: "Wrapped Bitcoin",
    destinations: [ChainId.hidekiTestnet],
    requiresDestinationLiquidity: false
  },
  {
    token: BridgeToken.WBTC,
    chainId: ChainId.hidekiTestnet,
    network: HYPERLANE_NAME[ChainId.hidekiTestnet],
    model: "synthetic",
    router: "0xE97673c634EF069Ecc0d95425Cc8e62F99D27E0E",
    address: "0xE97673c634EF069Ecc0d95425Cc8e62F99D27E0E",
    decimals: 8,
    name: "Wrapped Bitcoin",
    destinations: [ChainId.somniaShannon],
    requiresDestinationLiquidity: false
  },
  // ---- WETH
  {
    token: BridgeToken.WETH,
    chainId: ChainId.somniaShannon,
    network: HYPERLANE_NAME[ChainId.somniaShannon],
    model: "collateral",
    router: "0x7b0353C5BAE642194271eE14e5Ee9e7BA10D24F9",
    address: "0x4d8E02BBfCf205828A8352Af4376b165E123D7b0",
    decimals: 18,
    name: "Wrapped ETH",
    destinations: [ChainId.hidekiTestnet],
    requiresDestinationLiquidity: false
  },
  {
    token: BridgeToken.WETH,
    chainId: ChainId.hidekiTestnet,
    network: HYPERLANE_NAME[ChainId.hidekiTestnet],
    model: "synthetic",
    router: "0x56115cB05652Ac6117Caa1152B630986a51d36b5",
    address: "0x56115cB05652Ac6117Caa1152B630986a51d36b5",
    decimals: 18,
    name: "Wrapped ETH",
    destinations: [ChainId.somniaShannon],
    requiresDestinationLiquidity: false
  },
  // ---- HBTT: the throwaway token the lane was verified with.
  {
    token: BridgeToken.HBTT,
    chainId: ChainId.somniaShannon,
    network: HYPERLANE_NAME[ChainId.somniaShannon],
    model: "collateral",
    router: "0x0528dD3beEf917DB06A5249C9Ea84b9D702B3A84",
    address: "0xE4bd7cC81ea8748a5A9f6FF803670c423C269469",
    decimals: 18,
    name: "Hyperlane Bridge Test Token",
    destinations: [ChainId.hidekiTestnet],
    requiresDestinationLiquidity: false
  },
  {
    token: BridgeToken.HBTT,
    chainId: ChainId.hidekiTestnet,
    network: HYPERLANE_NAME[ChainId.hidekiTestnet],
    model: "synthetic",
    router: "0x0528dD3beEf917DB06A5249C9Ea84b9D702B3A84",
    address: "0x0528dD3beEf917DB06A5249C9Ea84b9D702B3A84",
    decimals: 18,
    name: "Hyperlane Bridge Test Token",
    destinations: [ChainId.somniaShannon],
    requiresDestinationLiquidity: false
  }
];
var BRIDGE_NETWORKS = [
  {
    chainId: ChainId.somniaShannon,
    domainId: ChainId.somniaShannon,
    network: HYPERLANE_NAME[ChainId.somniaShannon],
    displayName: "Somnia Testnet",
    mailbox: "0x46bA2807Dbada25372176381557b55eF1F22e0A9",
    interchainSecurityModule: "0xa831F40fd0ABd1a6E8C4b447Ab9Eb65B6f0B1B6c",
    merkleTreeHook: "0xD7C2E95c62De3c0ad95b2C1cf08E4B85DF6b332D",
    validatorAnnounce: "0xB0834b2da92b646548515ACb87Da2E9BdbcaF44e",
    interchainAccountRouter: "0x1384Ed70b0f9E9Ab6d058d8c4361F073910722eF",
    proxyAdmin: "0x735653D27Cd6328189eD1B62C2b3a7201A1eD775",
    interchainGasPaymaster: null,
    tokens: [BridgeToken.STT, BridgeToken.USDso, BridgeToken.WBTC, BridgeToken.WETH, BridgeToken.HBTT]
  },
  {
    chainId: ChainId.hidekiTestnet,
    domainId: ChainId.hidekiTestnet,
    network: HYPERLANE_NAME[ChainId.hidekiTestnet],
    displayName: "Hideki Testnet",
    mailbox: "0xD7C2E95c62De3c0ad95b2C1cf08E4B85DF6b332D",
    interchainSecurityModule: "0x852616e634169da77d9390e2dcd5E95227B163a3",
    merkleTreeHook: "0xBBCc0912b06AaA84516Cd9Bcc199fe2fD5140e9e",
    validatorAnnounce: "0xc1a30607Be1793A42a0E6dFb8e709e82b351422D",
    interchainAccountRouter: "0x4fB05c3AbB116EfC10579360458D5902fc43DF06",
    proxyAdmin: "0x46bA2807Dbada25372176381557b55eF1F22e0A9",
    interchainGasPaymaster: null,
    tokens: [BridgeToken.STT, BridgeToken.USDso, BridgeToken.WBTC, BridgeToken.WETH, BridgeToken.HBTT]
  }
];
var LANE = `${HYPERLANE_NAME[ChainId.somniaShannon]}-${HYPERLANE_NAME[ChainId.hidekiTestnet]}`;
var ROUTES = [BridgeToken.STT, BridgeToken.USDso, BridgeToken.WBTC, BridgeToken.WETH, BridgeToken.HBTT].map((token) => ({
  id: `${token}/${LANE}`,
  token,
  chainIds: [ChainId.somniaShannon, ChainId.hidekiTestnet]
}));
var SOMNIA_BRIDGE = {
  id: LANE,
  displayName: "Somnia Testnet ↔ Hideki Testnet",
  chainIds: [ChainId.somniaShannon, ChainId.hidekiTestnet],
  tokens: [BridgeToken.STT, BridgeToken.USDso, BridgeToken.WBTC, BridgeToken.WETH, BridgeToken.HBTT],
  routes: [...ROUTES],
  status: "dev-test",
  security: { validators: ["0x528374d9AD571766a8a380002b0aceFE535DC2b1"], threshold: 1 },
  relayerPaysDestinationGas: true,
  docs: "https://github.com/somnia-chain/hyperlane-bridge-infra/blob/main/docs/deployments/somnia-testnet-hideki-testnet.md"
};
function getBridgeToken(token, chainId) {
  return BRIDGE_TOKENS.find((t) => t.token === token && t.chainId === chainId) ?? null;
}
function listBridgeTokens(chainId) {
  return BRIDGE_TOKENS.filter((t) => chainId === void 0 || t.chainId === chainId);
}
function getBridgeNetwork(chainId) {
  return BRIDGE_NETWORKS.find((n) => n.chainId === chainId) ?? null;
}
function listBridgeNetworks() {
  return [...BRIDGE_NETWORKS];
}
function isBridgeNetwork(chainId) {
  return BRIDGE_NETWORKS.some((n) => n.chainId === chainId);
}
function getBridgeRoute(token, chainIdA, chainIdB) {
  return SOMNIA_BRIDGE.routes.find((r) => r.token === token && r.chainIds.includes(chainIdA) && r.chainIds.includes(chainIdB) && chainIdA !== chainIdB) ?? null;
}
function getBridgeRouter(token, chainId) {
  var _a;
  return ((_a = getBridgeToken(token, chainId)) == null ? void 0 : _a.router) ?? null;
}

// node_modules/@somnia-chain/markets-sdk/dist/chains/bridge/transfer.js
var ERR = "@somnia-chain/markets-sdk/chains";
function createBridgeTransfer(params) {
  const { token, from, to, amount, recipient, gasPayment = 0n, approveAmount } = params;
  if (amount <= 0n) {
    throw new Error(`${ERR}: bridge amount must be positive (got ${amount})`);
  }
  if (gasPayment < 0n) {
    throw new Error(`${ERR}: gasPayment cannot be negative (got ${gasPayment})`);
  }
  if (!isAddress(recipient, { strict: false })) {
    throw new Error(`${ERR}: bridge recipient must be an address (got ${String(recipient)})`);
  }
  if (from === to) {
    throw new Error(`${ERR}: bridge origin and destination are the same chain (${from}) — nothing to bridge`);
  }
  const origin = requireSide(token, from, "from");
  const destination = requireSide(token, to, "to");
  if (!getBridgeRoute(token, from, to)) {
    throw new Error(`${ERR}: no ${token} route between chains ${from} and ${to} — bridging is not transitive, both chains must be on the token's route. ${token} connects: ${origin.destinations.join(", ")}`);
  }
  const bridgeStep = {
    chainId: from,
    to: origin.router,
    data: encodeFunctionData({
      abi: warpRouterAbi,
      functionName: "transferRemote",
      // The destination DOMAIN id, which equals the chain id on this bridge.
      args: [destination.chainId, addressToBytes32(recipient), amount]
    }),
    // A native route moves value by attaching it; the others move a token balance.
    value: (origin.model === "native" ? amount : 0n) + gasPayment,
    description: `Bridge ${token} from chain ${from} to chain ${to}`
  };
  const approveStep = buildApproval(origin, approveAmount ?? amount, token);
  return { origin, destination, amount, recipient, ...approveStep ? { approveStep } : {}, bridgeStep };
}
function toEip1193Transaction(step, options = {}) {
  return {
    ...options.from !== void 0 ? { from: options.from } : {},
    to: step.to,
    data: step.data,
    value: numberToHex(step.value)
  };
}
function addressToBytes32(address) {
  return pad(address.toLowerCase(), { size: 32 });
}
function buildApproval(origin, amount, token) {
  if (origin.model !== "collateral" || amount === 0n)
    return void 0;
  if (!origin.address)
    return void 0;
  return {
    chainId: origin.chainId,
    to: origin.address,
    data: encodeFunctionData({
      abi: erc20WriteAbi,
      functionName: "approve",
      args: [origin.router, amount]
    }),
    value: 0n,
    description: `Approve ${token} for the bridge router`
  };
}
function requireSide(token, chainId, side) {
  const details = getBridgeToken(token, chainId);
  if (details)
    return details;
  const supported = listBridgeTokens().filter((t) => t.token === token).map((t) => t.chainId);
  const where = supported.length ? `${token} is bridged on: ${supported.join(", ")}` : `${token} has no live route`;
  throw new Error(`${ERR}: cannot bridge ${side} chain ${chainId} — ${where}`);
}

// node_modules/@somnia-chain/markets-sdk/dist/chains/bridge/send.js
var ERR2 = "@somnia-chain/markets-sdk/chains";
async function sendBridgeStep(client, step, options) {
  const { account, gas = DEFAULT_GAS, maxFeePerGas = DEFAULT_FEES.maxFeePerGas, maxPriorityFeePerGas = DEFAULT_FEES.maxPriorityFeePerGas } = options;
  if (client.chain && client.chain.id !== step.chainId) {
    throw new Error(`${ERR2}: "${step.description}" belongs on chain ${step.chainId}, but the client is on ${client.chain.id}`);
  }
  const nonce = await client.getTransactionCount({ address: account.address, blockTag: "pending" });
  const serialized = await account.signTransaction({
    type: "eip1559",
    chainId: step.chainId,
    to: step.to,
    data: step.data,
    value: step.value,
    gas,
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas
  });
  const receipt = await broadcastSigned(client, serialized, {
    label: ERR2,
    retryCount: 0,
    waitReceipt: (hash) => client.waitForTransactionReceipt({ hash })
  });
  if (receipt.status !== "success") {
    throw new Error(`${ERR2}: "${step.description}" reverted (tx ${receipt.transactionHash})`);
  }
  return receipt;
}

// node_modules/@somnia-chain/markets-sdk/dist/chains/index.js
var somniaChains = {
  [somniaMainnet.id]: somniaMainnet,
  [somniaShannon.id]: somniaShannon,
  [somniaElwood.id]: somniaElwood,
  [hidekiTestnet.id]: hidekiTestnet,
  [somniaLocal.id]: somniaLocal
};
function getSomniaChain(chainId) {
  return somniaChains[chainId] ?? null;
}
function isSomniaChainId(chainId) {
  return chainId in somniaChains;
}
export {
  BridgeToken,
  ChainId,
  SOMNIA_BRIDGE,
  createBridgeTransfer,
  defineChain,
  getBridgeNetwork,
  getBridgeRoute,
  getBridgeRouter,
  getBridgeToken,
  getSomniaChain,
  hidekiTestnet,
  isBridgeNetwork,
  isSomniaChainId,
  listBridgeNetworks,
  listBridgeTokens,
  sendBridgeStep,
  somniaChains,
  somniaElwood,
  somniaLocal,
  somniaMainnet,
  somniaShannon,
  toEip1193Transaction,
  warpRouterAbi
};
//# sourceMappingURL=@somnia-chain_markets-sdk_chains.js.map
