# Demand Planner Simulator 2026

A React-based demand planning simulation game where players manage inventory across multiple SKUs, handle marketing events, and learn supply chain best practices.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
cd demand_game
npm install
```

### Running the Game

Start the development server:

```bash
npm run dev
```

The game will be available at `http://localhost:5173` (default Vite port).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Game Overview

### Products

Choose from three products with different characteristics:

| Product | Unit Cost | Margin | Holding Rate | Order Qty |
|---------|-----------|--------|--------------|-----------|
| Protein Bar | €1.50 | €1.50 | 16%/year | 500 units |
| Medicine | €45.00 | €30.00 | 12%/year | 50 units |
| Sofa | €120.00 | €80.00 | 8%/year | 10 units |

### Levels

**Level 1: Learn the Basics**
- Single SKU management
- Demand forecast visible
- 4-second lead time
- No marketing events

**Level 2: Handle Uncertainty**
- Single SKU management
- No demand forecast (hidden)
- 6-second lead time (50% longer)
- Marketing campaign at 4s (doubles demand for 12s)

**Level 3: Multi-SKU Challenge**
- 6 SKUs simultaneously
- No demand forecast
- 4-second lead time
- 2 marketing events affecting different SKUs

### Quiver Engine Demo

After completing Level 3, watch the Quiver Engine manage all 6 SKUs automatically using supply chain best practices:
- Reorder Point = Lead Time Demand + Safety Stock
- Safety Stock = Half month's worth of average demand
- Orders placed when inventory position falls below reorder point

## Controls

- **Click ORDER button** or **Press SPACEBAR** to place orders
- Orders arrive after the lead time period
- Monitor costs: Holding, Stockout, and Ordering

## Scoring

Grades are based on total cost and vary by product and level. Lower cost = better grade (A through F).

## Tech Stack

- React 19
- TypeScript
- Vite
- Canvas API for real-time graphing
