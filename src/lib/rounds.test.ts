import { describe, expect, it } from "vitest";
import {
  directionFromOutcome,
  formatCountdown,
  groupIntoSeries,
  intervalLabel,
  opposite,
  phaseOf,
  pickLiveRound,
  pickNextRound,
  pickSettledRounds,
  seriesKey,
  toRound,
  type RoundSource,
} from "./rounds.ts";

const T0 = 1_700_000_000;

function market(over: Partial<RoundSource> = {}): RoundSource {
  return {
    id: "m1",
    poolAddress: "0xpool",
    asset: "BTC",
    question: "BTC closes at or above its opening price",
    tradingStart: T0,
    expiry: T0 + 60,
    intervalSec: 60,
    status: "Trading",
    mode: "reference",
    ...over,
  };
}

describe("phaseOf", () => {
  it("is upcoming before the window opens", () => {
    expect(phaseOf(market(), T0 - 1)).toBe("upcoming");
  });

  it("is open inside the window, including the opening instant", () => {
    expect(phaseOf(market(), T0)).toBe("open");
    expect(phaseOf(market(), T0 + 59)).toBe("open");
  });

  it("closes at expiry — the last second is not tradeable", () => {
    expect(phaseOf(market(), T0 + 60)).toBe("settling");
  });

  it("reports settling past expiry while the oracle is pending", () => {
    expect(phaseOf(market(), T0 + 600)).toBe("settling");
  });

  it("lets a terminal status win over the clock", () => {
    // Resolved/Voided DO emit events, so they are trustworthy; the implicit
    // transitions are not, which is why everything else reads the clock.
    expect(phaseOf(market({ status: "Resolved" }), T0 + 1)).toBe("resolved");
    expect(phaseOf(market({ status: "Voided" }), T0 + 1)).toBe("voided");
    expect(phaseOf(market({ status: "Finalized" }), T0 + 1)).toBe("resolved");
  });

  it("does not trust a stale Listed status once trading has opened", () => {
    expect(phaseOf(market({ status: "Listed" }), T0 + 10)).toBe("open");
  });

  it("tolerates string timestamps from the indexer", () => {
    const m = market({ tradingStart: String(T0), expiry: String(T0 + 60) });
    expect(phaseOf(m, T0 + 10)).toBe("open");
  });
});

describe("toRound", () => {
  it("computes countdown and progress across the window", () => {
    const r = toRound(market(), T0 + 15);
    expect(r.secondsLeft).toBe(45);
    expect(r.progress).toBeCloseTo(0.25);
    expect(r.intervalSec).toBe(60);
  });

  it("clamps progress and countdown past expiry", () => {
    const r = toRound(market(), T0 + 500);
    expect(r.secondsLeft).toBe(0);
    expect(r.progress).toBe(1);
  });

  it("clamps progress before the open", () => {
    expect(toRound(market(), T0 - 30).progress).toBe(0);
  });

  it("surfaces the winner only once terminal", () => {
    expect(toRound(market({ winningOutcome: 0 }), T0 + 100).winner).toBeNull();
    expect(toRound(market({ status: "Resolved", winningOutcome: 0 }), T0 + 100).winner).toBe("UP");
    expect(toRound(market({ status: "Resolved", winningOutcome: 1 }), T0 + 100).winner).toBe("DOWN");
  });

  it("falls back to the window when the indexer gave no cadence", () => {
    const r = toRound(market({ intervalSec: null, expiry: T0 + 900 }), T0);
    expect(r.intervalSec).toBe(900);
  });
});

describe("pickLiveRound", () => {
  it("finds the market whose window contains now", () => {
    const past = market({ id: "past", tradingStart: T0 - 60, expiry: T0 });
    const live = market({ id: "live" });
    const future = market({ id: "future", tradingStart: T0 + 60, expiry: T0 + 120 });
    expect(pickLiveRound([past, future, live], T0 + 5)?.id).toBe("live");
  });

  it("prefers the soonest close when windows overlap", () => {
    const long = market({ id: "long", expiry: T0 + 900, intervalSec: 900 });
    const short = market({ id: "short", expiry: T0 + 60 });
    expect(pickLiveRound([long, short], T0 + 5)?.id).toBe("short");
  });

  it("returns null when nothing is open", () => {
    expect(pickLiveRound([market()], T0 + 600)).toBeNull();
    expect(pickLiveRound([], T0)).toBeNull();
  });

  it("never returns a resolved market even if its window still spans now", () => {
    expect(pickLiveRound([market({ status: "Resolved" })], T0 + 5)).toBeNull();
  });
});

describe("pickNextRound", () => {
  it("returns the soonest market still to open", () => {
    const soon = market({ id: "soon", tradingStart: T0 + 60, expiry: T0 + 120 });
    const later = market({ id: "later", tradingStart: T0 + 120, expiry: T0 + 180 });
    expect(pickNextRound([later, soon], T0)?.id).toBe("soon");
  });

  it("is null when every market has already opened", () => {
    expect(pickNextRound([market()], T0 + 5)).toBeNull();
  });
});

