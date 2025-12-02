# Kamigotchi World Mechanics - Complete Formula Reference

## 1. LEVELING

### Experience Required per Level
```
ExperienceNeeded[i] = ExperienceNeeded[i-1] + 0.44 × ExperienceAdded[i-1]
```
- Base starting experience: 40
- Polynomial growth (similar to OSRS)
- Level 1→38 requires same XP as Level 38→41

---

## 2. HARVESTING

### 2.1 Affinity Bonus

**Base Calculation:**
```python
affinityBonus = 1

# Body Calculations
if body.type == Normal:
    affinityBonus += 0
if body.typeMatching == True and body.type != Normal:
    affinityBonus += 0.65 + fertilityBoost
if body.typeMatching == False and body.type != Normal:
    affinityBonus -= 0.25

# Hand Calculations
if hand.type == Normal:
    affinityBonus += 0
if hand.typeMatching == True and hand.type != Normal:
    affinityBonus += 0.35 + fertilityBoost
if hand.typeMatching == False and hand.type != Normal:
    affinityBonus -= 0.10
```

**Key Points:**
- Body affinity has 2.6x higher effect than hands
- Fertility boost has NO effect on Normal parts or non-matching types
- For [Eerie/Eerie] matching: `AffinityBonus = (1 + 0.65 + 0.35) + (2 × FertilityBoost) = 2 + 2×FertilityBoost`
- For [Eerie/Insect] optimal: `AffinityBonus = (1 + 0.65 - 0.1) + FertilityBoost = 1.55 + FertilityBoost`

### 2.2 Harvest Fertility
```
HarvestFertility = AffinityBonus × 1.5 × Power
```

**Example:** [Eerie/Eerie] with 30% fertility boost and 26 Power:
- AffinityBonus = 2.6
- HarvestFertility = 2.6 × 1.5 × 26 = 101.4

### 2.3 Intensity
```
IntensitySpot = ((10 + IntensityBoost) / 480) × ((5 × Violence) + TimeHarvesting)
```
- TimeHarvesting is measured in minutes
- Base intensity multiplier is 10

**Examples with 10 Violence, 0 Intensity Boost:**
- At start (t=0): `Intensity[0] = (10/480) × (50 + 0) = 1.0417`
- After 1 hour (t=60): `Intensity[60] = (10/480) × (50 + 60) = 2.2917`

### 2.4 Harvest Bounty (Total MUSU)
```
MUSUBounty = (1 + BountyBoost) × (HarvestFertility + HarvestIntensity)
```

**Example:** 16% bounty boost, 101.4 fertility, 1.0417 intensity:
- MUSUBounty = 1.16 × (101.4 + 1.0417) = 118.92 MUSU/hr

### 2.5 Strain (HP Loss)
```
Strain = (6.5 × (1 - StrainDecrease) × MUSUGained) / (Harmony + 20)
```

**Example:** 114.31 MUSU/hr, 12 harmony, -12.5% strain:
- Strain = (6.5 × 0.875 × 114.31) / 32 = 23.44 HP/hr

**Key Insight:** Harmony has diminishing returns on strain reduction

### 2.6 Recovery
```
Recovery = 1.2 × Harmony × (1 + MetabolismBoost)
```

**Optimization Tip:** Metabolism boost becomes better than harmony when harmony > 25-30

---

## 3. LIQUIDATIONS

### 3.1 Liquidation Threshold

**Animosity Ratio:**
```python
baseAnimosity = 1
if advantage == True:
    animosityRatio = baseAnimosity + 0.5
if advantage == True & type == Normal:
    animosityRatio = baseAnimosity + 0.2
if advantage == False:
    animosityRatio = baseAnimosity - 0.5

thresholdRatio = animosityRatio + ratioBoost - ratioDecrease
thresholdShift = thresholdIncrease - thresholdDecrease
```

**Final Threshold Formula:**
```
liquidationThreshold = (NormCdf(ln(predatorViolence/victimHarmony)) × 40 × thresholdRatio) + thresholdShift
```

Where NormCdf = Cumulative Distribution Function for normal distribution (mean=0, std=1)

**Example 1:** Insect hands vs Eerie body, 30 violence vs 15 harmony, +25% ratio shift, +10% threshold shift:
```
liquidationThreshold = (NormCdf(ln(30/15)) × 40 × 1.75) + 10
                     = (NormCdf(0.693) × 70) + 10
                     = 62.9% HP threshold
```

**Example 2:** Insect hands vs Scrap body (disadvantage), 30 violence vs 10 harmony:
```
liquidationThreshold = (NormCdf(ln(30/10)) × 40 × 0.5) + 0
                     = (NormCdf(1.099) × 20)
                     = 17.28% HP threshold
```

**Example 3:** Normal matchup, 30 violence vs 20 harmony:
```
liquidationThreshold = (NormCdf(ln(30/20)) × 40 × 1) + 10
                     = (NormCdf(0.405) × 40) + 10
                     = 36.3% HP threshold
```

