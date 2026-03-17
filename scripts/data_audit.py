import sys
import os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import pandas as pd
df = pd.read_csv('data/master/cat_bond_master.csv')

print("=== BASIC STATS ===")
print(f"Total deals: {len(df)}")
print(f"Cumulative issuance: ${df['deal_size_usd'].sum()/1000:.1f}B")
print(f"Year range: {df['issue_year'].min()} - {df['issue_year'].max()}")
print(f"Avg deal size: ${df['deal_size_usd'].mean():.1f}M")

print("\n=== FIELD COVERAGE ===")
for col in ['deal_size_usd','expected_loss','spread_bps','trigger_type','peril','sovereign_flag','country_of_risk']:
    if col in df.columns:
        pct = df[col].notna().mean()*100
        print(f"  {col}: {pct:.1f}%")
    else:
        print(f"  {col}: MISSING COLUMN")

print("\n=== TOP 10 SPONSORS ===")
if 'sponsor' in df.columns:
    print(df.groupby('sponsor')['deal_size_usd'].sum().sort_values(ascending=False).head(10).to_string())

print("\n=== SOVEREIGN DEALS ===")
if 'sovereign_flag' in df.columns:
    sov = df[df['sovereign_flag']==True]
    print(f"Sovereign deals: {len(sov)}")
    cols = [c for c in ['deal_name','sponsor','issue_year','deal_size_usd'] if c in df.columns]
    print(sov[cols].to_string())
else:
    print("No sovereign_flag column")

print("\n=== ANNUAL ISSUANCE 2020-2025 ===")
if 'issue_year' in df.columns:
    recent = df[df['issue_year']>=2020]
    print(recent.groupby('issue_year')['deal_size_usd'].agg(['sum','count']).to_string())

print("\n=== DATA QUALITY ===")
print(f"Deals missing size: {df['deal_size_usd'].isna().sum()}")
if 'expected_loss' in df.columns:
    print(f"Deals missing EL: {df['expected_loss'].isna().sum()}")
    print(f"Deals with EL > 20: {(df['expected_loss']>20).sum()}")
print(f"Deals with size > 2000M: {(df['deal_size_usd']>2000).sum()}")
