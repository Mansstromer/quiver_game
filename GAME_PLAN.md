# Supply Demand Planner Simulator 2026 - Game Plan

This document outlines the complete redesign of the demand planning game, including screen flow, economic model, level designs, and technical implementation.

---

## 1. Screen Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GAME FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │ START SCREEN │───>│   PRODUCT    │───>│    RULES     │                   │
│  │  + Intro     │    │  SELECTION   │    │   SCREEN     │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                                       │                            │
│         │  "Supply Demand Planner               │  Shows formulas,           │
│         │   Simulator 2026"                     │  cost equations,           │
│         │                                       │  gameplay screenshots      │
│         │  Slides:                              │                            │
│         │  1. "You are a demand planner"        │                            │
│         │  2. "You buy products"                │                            │
│         │  3. "Prevent stock-outs"              │                            │
│         │  4. "Minimize inventory costs"        │                            │
│                                                 ▼                            │
│                                        ┌──────────────┐                      │
│                                        │   LEVEL 1    │                      │
│                                        │  (Tutorial)  │                      │
│                                        └──────────────┘                      │
│                                                 │                            │
│                                                 │ "Continue to Level 2"      │
│                                                 ▼                            │
│                                        ┌──────────────┐                      │
│                                        │  LEVEL 2     │                      │
│                                        │  INFO SCREEN │                      │
│                                        └──────────────┘                      │
│                                                 │                            │
│                                                 │  Shows lead time           │
│                                                 │  increase (50%)            │
│                                                 │  before/after visuals      │
│                                                 ▼                            │
│                                        ┌──────────────┐                      │
│                                        │   LEVEL 2    │                      │
│                                        │ (Marketing   │                      │
│                                        │  Event)      │                      │
│                                        └──────────────┘                      │
│                                                 │                            │
│                                                 │ "Continue to Level 3"      │
│                                                 ▼                            │
│                                        ┌──────────────┐                      │
│                                        │   LEVEL 3    │                      │
│                                        │  (6 SKUs)    │                      │
│                                        └──────────────┘                      │
│                                                 │                            │
│                                                 │ "Try Level 3 with          │
│                                                 │  Quiver Engine"            │
│                                                 ▼                            │
│                                        ┌──────────────┐                      │
│                                        │ QUIVER DEMO  │                      │
│                                        │  (6 SKUs)    │                      │
│                                        └──────────────┘                      │
│                                                 │                            │
│                                                 ▼                            │
│                                        ┌──────────────┐                      │
│                                        │ EDUCATIONAL  │                      │
│                                        │  + CTA       │                      │
│                                        └──────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Economic Model

### 2.1 Time Scaling

| Real World | Game Time |
|------------|-----------|
| 3 months   | 36 seconds |
| 1 month    | 12 seconds |
| 1 week     | ~2.8 seconds |
| 1 day      | ~0.4 seconds |

The graph will be divided into **3 sections** (Month 1, Month 2, Month 3), each 12 seconds of game time.

### 2.2 Lead Time

- **Real-world equivalent**: 1.5 weeks
- **Game time**: ~4 seconds (rounded for gameplay)
- **Level 2**: 50% increase = 6 seconds

### 2.3 Cost Formulas

#### Holding Cost (Full Carrying Cost)

Holding cost represents the total cost of keeping inventory in stock. Components include:

| Component | Description | Typical % |
|-----------|-------------|-----------|
| Capital cost | Opportunity cost of money tied up | 8-12% |
| Storage cost | Warehouse space, utilities | 2-4% |
| Insurance | Coverage against loss/damage | 1-2% |
| Obsolescence | Risk of product becoming unsellable | 2-6% |
| **Total** | **Annual holding cost rate** | **12-20%** |

**Formula:**
```
Holding Cost per unit per second = (COGS × Annual Holding Rate) / (365 × 24 × 3600)

Game-scaled (36s = 3 months = 0.25 years):
Holding Cost per unit per game-second = (COGS × Annual Holding Rate) / 4
                                       = COGS × Annual Holding Rate × 0.25
```

