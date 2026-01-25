# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start development server (localhost:5173)
npm run build    # TypeScript compile + Vite production build
npm run preview  # Preview production build
```

No test runner or linter is currently configured. TypeScript strict mode handles type checking.

## Architecture

This is a React 19 + TypeScript + Vite demand planning simulation game where players manage inventory across multiple products and SKUs.

### Key Directories

- `src/components/` - React UI components (Game orchestrator, InventoryGraph canvas, MultiSKUGame, GameControls, ScoreDisplay, EndScreen, EducationalScreen, CTAScreen)
- `src/game/` - Core game logic: types, constants, levels, products, demand engine, quiverAI, scoring
- `src/hooks/` - Custom hooks for state (useGameState), game loop (useGameLoop), and sound (useSoundEffects)
- `src/styles/game.css` - All styling using CSS custom properties

### State Management

Uses React's `useReducer` with a Redux-like pattern. Key actions: START_LEVEL, TICK, PLACE_ORDER, CONTINUE_TO_NEXT_LEVEL. State flows through `Game.tsx` which orchestrates all child components.

### Game Loop

`useGameLoop` drives the simulation with `requestAnimationFrame`. Each frame calls `tick(deltaTime)` to update inventory based on demand, process pending orders, and accumulate costs. Delta time is capped at 0.1s.

### Level System

Levels are generated dynamically in `src/game/levels/index.ts`:
- `createLevel1(product)` - Single SKU, forecast visible, normal lead time
- `createLevel2(product)` - Single SKU, no forecast, 1.5x lead time, marketing event
- `createLevel3(product)` - 6 SKUs, no forecast, normal lead time, 2 marketing events

### Quiver Engine

The AI ordering system in `quiverAI.ts` uses supply chain best practices:
- **Average Demand Rate** = Total demand / game duration
- **Safety Stock** = Half month's demand (6 seconds in game time)
- **Lead Time Demand** = Average demand × effective lead time
- **Reorder Point** = Lead Time Demand + Safety Stock
- Orders when inventory position (on-hand + pending) ≤ reorder point

Uses dynamic values from constants (BASE_LEAD_TIME, SECONDS_PER_MONTH) and level config (leadTimeMultiplier).

### Products

Defined in `src/game/products.ts`:
- Protein Bar: High volume, low cost, 16% holding rate
- Medicine: Medium volume, medium cost, 12% holding rate
- Sofa: Low volume, high cost, 8% holding rate

### Scoring

Grade thresholds in `constants.ts` are product-specific AND level-specific. Calculated in `scoring.ts` using `calculateGrade(totalCost, levelId, productId)`.

### Rendering

`InventoryGraph.tsx` uses Canvas API to render:
- Real-time inventory history line
- Demand projection (when forecast enabled)
- Pending order bars
- Marketing event indicators
- Month dividers and grid

## Game Parameters (in constants.ts)

- Duration: 36 seconds (3 months, 12s each)
- Base Lead Time: 4 seconds
- Level 2 Lead Time Multiplier: 1.5x
- Marketing Event Duration: 12 seconds
- Marketing Event Demand Multiplier: 2.2x

## Keyboard Shortcuts

- **Spacebar**: Place order (single-SKU levels only)
