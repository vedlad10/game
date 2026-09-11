// React binding for the arcade store.
//
// The store is a plain observable, so `useSyncExternalStore` is the whole
// integration — no context, no reducer, no re-render fan-out. Swapping the
// network or the wallet tears the old store down and builds a new one, which is
// what you want: a source is bound to one chain and one signer, and reusing it
// across either would leak watches.
//
// The fallback lives here. If the live source cannot start — indexer down, RPC
// blocked, a judge behind a corporate proxy — the hook mounts the demo source
// instead and surfaces a notice saying so. The arcade never shows a dead
// screen, and it never quietly pretends simulated data is chain data.

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArcadeStore } from "../lib/store.ts";
import { DemoSource } from "../lib/demoSource.ts";
import { LiveSource } from "../lib/liveSource.ts";
import type { ArcadeSource, ArcadeState } from "../lib/types.ts";
import type { NetworkConfig } from "../lib/networks.ts";
import type { WalletConnection } from "../lib/wallet.ts";
import type { Direction } from "../lib/rounds.ts";

export type ModePreference = "auto" | "demo";

export interface UseArcadeOptions {
  network: NetworkConfig;
  connection: WalletConnection | null;
  /** "auto" tries live and falls back to demo; "demo" never touches the chain. */
  preference: ModePreference;
}

export interface Arcade {
  state: ArcadeState;
  selectSeries(key: string): void;
  bet(direction: Direction, stake: number): Promise<void>;
  quote(direction: Direction, stake: number): ReturnType<ArcadeStore["quote"]>;
  faucet(): Promise<void>;
  reset(): void;
  /** True when this venue can mint play collateral. */
  canFaucet: boolean;
}

export function useArcade({ network, connection, preference }: UseArcadeOptions): Arcade {
  const [store, setStore] = useState<ArcadeStore | null>(null);
  // Bumped whenever a store is replaced, so subscribers re-read a fresh snapshot.
  const generation = useRef(0);

  useEffect(() => {
    let disposed = false;
    generation.current += 1;

    const scope = `${network.id}.${connection?.address ?? "guest"}`;

    async function mount(): Promise<void> {
      const build = (): ArcadeSource => {
        if (preference === "demo") return new DemoSource();
        return new LiveSource(network, {
          ...(connection?.privateKey ? { privateKey: connection.privateKey } : {}),
          ...(connection?.walletClient ? { walletClient: connection.walletClient } : {}),
        });
      };

      let source = build();
      let next = new ArcadeStore(source, scope);
      try {
        await next.start();
      } catch (err) {
        // Live could not come up. Swap in the simulation rather than stranding
        // the player, and say plainly why.
        next.stop();
        if (disposed) return;
        source = new DemoSource();
        next = new ArcadeStore(source, scope);
        await next.start();
        next.noticeFallback(describe(err));
        setStore(next);
        return;
      }
      if (disposed) {
        next.stop();
        return;
      }
      setStore(next);
    }

    void mount();

    return () => {
      disposed = true;
      setStore((prev) => {
        prev?.stop();
        return null;
      });
    };
  }, [network, connection, preference]);

  const subscribe = useCallback(
    (listener: () => void) => (store ? store.subscribe(listener) : () => {}),
    [store],
  );

  const booting = useMemo<ArcadeState>(() => bootingState(preference), [preference]);
  const getSnapshot = useCallback(
    () => (store ? store.getState() : booting),
    [store, booting],
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    state,
    selectSeries: useCallback((key: string) => store?.selectSeries(key), [store]),
    bet: useCallback(
      async (direction: Direction, stake: number) => {
        if (!store) throw new Error("the arcade is still connecting");
        await store.bet(direction, stake);
      },
      [store],
    ),
    quote: useCallback(
      (direction: Direction, stake: number) => store?.quote(direction, stake) ?? null,
      [store],
    ),
    faucet: useCallback(async () => {
      if (!store) return;
      await store.faucet();
    }, [store]),
    reset: useCallback(() => store?.reset(), [store]),
    canFaucet: preference === "demo" || network.hasFaucet,
  };
}

/** The snapshot rendered while a store is being built. */
function bootingState(preference: ModePreference): ArcadeState {
  return {
    mode: preference === "demo" ? "demo" : "live",
    status: "connecting",
    notice: null,
    nowSec: Math.floor(Date.now() / 1000),
    series: [],
    activeSeries: null,
    live: null,
    next: null,
    history: [],
    price: null,
    openPrice: null,
    ticks: [],
    odds: { up: null, down: null },
    bets: [],
    score: {
      xp: 0,
      streak: 0,
      bestStreak: 0,
      wins: 0,
      losses: 0,
      voids: 0,
      staked: 0,
      pnl: 0,
    },
    balance: null,
    gas: null,
    collateralSymbol: "USDC",
    account: null,
    betting: false,
  };
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