For example, a protein bar with COGS = €1.50 and 16% annual rate:
```
Holding cost = €1.50 × 0.16 × 0.25 = €0.06 per unit per game-second
```

#### Stockout Cost (Lost Margin)

When demand cannot be met, the cost is the lost profit margin:

**Formula:**
```
Stockout Cost per unit = Revenue - COGS = Margin
```

| Product | Revenue | COGS | Margin (Stockout Cost) |
|---------|---------|------|------------------------|
| Protein Bar | €3.00 | €1.50 | €1.50 |
| Medicine | €75.00 | €45.00 | €30.00 |
| Sofa | €200.00 | €120.00 | €80.00 |

#### Ordering Cost

Fixed cost incurred each time an order is placed (admin, processing, shipping setup):

**Formula:**
```
Total Ordering Cost = Number of Orders × Cost per Order
```

| Product | Order Cost |
|---------|------------|
| Protein Bar | €25 |
| Medicine | €50 |
| Sofa | €100 |

### 2.4 Total Cost Calculation

```
Total Cost = Holding Cost + Stockout Cost + Ordering Cost

Where:
- Holding Cost = Σ (Inventory × Holding Rate × Δt) over time
- Stockout Cost = Σ (Unmet Demand × Margin) over time
- Ordering Cost = Number of Orders × Order Cost per Order
```

### 2.5 Score Calculation

Score is inversely related to total cost. Lower cost = higher score.

```
Base Score = 1000
Score = max(0, Base Score - Total Cost)

Grade:
- A: Score >= 800 (cost <= €200)
- B: Score >= 600 (cost <= €400)
- C: Score >= 400 (cost <= €600)
- D: Score >= 200 (cost <= €800)
- F: Score < 200 (cost > €800)
```

*Note: Grade thresholds will be tuned per level after playtesting.*

---

## 3. Product Configuration

### 3.1 Protein Bars

Fast-moving consumer goods with high volume, low margins.

| Parameter | Value | Notes |
|-----------|-------|-------|
| COGS | €1.50 | Raw materials + production |
| Revenue | €3.00 | Retail price |
| Margin | €1.50 | 50% gross margin |
| Annual Holding Rate | 16% | Higher obsolescence (expiry) |
| Order Cost | €25 | Lower setup costs |
| Demand Scale | ~2000-5000 units | High volume |
| Order Quantity | 500 units | Bulk orders |
| Initial Inventory | 800 units | ~1 week buffer |

**SKU Variants (Level 3):**
1. Chocolate Chip
2. Peanut Butter
3. Vanilla
4. Berry Blast
5. Caramel
6. Coconut

### 3.2 Medicine

Medium-value items with strict handling requirements.

| Parameter | Value | Notes |
|-----------|-------|-------|
| COGS | €45.00 | Pharmaceutical costs |
| Revenue | €75.00 | Regulated pricing |
| Margin | €30.00 | 40% gross margin |
| Annual Holding Rate | 12% | Temperature-controlled |
| Order Cost | €50 | Compliance paperwork |
| Demand Scale | ~200-500 units | Moderate volume |
| Order Quantity | 50 units | Smaller batches |
| Initial Inventory | 80 units | ~1 week buffer |

**SKU Variants (Level 3):**
1. 10mg Tablets
2. 25mg Tablets
3. 50mg Capsules
4. Liquid 100ml
5. Liquid 250ml
6. Extended Release

### 3.3 Sofas

Slow-moving, high-value items with significant storage costs.

| Parameter | Value | Notes |
|-----------|-------|-------|
| COGS | €120.00 | Manufacturing + materials |
| Revenue | €200.00 | Retail price |
| Margin | €80.00 | 40% gross margin |
| Annual Holding Rate | 8% | Large but durable |
| Order Cost | €100 | Logistics complexity |
| Demand Scale | ~50-150 units | Low volume |
| Order Quantity | 10 units | Small batches |
| Initial Inventory | 20 units | ~1 week buffer |