**Important:** Threshold ratio shift does NOT apply for non-affinity matchups (recent balance patch)

**Key Insight:** Threshold shift ALWAYS outperforms ratio shift for defenders, especially at higher harmony

### 3.2 Liquidation Salvage (What Victim Keeps)
```
Salvage = HarvestBalance × (SalvageRatioBonuses + Power/100)
```

**Example:** 20 power, 10% salvage bonus, 100 MUSU balance:
- Salvage = 100 × (0.1 + 20/100) = 100 × 0.3 = 30 MUSU kept

### 3.3 Liquidation Spoils (What Predator Gets)
```
Spoils = (HarvestBalance - SalvageAmount) × min(1, (Power/100 + 0.45 + SpoilsShift))
```

**Example:** 10 power, 10% spoils shift, victim had 100 MUSU (kept 30):
```
Spoils = (100 - 30) × min(1, (0.1 + 0.45 + 0.1))
       = 70 × 0.65
       = 45.5 MUSU gained
```

### 3.4 Recoil Damage (Total)
```
RecoilDamage = 0.6(MUSUDamage) + Karma
```

#### 3.4.1 Karma Damage
```
Karma = 2 × animosityRatio × max(0, VictimViolence - PredatorHarmony + 10)
```

**Example:** Normal hands victim (20 violence) vs Normal body predator (15 harmony):
- Karma = 2 × 1.2 × max(0, 20 - 15 + 10) = 2.4 × 15 = 36 HP

#### 3.4.2 MUSU Damage
```
MUSUDamage = Strain(MUSUSpoils)
           = (6.5 × (1 - StrainDecrease) × MUSUSpoils) / (PredatorHarmony + 20)
```

**Example:** 15 harmony, 0% strain decrease, 100 MUSU spoils:
- MUSUDamage = (6.5 × 1 × 100) / 35 = 18.57 HP

**Complete Recoil Example:**
- Karma = 36 HP
- MUSU Damage = 18.57 HP
- Total Recoil = 0.6(18.57) + 36 = 11.14 + 36 = 47.14 HP

**Key Insight:** Harmony increases effective HP by ~4-5 per point on predators (less effective than +10 flat HP)

### 3.5 Action Cooldown
```
ActionCooldown = 180 - CooldownReduction
```
- Base cooldown: 180 seconds (3 minutes)
- Linear reduction from Predator tree skills

---

## 4. SKILL PRIORITY INSIGHTS

### Bounty Boost vs Fertility Boost
**Fertility Boost is better for:**
- [Typed/Typed] matching Kamis (same type body/hands)
- [Normal/Typed] Kamis (short harvests <4 hours)

**Bounty Boost is better for:**
- [Typed/Normal] Kamis
- Mismatching [Typed/Typed] Kamis
- [Normal/Typed] Kamis on long harvests (>4 hours due to intensity)

### Threshold Shift vs Ratio Shift (Guardians)
**Always prioritize Threshold Shift:**
- Flat increase is superior at all harmony levels
- Gap widens as harmony increases
- Ratio shift only valuable at very low harmony (<10)

### Harmony Diminishing Returns
- Each point of harmony has decreasing marginal value for strain reduction
- Higher harmony reduces the effectiveness of strain decrease percentages
- Sweet spot: Medium-high harmony (20-30) with strain reduction skills

### Violence Diminishing Returns
- Kill threshold increases diminish as violence gets higher
- Similar diminishing curve to harmony
- Maximum base animosity caps at 40%

---

## 5. STAT MULTIPLIERS SUMMARY

| Stat Type | Base Rate | Skill Bonus (typical) |
|-----------|-----------|----------------------|
| Violence | Base stat | +1, +3, +5 per tier |
| Power | Base stat | +1, +3, +5 per tier |
| Harmony | Base stat | +1, +3, +5 per tier |
| Health | Base stat | +10, +50 per tier |
| Fertility Boost | 0% | +6% per level |
| Bounty Boost | 0% | +4% per level |
| Intensity Boost | 10/hr base | +5, +15, +25/hr per tier |
| Metabolism Boost | 0% | +5%, +15% per tier |
| Strain Decrease | 0% | -2.5%, -7.5%, -12.5% per tier |
| Threshold Shift | 0% | +2%, +5% per tier |
| Threshold Ratio | 0% | +5% per tier |
| Salvage Ratio | Power/100 | +2%, +5%, +10% per tier |
| Spoils Ratio | 0.45 base | +2%, +5% per tier |
| Cooldown Reduction | 0s | -10s, -50s per tier |

---

## NOTES
- All calculations subject to balance changes
- Time is measured in minutes for intensity calculations
- NormCdf function is the standard normal cumulative distribution function
- Level 55 (final tier) estimated to take ~1 year to reach
- Talent trees are resettable