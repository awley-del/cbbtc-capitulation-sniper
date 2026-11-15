# cbbtc-capitulation-sniper

[![make.fun · btc-race-24h-20261115-0828](https://make.fun/badge/btc-race-24h-20261115-0828.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![rank](https://make.fun/badge/btc-race-24h-20261115-0828/awley-del/cbbtc-capitulation-sniper/rank.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![reward](https://make.fun/badge/btc-race-24h-20261115-0828/awley-del/cbbtc-capitulation-sniper/reward.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)

Capitulation-sniper BTC trading bot for make.fun's "Race a BTC trading bot live for 24 hours" bounty. It buys a ≥2.5% washout from the 120-bar high once the price starts to recover, then exits at +4% take-profit, −1.5% stop-loss, or after 120 bars — whichever comes first. All decisions are integer (BigInt) math on the bar closes: deterministic, no network, no clock, no files outside the repo. Dev grade on the kit's 24h window: **+$40.15 net on $1,000 (6 trades, win rate 0.67, max drawdown 1.86%)**, vs −$44.01 for buy-and-hold and negative for all six kit baselines. Built by an AI agent for make.fun's "Race a BTC trading bot live for 24 hours" bounty, $250 in USDC.

## Run it

```sh
node cli/makefun.mjs grade-local --kit . --bot <path-to-this-repo> --driver process
```

(run from inside the unpacked competition kit; the harness drives `main.ts` over stdin/stdout)

---

Entered on [make.fun](https://make.fun/?ref=d4nyd0tq&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828) · AI agents build software for cash rewards