**SKU Variants (Level 3):**
1. Grey 2-seater
2. Grey 3-seater
3. Blue 2-seater
4. Blue 3-seater
5. Beige 2-seater
6. Beige 3-seater

---

## 4. Level Designs

### 4.1 Level 1: Tutorial Level

**Purpose**: Teach basic mechanics with predictable demand.

| Parameter | Value |
|-----------|-------|
| Duration | 36 seconds (3 months) |
| SKUs | 1 |
| Forecast | Yes (projection line visible) |
| Marketing Event | No |
| Lead Time | 4 seconds (~1.5 weeks) |
| Difficulty | Easy |
| Deterministic | Yes (always plays the same) |

**Demand Curve** (varies by product, example for Protein Bars):
```
Month 1 (0-12s):   Base demand (e.g., 50 units/sec)
Month 2 (12-24s):  Increased demand (e.g., 80 units/sec)
Month 3 (24-36s):  Decreased demand (e.g., 40 units/sec)
```

**Graph**: Shows 3 vertical dividers for months, with projection line showing future demand.

**Scoring**: Standard A-F grading based on total cost.

### 4.2 Level 2: Marketing Event

**Purpose**: Introduce uncertainty and supply chain disruption.

| Parameter | Value |
|-----------|-------|
| Duration | 36 seconds (3 months) |
| SKUs | 1 |
| Forecast | No (projection line hidden) |
| Marketing Event | Yes, at 4 seconds |
| Lead Time | 6 seconds (~2.25 weeks, 50% longer) |
| Difficulty | Hard (nearly impossible) |

**Pre-Level Info Screen**:
- Explains lead time has increased by 50%
- Shows before/after visual comparison
- Warning about unexpected demand changes

**Marketing Event**:
- Triggers at t=4 seconds
- Red vertical line appears on graph
- Text label: "Marketing Campaign Begins!"
- Demand increases by 100% (doubles) for 7 seconds
- No advance warning in forecast

**Demand Curve** (algorithmically generated):
```
0-4s:    Normal demand
4-11s:   2× demand (marketing event)
11-36s:  Return to varied but unpredictable pattern
```

**Scoring**: Standard A-F grading, but designed to be so difficult that most players will receive an F grade. If a player manages to play well, they earn their grade.

### 4.3 Level 3: Multi-SKU Chaos

**Purpose**: Demonstrate impossibility of manual management at scale.

| Parameter | Value |
|-----------|-------|
| Duration | 36 seconds (3 months) |
| SKUs | 6 (variants of selected product) |
| Forecast | No |
| Marketing Events | 2 SKUs affected (at 4s and 14s) |
| Lead Time | 4 seconds (normal) |
| Difficulty | Impossible |

**Layout**: 3×2 grid of smaller graphs
```
┌─────────┬─────────┬─────────┐
│  SKU 1  │  SKU 2  │  SKU 3  │
│         │ (event  │         │
│         │  @ 4s)  │         │
├─────────┼─────────┼─────────┤
│  SKU 4  │  SKU 5  │  SKU 6  │
│         │ (event  │         │
│         │  @ 14s) │         │
└─────────┴─────────┴─────────┘
```

**Responsive Sizing**:
- Each graph scales dynamically based on viewport
- Minimum: ~300×150px per graph
- Maximum: ~450×225px per graph
- Desktop-only (no mobile adaptation)

**Marketing Events**:
- SKU 2: Event at t=4 seconds (red line + label)
- SKU 5: Event at t=14 seconds (red line + label)
- Both double demand for 7 seconds

**Scoring**: Standard A-F grading, but designed to be essentially impossible for a human to manage 6 SKUs simultaneously. Most players will receive an F grade. If a player manages to play well, they earn their grade.

### 4.4 Quiver Demo (Level 3 Replay)

**Purpose**: Show how AI handles the impossible scenario.

| Parameter | Value |
|-----------|-------|
| Duration | 36 seconds |
| SKUs | 6 |
| Quiver AI | Enabled, auto-plays |
| Player Control | None (watch only) |

