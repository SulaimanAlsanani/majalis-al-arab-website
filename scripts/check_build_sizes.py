#!/usr/bin/env python3
"""Check that the published asset bundle was optimized without changing source files."""
from pathlib import Path
import json
import sys

root = Path(__file__).resolve().parents[1]
dist = root / "dist" / "assets"
source = root / "assets"
names = [p.name for p in source.iterdir() if p.suffix in {".css", ".js"} and p.is_file()]
errors = []
rows = []
for name in sorted(names):
    src = source / name
    out = dist / name
    if not out.is_file() or out.stat().st_size == 0:
        errors.append(f"Missing or empty optimized asset: {name}")
        continue
    raw = src.stat().st_size
    optimized = out.stat().st_size
    rows.append({"asset": name, "source_bytes": raw, "production_bytes": optimized,
                 "saved_bytes": raw - optimized, "savings_percent": round(100 * (raw - optimized) / raw, 1)})
    if optimized > raw:
        errors.append(f"Optimized asset grew in size: {name} ({raw} => {optimized})")

total_raw = sum(row["source_bytes"] for row in rows)
total_out = sum(row["production_bytes"] for row in rows)
summary = {"source_bytes": total_raw, "production_bytes": total_out,
           "saved_bytes": total_raw - total_out,
           "savings_percent": round(100 * (total_raw - total_out) / total_raw, 1) if total_raw else 0,
           "assets": rows}
(root / "dist" / "asset-size-report.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
if not names or errors:
    print("\n".join(errors) if errors else "No CSS or JavaScript assets found", file=sys.stderr)
    sys.exit(1)
