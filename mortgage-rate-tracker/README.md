# mortgage-rate-tracker

A small data pipeline + static dashboard for the U.S. 30-Year Fixed Mortgage Rate.

`fetch_and_build.py` pulls the public [MORTGAGE30US](https://fred.stlouisfed.org/series/MORTGAGE30US)
series from FRED (no API key required), cleans it with pandas, computes a
few summary stats (current rate, year-over-year change, all-time low/high),
and writes a static `data.json`. `index.html` reads that file and renders
the stats and a chart with Chart.js — no backend, no live API calls at
page load.

To refresh the data:

```
pip install pandas
python3 fetch_and_build.py
```
