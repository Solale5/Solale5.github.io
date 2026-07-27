"""
Small data pipeline: pulls the public weekly U.S. 30-Year Fixed Mortgage
Rate series from FRED (Federal Reserve Economic Data), cleans it with
pandas, computes a few summary stats, and writes a static data.json
consumed by index.html.

Source: FRED series MORTGAGE30US (public, no API key required)
https://fred.stlouisfed.org/series/MORTGAGE30US

Run: python3 fetch_and_build.py
"""
import json
import subprocess
from datetime import datetime, timezone

import pandas as pd

FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US"
YEARS_OF_HISTORY_FOR_CHART = 5


def fetch_csv(url: str) -> str:
    result = subprocess.run(
        ["curl", "-fsSL", "--max-time", "30", url],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def build():
    raw_csv = fetch_csv(FRED_CSV_URL)

    df = pd.read_csv(
        pd.io.common.StringIO(raw_csv),
        na_values=["."],
    )
    df.columns = ["date", "rate"]
    df["date"] = pd.to_datetime(df["date"])
    df = df.dropna(subset=["rate"]).sort_values("date").reset_index(drop=True)

    latest = df.iloc[-1]
    cutoff_1y = latest["date"] - pd.DateOffset(years=1)
    year_ago_row = df[df["date"] <= cutoff_1y].iloc[-1] if not df[df["date"] <= cutoff_1y].empty else None

    all_time_low = df.loc[df["rate"].idxmin()]
    all_time_high = df.loc[df["rate"].idxmax()]

    chart_cutoff = latest["date"] - pd.DateOffset(years=YEARS_OF_HISTORY_FOR_CHART)
    chart_df = df[df["date"] >= chart_cutoff]

    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "FRED series MORTGAGE30US (Freddie Mac Primary Mortgage Market Survey)",
        "source_url": "https://fred.stlouisfed.org/series/MORTGAGE30US",
        "current": {
            "date": latest["date"].strftime("%Y-%m-%d"),
            "rate": round(float(latest["rate"]), 2),
        },
        "year_ago": (
            {
                "date": year_ago_row["date"].strftime("%Y-%m-%d"),
                "rate": round(float(year_ago_row["rate"]), 2),
            }
            if year_ago_row is not None
            else None
        ),
        "all_time_low": {
            "date": all_time_low["date"].strftime("%Y-%m-%d"),
            "rate": round(float(all_time_low["rate"]), 2),
        },
        "all_time_high": {
            "date": all_time_high["date"].strftime("%Y-%m-%d"),
            "rate": round(float(all_time_high["rate"]), 2),
        },
        "series": [
            {"date": row["date"].strftime("%Y-%m-%d"), "rate": round(float(row["rate"]), 2)}
            for _, row in chart_df.iterrows()
        ],
    }

    with open("data.json", "w") as f:
        json.dump(data, f, indent=2)

    print(f"Wrote data.json: {len(data['series'])} points, latest={data['current']}")


if __name__ == "__main__":
    build()
