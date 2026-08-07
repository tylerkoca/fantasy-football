# Fantasy Football — start/sit, rankings, waivers, draft

**Live: https://tylerkoca.github.io/fantasy-football/**

A weekly fantasy football tool. Projects points for every rostered player, fills your
optimal lineup, and works for any league's scoring rules.

This repo is the published site only — three files, generated. The pipeline that builds
it is not public.

## What's here

| Tab | What it does |
| --- | --- |
| **Start/Sit** | Fills the optimal lineup for a week, with the bench players it beat |
| **Rankings** | Every player, with a floor/ceiling and the odds of clearing given totals |
| **Waivers** | The wire ranked by *lineup gain*, not by points |
| **Season Insights** | Sportsbook season-long yardage lines, and where the model leans |
| **Draft** | ADP, value over replacement, and a snake-draft study by pick slot |
| **Roster** | Enter your team, or import it from a Sleeper or ESPN league ID |

The scoring panel is live. Change PPR, change what a passing touchdown is worth, and
every projection, ranking and lineup recomputes in the page.

## How good is it, honestly

**The projection model does not beat the market.** On like-for-like 2025 player-weeks it
scores 5.330 mean absolute error against the best market source at 5.256. It beats a
trailing-4-game baseline, and it wins outright only at tight end.

It carries **0.35 weight in the blend** because its errors are partly *uncorrelated* with
the market's — the blend scores 5.211, better than any single source. That is the entire
case for it. The weights are fitted by backtest, not asserted.

Shipped blend: `own 0.35, sleeper 0.45, espn 0.20`.

## Some things that were measured, and surprised us

- **Changing teams costs about a point a game** (WR −0.94, RB −1.06, TE −0.49 over 330
  player-seasons). The "fresh start with a better quarterback" story is backwards: a new
  QB predicts nothing, and receivers who got one *missed* their prior season by 0.96.
- **Matchup is position-specific.** QB 1.81 points of swing between the best and worst
  matchup, RB 1.21, TE 0.72, WR 0.43. And the matchup-sensitive backs are the
  *pass-catching* ones, not the bruisers.
- **Weather is a passing-game effect.** Wind costs a QB 0.089 pts/mph and a WR 0.055.
  For a running back it is +0.002 — nothing — so it is not applied to them.
- **Game environment is the largest signal in the model, and it is a QB effect.** Between
  a p10 and a p90 implied team total a quarterback swings 5.31 points. The spread
  coefficient is negative, so underdogs throw.
- **Efficiency is noise; usage is stable.** Target share has a split-half reliability of
  0.852. Yards per target is 0.185. That ~20× gap in explained variance is the single
  most important fact in the model.

## Known gaps

No injury or news signal. No play-by-play features, so no red-zone share and no target
depth. Both would need a data source the pipeline does not currently touch.

## Notes

Logos and headshots load from ESPN's and the NFL's CDNs. Team colour is always paired
with the abbreviation and never carries meaning on its own, so the page stays readable
for colour-blind users and in print.

No build step, no dependencies, no framework — `index.html` plus two script files.
