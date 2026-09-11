import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES, SOMNIA_TESTNET_PRICE_FEED } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
const ex = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql", chain: somniaShannon,
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_TESTNET_ADDRESSES, priceFeed: SOMNIA_TESTNET_PRICE_FEED,
});
await ex.loadMarkets();
const h = await ex.client.watchPrice("BTC");
await new Promise(r=>setTimeout(r,9000));
const ticks = ex.client.getLivePriceTicks("BTC", { limit: 240 });
console.log("tick count:", ticks.length);
const ts = ticks.map(t=>t.blockTimestamp);
const ps = ticks.map(t=>t.price);
console.log("blockTimestamp min:", Math.min(...ts), new Date(Math.min(...ts)*1000).toISOString());
console.log("blockTimestamp max:", Math.max(...ts), new Date(Math.max(...ts)*1000).toISOString());
console.log("span seconds:", Math.max(...ts)-Math.min(...ts));
console.log("price min/max:", Math.min(...ps), Math.max(...ps));
console.log("\nfirst 3:", ticks.slice(0,3).map(t=>({t:t.blockTimestamp,p:t.price})));
console.log("last 3 :", ticks.slice(-3).map(t=>({t:t.blockTimestamp,p:t.price})));
// Are they ordered?
let desc=0, asc=0;
for(let i=1;i<ts.length;i++){ if(ts[i]<ts[i-1]) desc++; if(ts[i]>ts[i-1]) asc++; }
console.log("\nordering: ascending steps=",asc," descending steps=",desc);
h.stop(); await ex.close();
