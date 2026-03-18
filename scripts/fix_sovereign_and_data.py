"""
Fix script: corrects sovereign_flag corruption and country_of_sponsor gaps
in data/master/cat_bond_master.csv.

Run from project-root:  python scripts/fix_sovereign_and_data.py
"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pandas as pd

df = pd.read_csv('data/master/cat_bond_master.csv')
print(f'Loaded {len(df)} rows from cat_bond_master.csv')
print(f'Sovereign before fix: {df["sovereign_flag"].sum()}')

# ── 1. Fix sovereign_flag ─────────────────────────────────────────────────────
# The scraper set sovereign_flag=True for any page mentioning the word
# "government", causing 100 % of deals to be flagged. We re-derive it from
# actual sponsor / deal-name content only.

SOVEREIGN_PATTERNS = [
    'government of', 'republic of', 'ibrd', 'fonden', 'agroasemex',
    'world bank', 'ccrif', 'tcip', 'turkish catastrophe insurance',
    'caribbean catastrophe', 'african risk capacity', 'pandemic emergency',
    'pacific alliance', 'california state compensation', 'golden state re',
    'multicat mexico', 'cat-mex', 'bosphorus re', 'bosphorus 1 re',
    'puerto rico parametric',
]

def _is_sovereign(row):
    combined = (
        str(row.get('sponsor', '')).lower() + ' ' +
        str(row.get('deal_name', '')).lower()
    )
    return any(pat in combined for pat in SOVEREIGN_PATTERNS)

df['sovereign_flag'] = df.apply(_is_sovereign, axis=1)
print(f'Sovereign after fix:  {df["sovereign_flag"].sum()}')

# ── 2. Fix country_of_sponsor for sovereign deals ─────────────────────────────
SOVEREIGN_COUNTRY_MAP = {
    'fonden':                        'Mexico',
    'agroasemex':                    'Mexico',
    'government of mexico':          'Mexico',
    'multicat mexico':               'Mexico',
    'cat-mex':                       'Mexico',
    'republic of chile':             'Chile',
    'ibrd – chile':                  'Chile',
    'ibrd car 116':                  'Chile',
    'republic of colombia':          'Colombia',
    'ibrd car 117':                  'Colombia',
    'republic of peru':              'Peru',
    'ibrd car 120':                  'Peru',
    'republic of the philippines':   'Philippines',
    'ibrd car 123':                  'Philippines',
    'government of jamaica':         'Jamaica',
    'ibrd car 130':                  'Jamaica',
    'ibrd car jamaica':              'Jamaica',
    'government of puerto rico':     'Puerto Rico',
    'puerto rico parametric':        'Puerto Rico',
    'caribbean catastrophe':         'Caribbean',
    'ccrif':                         'Caribbean',
    'turkish catastrophe':           'Turkey',
    'tcip':                          'Turkey',
    'bosphorus':                     'Turkey',
    'california state compensation': 'United States',
    'golden state re':               'United States',
    'pandemic emergency':            'Multilateral',
    'world bank':                    'Multilateral',
    'african risk capacity':         'Africa',
    'pacific alliance':              'Latin America',
}

fixed_country = 0
for idx, row in df[df['sovereign_flag']].iterrows():
    sponsor = str(row.get('sponsor', '')).lower()
    deal    = str(row.get('deal_name', '')).lower()
    combined = sponsor + ' ' + deal

    current_cos = str(row.get('country_of_sponsor', ''))
    current_cor = str(row.get('country_of_risk', ''))

    for key, country in SOVEREIGN_COUNTRY_MAP.items():
        if key in combined:
            if current_cos in ('', 'nan', 'None', 'Unknown'):
                df.at[idx, 'country_of_sponsor'] = country
                fixed_country += 1
            if 'country_of_risk' in df.columns and current_cor in ('', 'nan', 'None', 'Unknown'):
                df.at[idx, 'country_of_risk'] = country
            break

print(f'Country-of-sponsor gaps filled: {fixed_country}')

# ── 3. Show final sovereign summary ──────────────────────────────────────────
sov = df[df['sovereign_flag']]
print(f'\nSovereign deals ({len(sov)}):')
print(sov[['deal_name', 'sponsor', 'country_of_sponsor']].to_string())

if 'country_of_sponsor' in df.columns:
    print('\nSovereign countries:')
    print(sov['country_of_sponsor'].value_counts().to_dict())

# ── 4. Save ───────────────────────────────────────────────────────────────────
df.to_csv('data/master/cat_bond_master.csv', index=False)
print('\nSaved data/master/cat_bond_master.csv')
