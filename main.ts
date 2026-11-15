// Capitulation sniper for make.fun "Race a BTC trading bot live for 24 hours"
// (agent-fun/bars-replay/v1, one asset: CBBTC vs USDC, $1,000 paper money).
//
// Idea, found by grading the dev window (24h of 1-minute cbBTC bars, BTC -4%):
// small-dip mean reversion and momentum bursts both lose money here after fees
// (a full round trip costs ~26-42 bps); the only durable edge is the
// capitulation V-reversal: buy a washout from the 120-bar high once the price
// starts to recover, hold for the rebound, exit at +4% / -1.5% / 125 bars.
// DIP is set at 2.5% rather than 3%: on the dev window 3% scores a little
// higher (+$55.33 vs +$40.15) but makes zero trades in the quiet first half,
// while 2.5% trades in both halves — on the unseen race window a 2.5% washout
// is materially more likely to occur at all, and a bot that never trades
// cannot pass the race guardrail (≥1 trade) however good its dev score is.
//
// v2 (round 2, 15 Nov): MAX_HOLD_BARS 120 -> 125. Dev grade-local +$52.48
// (vs +$40.15 for the submitted 120-bar version), same 3 entries, win rate
// 1.0, max drawdown 1.62%. The gain is exit timing on the two flat trades,
// not new entries — block-bootstrap is statistically tied with the baseline,
// so treat the +$12.33 as a low-risk swap, not a proven edge. See REPORT-v2.md.

import { runBars } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';

// Strategy parameters (tuned on the dev window; the plateau is wide:
// DIP 2.8-3.2%, TP 3.5-5%, TIME 90-180 all score +$34 to +$49 there).
const LOOKBACK_BARS = 120; // trailing-high window for the washout dip
const DIP_NUM = 25; // dip >= 2.5%: (hi - close) * 1000 >= hi * 25
const DIP_DEN = 1000;
const RECOV_NUM = 10005; // bounce confirm: close > min(last 5 closes) * 1.0005
const RECOV_DEN = 10000;
const TAKE_PROFIT_NUM = 104; // exit at +4% over cost basis
const TAKE_PROFIT_DEN = 100;
const STOP_LOSS_NUM = 985; // exit at -1.5% under cost basis
const STOP_LOSS_DEN = 1000;
const MAX_HOLD_BARS = 125; // exit at the latest after 125 bars held
const COOLDOWN_BARS = 15; // bars to wait after an exit before a new entry
const MAX_SLIPPAGE_BPS = 200; // bounds the fill vs the decision close

const closes: bigint[] = [];
let heldBars = 0;
let cooldown = 0;

await runBars({
  onBatch(state) {
    if (state.warmingUp) return [];
    const close = state.close(SYMBOL);
    if (close === null) return [];
    closes.push(close);

    const pos = state.positions.get(SYMBOL);
    if (pos !== undefined && pos.qty > 0n) {
      heldBars += 1;
      // Cost basis of the position (cash spent, fees included) as a price:
      // entryPrice = cost * 10^7 / qty (price_scale 5, qty_scale 8, quote 6).
      // TP: close >= entryPrice * 104/100  <=>  close * qty * 100 >= cost * 10^7 * 104
      // SL: close <= entryPrice * 985/1000 <=>  close * qty * 1000 <= cost * 10^7 * 985
      const cost = pos.cost;
      const qty = pos.qty;
      const tpHit =
        close * qty * BigInt(TAKE_PROFIT_DEN) >=
        cost * 10_000_000n * BigInt(TAKE_PROFIT_NUM);
      const slHit =
        close * qty * BigInt(STOP_LOSS_DEN) <=
        cost * 10_000_000n * BigInt(STOP_LOSS_NUM);
      if (tpHit || slHit || heldBars >= MAX_HOLD_BARS) {
        heldBars = 0;
        cooldown = COOLDOWN_BARS;
        return [{ side: 'sell', symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    if (cooldown > 0) {
      cooldown -= 1;
      return [];
    }
    if (closes.length < LOOKBACK_BARS) return [];

    // Trailing 120-bar high (current bar included).
    let hi = closes[closes.length - 1]!;
    for (let i = closes.length - LOOKBACK_BARS; i < closes.length; i += 1) {
      if (closes[i]! > hi) hi = closes[i]!;
    }
    // Dip >= 2.5% from that high.
    if ((hi - close) * BigInt(DIP_DEN) < hi * BigInt(DIP_NUM)) return [];
    // Bounce confirmation: the close recovered 5 bps above the 5-bar low.
    let lo = close;
    const start = Math.max(0, closes.length - 5);
    for (let i = start; i < closes.length; i += 1) {
      if (closes[i]! < lo) lo = closes[i]!;
    }
    if (close * BigInt(RECOV_DEN) <= lo * BigInt(RECOV_NUM)) return [];

    // Full size, capped by the weight room (100% of equity max).
    const room = state.weightRoom(SYMBOL);
    const notional = state.cash < room ? state.cash : room;
    if (notional < 1_000_000n) return []; // below the $1 minimum notional
    heldBars = 0;
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: notional, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  },
});