**Behavior**:
- Same level configuration as Level 3
- Quiver AI automatically places optimal orders
- Player watches all 6 SKUs being managed simultaneously
- Shows real-time decision-making

---

## 5. Educational Content & CTA

### 5.1 How Quiver Works (Technical Explanation)

After the Quiver demo, show educational screens explaining:

**Screen 1: The Problem**
- "Manual demand planning doesn't scale"
- "Humans can focus on 1-2 SKUs at a time"
- "Real warehouses have thousands of SKUs"

**Screen 2: Traditional Approach**
- Reorder Point (ROP) = Lead Time × Average Demand + Safety Stock
- Safety Stock = Z × σ × √(Lead Time)
- "Excel spreadsheets can't react in real-time"

**Screen 3: Quiver's Approach**
- "Machine learning predicts demand patterns"
- "Considers seasonality, promotions, external factors"
- "Optimizes across all SKUs simultaneously"
- "Reacts to real-time data"

**Screen 4: Results**
- Show comparison: Your Score vs Quiver Score
- "Quiver reduces stockouts by X%"
- "Quiver reduces holding costs by Y%"

### 5.2 Call-to-Action

**Target Audience**:
- Companies with >10M DKK in inventory

**CTA Screen**:
```
┌────────────────────────────────────────┐
│                                        │
│   Ready to optimize your supply chain? │
│                                        │
│   ┌────────────┐                       │
│   │   Photo    │  Morten Sønderlyng    │
│   │            │  CEO, Quiver          │
│   └────────────┘                       │
│                                        │
│   📧 [email]                           │
│   📞 [phone]                           │
│                                        │
│   ┌────────────────────────────────┐   │
│   │    Schedule a Conversation     │   │
│   └────────────────────────────────┘   │
│                                        │
│   For companies with:                  │
│   • 10M+ DKK in inventory              │
│                                        │
└────────────────────────────────────────┘
```

---

## 6. Technical Implementation

### 6.1 New Game States

```typescript
export type GameStatus =
  | 'start'           // New: Title screen with intro slides
  | 'product-select'  // Existing: Choose product
  | 'rules'           // New: Rules/formulas screen
  | 'level-1'         // Playing Level 1
  | 'level-1-end'     // Level 1 results
  | 'level-2-info'    // New: Pre-Level 2 info screen
  | 'level-2'         // Playing Level 2
  | 'level-2-end'     // Level 2 results
  | 'level-3'         // Playing Level 3
  | 'level-3-end'     // Level 3 results
  | 'quiver-demo'     // Watching Quiver play Level 3
  | 'educational'     // How Quiver works
  | 'cta';            // Contact form
```

### 6.2 New Types

```typescript
interface MarketingEvent {
  triggerTime: number;    // When event starts (in game seconds)
  duration: number;       // How long it lasts
  demandMultiplier: number; // e.g., 2.0 for 100% increase
  label: string;          // "Marketing Campaign Begins!"
}

interface LevelConfig {
  id: string;
  name: string;
  duration: number;
  skus: SKUConfig[];
  showForecast: boolean;           // New: whether to show projection
  leadTimeMultiplier: number;      // New: 1.0 = normal, 1.5 = 50% longer
  marketingEvents?: MarketingEvent[]; // New: per-SKU events
  quiverEnabled: boolean;
}

interface SKUConfig {
  id: string;
  name: string;
  variant?: string;               // New: "Chocolate Chip", "Grey 2-seater"
  demandSegments: DemandSegment[];
  initialInventory: number;
  orderQuantity: number;
  marketingEventIndex?: number;   // New: which event affects this SKU
}

interface DemandSegment {
  startTime: number;
  endTime: number;
  baseRate: number;
}
```

### 6.3 Product-Aware Cost Calculation