describe("pickSettledRounds", () => {
  it("returns closed rounds newest first", () => {
    const a = market({ id: "a", tradingStart: T0 - 180, expiry: T0 - 120, status: "Resolved" });
    const b = market({ id: "b", tradingStart: T0 - 120, expiry: T0 - 60, status: "Resolved" });
    const open = market({ id: "open" });
    const got = pickSettledRounds([a, b, open], T0 + 5);
    expect(got.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("includes settling rounds that are still awaiting the oracle", () => {
    const pending = market({ id: "pending", tradingStart: T0 - 120, expiry: T0 - 60 });
    expect(pickSettledRounds([pending], T0).map((r) => r.id)).toEqual(["pending"]);
  });

  it("honours the limit", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      market({ id: `m${i}`, tradingStart: T0 - 200 - i, expiry: T0 - 100 - i, status: "Resolved" }),
    );
    expect(pickSettledRounds(many, T0, 5)).toHaveLength(5);
  });
});

describe("series grouping", () => {
  it("keys a series by asset and cadence", () => {
    expect(seriesKey(market())).toBe("BTC:60");
    expect(seriesKey(market({ asset: "eth", intervalSec: 900 }))).toBe("ETH:900");
  });

  it("snaps jittered cadences onto one key", () => {
    // Shannon really does return 298 and 300 for the same 5m series, and
    // 3599 alongside 3600 -- a bootstrap round covers a partial window. Keying
    // on the raw value split one series into several ghost tabs.
    expect(seriesKey(market({ intervalSec: 298 }))).toBe(seriesKey(market({ intervalSec: 300 })));
    expect(seriesKey(market({ intervalSec: 3599 }))).toBe(seriesKey(market({ intervalSec: 3600 })));
    expect(seriesKey(market({ intervalSec: 899 }))).toBe(seriesKey(market({ intervalSec: 900 })));
  });

  it("leaves a genuine partial window on its own key", () => {
    // 278s is not jitter around 300 -- it is a real short window and must not
    // be swallowed into the 5m series.
    expect(seriesKey(market({ intervalSec: 278 }))).not.toBe(seriesKey(market({ intervalSec: 300 })));
  });

  it("labels a snapped cadence consistently", () => {
    // Unsnapped, 3599 rendered as "60m" next to 3600 as "1h" in the same strip.
    expect(intervalLabel(toRound(market({ intervalSec: 3599 }), T0).intervalSec)).toBe("1h");
    expect(intervalLabel(toRound(market({ intervalSec: 3600 }), T0).intervalSec)).toBe("1h");
  });

  it("groups markets and sorts the twitchiest cadence first", () => {
    const groups = groupIntoSeries([
      market({ id: "a", asset: "BTC", intervalSec: 900 }),
      market({ id: "b", asset: "BTC", intervalSec: 60 }),
      market({ id: "c", asset: "BTC", intervalSec: 60 }),
      market({ id: "d", asset: "ETH", intervalSec: 60 }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["BTC:60", "ETH:60", "BTC:900"]);
    expect(groups[0]!.markets).toHaveLength(2);
  });

  it("ranks headline assets ahead of the venue's test series", () => {
    // Shannon carries GENESIS-* test markets on odd cadences; they were
    // crowding BTC and ETH out of the visible tab strip.
    const groups = groupIntoSeries([
      market({ id: "g", asset: "GENESIS-01", intervalSec: 840 }),
      market({ id: "e", asset: "ETH", intervalSec: 900 }),
      market({ id: "b", asset: "BTC", intervalSec: 900 }),
    ]);
    expect(groups.map((g) => g.asset)).toEqual(["BTC", "ETH", "GENESIS-01"]);
  });

  it("keeps unranked assets rather than hiding them", () => {
    const groups = groupIntoSeries([market({ asset: "GENESIS-07", intervalSec: 840 })]);
    expect(groups).toHaveLength(1);
  });
});

describe("labels", () => {
  it("formats cadences compactly", () => {
    expect(intervalLabel(60)).toBe("1m");
    expect(intervalLabel(900)).toBe("15m");
    expect(intervalLabel(14_400)).toBe("4h");
    expect(intervalLabel(86_400)).toBe("1d");
    expect(intervalLabel(0)).toBe("—");
  });

  it("formats a countdown, growing to hours when needed", () => {
    expect(formatCountdown(9)).toBe("00:09");
    expect(formatCountdown(75)).toBe("01:15");
    expect(formatCountdown(3_725)).toBe("1:02:05");
    expect(formatCountdown(-5)).toBe("00:00");
  });
});

describe("fixed-strike markets", () => {
  it("carries the strike through to the round", () => {
    // Shannon runs both kinds; a fixed round's threshold is known at creation.
    const r = toRound(market({ mode: "fixed", strike: "7730531" }), T0);
    expect(r.source.mode).toBe("fixed");
    expect(r.source.strike).toBe("7730531");
  });

  it("keeps reference-mode rounds unstruck", () => {
    const r = toRound(market({ mode: "reference", strike: "0" }), T0);
    expect(Number(r.source.strike)).toBe(0);
  });
});

describe("direction helpers", () => {
  it("maps outcome indices to directions", () => {
    expect(directionFromOutcome(0)).toBe("UP");
    expect(directionFromOutcome(1)).toBe("DOWN");
    expect(directionFromOutcome(null)).toBeNull();
    expect(directionFromOutcome(undefined)).toBeNull();
  });

  it("flips a direction", () => {
    expect(opposite("UP")).toBe("DOWN");
    expect(opposite("DOWN")).toBe("UP");
  });
});
