"""Optional build-time preview generator. Runtime ships the generated PNG.
Requires matplotlib. Reads the preserved Financial Charts export, not new data.
"""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parents[1]
rows = json.loads((root / 'finance/dist/client/data/chart.json').read_text())['table']['rows']
values = [Decimal(str(row['value'])) / Decimal('1000000000') for row in rows]
fig, ax = plt.subplots(figsize=(12, 6.3), dpi=100)
fig.patch.set_facecolor('#F1F6F3')
ax.set_facecolor('#F1F6F3')
bars = ax.bar(range(4), [float(v) for v in values], width=.56, color=['#639C89']*3+['#12624E'], zorder=3)
ax.set_ylim(0, 90)
ax.set_yticks([0, 20, 40, 60, 80])
ax.set_yticklabels(['0', '20', '40', '60', '80'], fontsize=15, color='#5D6F66')
ax.set_xticks(range(4))
ax.set_xticklabels(['Q1', 'Q2', 'Q3', 'Q4'], fontsize=22, color='#183B2F')
ax.tick_params(axis='both', length=0, pad=10)
ax.grid(axis='y', color='#DCE7E0', zorder=0)
for spine in ax.spines.values():
    spine.set_visible(False)
for bar, value in zip(bars, values):
    label = str(value.quantize(Decimal('.01'), rounding=ROUND_HALF_UP))
    ax.text(bar.get_x()+bar.get_width()/2, float(value)+2.4, label, ha='center', fontsize=24, fontweight='bold', color='#183B2F')
fig.text(.085, .93, 'MICROSOFT  /  FY2025', fontsize=20, weight='bold', color='#183B2F')
fig.text(.085, .875, 'Quarterly revenue · USD billions', fontsize=17, color='#5D6F66')
fig.text(.085, .045, 'Fiscal · All quarters restated · Q4 calculated', fontsize=14, color='#5D6F66')
fig.subplots_adjust(left=.085, right=.965, top=.79, bottom=.16)
fig.savefig(root / 'public/revenue-preview.png', dpi=100)
plt.close(fig)