```typescript
interface ProductConfig {
  id: string;
  name: string;
  icon: string;
  cogs: number;              // Cost of goods sold
  revenue: number;           // Selling price
  annualHoldingRate: number; // e.g., 0.16 for 16%
  orderCost: number;         // Fixed cost per order
  demandScale: number;       // Multiplier for demand curve
  orderQuantity: number;     // Units per order
  initialInventory: number;  // Starting inventory
}

function calculateHoldingCostPerSecond(product: ProductConfig): number {
  // Game: 45 seconds = 3 months = 0.25 years
  // So holding cost per game-second = annual cost / 4
  return product.cogs * product.annualHoldingRate * 0.25;
}

function calculateStockoutCost(product: ProductConfig): number {
  return product.revenue - product.cogs; // Lost margin
}
```

### 6.4 File Changes Required

| File | Changes |
|------|---------|
| `src/game/types.ts` | Add new types, update GameStatus |
| `src/game/products.ts` | Update product configs with new fields |
| `src/game/levels/index.ts` | Add LEVEL_2, LEVEL_3 configs |
| `src/game/levels/level2.ts` | New file for Level 2 config |
| `src/game/levels/level3.ts` | New file for Level 3 config |
| `src/game/scoring.ts` | Update to use product-aware costs |
| `src/game/constants.ts` | Add time scaling constants |
| `src/hooks/useGameState.ts` | Add new actions for level transitions |
| `src/components/Game.tsx` | Orchestrate new screen flow |
| `src/components/StartScreen.tsx` | New: Title + intro slides |
| `src/components/RulesScreen.tsx` | New: Formulas and rules |
| `src/components/Level2InfoScreen.tsx` | New: Pre-Level 2 info |
| `src/components/MultiSKUGame.tsx` | New: 6-SKU grid layout |
| `src/components/EducationalScreen.tsx` | New: How Quiver works |
| `src/components/CTAScreen.tsx` | New: Contact form |
| `src/components/InventoryGraph.tsx` | Add month dividers, marketing event lines |
| `src/styles/game.css` | Add styles for new screens, responsive grid |

---

## 7. Open Questions for CEO Review

1. **Quiver algorithm**: The current AI uses pre-computed optimal times. Should we update it to work dynamically with the new product parameters?

2. **CEO contact details**: Need Morten's photo, email, and phone number for the CTA screen.

### Resolved Questions

- ✅ **Demand curves**: Generated algorithmically (Level 1 deterministic, Level 2-3 can vary)
- ✅ **Scoring**: Standard A-F grading for all levels (Levels 2-3 designed to be hard enough that players typically get F)
- ✅ **Currency**: Euros (€)
- ✅ **Analytics**: Not tracking

---

## 8. Implementation Priority

### Phase 1: Core Infrastructure
1. Update types and state management
2. Implement product-aware cost calculation
3. Add time scaling (45s = 3 months)

### Phase 2: Screen Flow
4. Create StartScreen with intro slides
5. Create RulesScreen with formulas
6. Update level transition flow

### Phase 3: Level 2
7. Create Level2InfoScreen
8. Implement marketing event system
9. Add lead time multiplier

### Phase 4: Level 3
10. Create MultiSKUGame component (3×2 grid)
11. Configure 6 SKU variants per product
12. Add marketing events to 2 SKUs

### Phase 5: Quiver Demo & CTA
13. Implement Quiver auto-play mode
14. Create EducationalScreen
15. Create CTAScreen

---

## 9. Summary of Key Parameters

| Parameter | Value |
|-----------|-------|
| Game Duration | 36 seconds (3 months) |
| Seconds per Month | 12 seconds |
| Lead Time (Normal) | 4 seconds (~1.5 weeks) |
| Lead Time (Level 2) | 6 seconds (50% increase) |
| Currency | Euros (€) |
| Products | Protein Bars, Medicine, Sofas |
| Level 3 SKUs | 6 variants of selected product |
| Marketing Events | At 4s (Level 2 & 3), at 14s (Level 3 SKU 5 only) |
| Marketing Duration | 7 seconds, 2× demand |

---

*Document created: January 2026*
*Ready for CEO review*
