import { ProductConfig } from './types';

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'protein-bar',
    name: 'Drink',
    icon: '🥤',
    cogsPerUnit: 1.50,             // €1.50 cost
    revenuePerUnit: 3.00,          // €3.00 revenue
    annualHoldingRate: 0.16,       // 16% annual (higher due to expiry risk)
    orderingCost: 25,              // €25 per order
    demandScale: 40,               // High volume product
    baseOrderQuantity: 500,        // Order 500 units at a time
    baseInitialInventory: 1120,    // Start with ~1.4 week buffer
    maxInventory: 3000,            // Y-axis max for drinks
    skuVariants: [
      'Cola',
      'Lemonade',
      'Orange Juice',
      'Iced Tea',
    ],
  },
  {
    id: 'medicine',
    name: 'Medicine',
    icon: '💊',
    cogsPerUnit: 45.00,            // €45 cost
    revenuePerUnit: 75.00,         // €75 revenue
    annualHoldingRate: 0.12,       // 12% annual (temperature-controlled)
    orderingCost: 50,              // €50 per order
    demandScale: 4,                // Medium volume
    baseOrderQuantity: 50,         // Order 50 units at a time
    baseInitialInventory: 112,     // Start with ~1.4 week buffer
    maxInventory: 400,             // Y-axis max for medicine
    skuVariants: [
      'Regular',
      'Children\'s',
      'Night Time',
      'Extra Strength',
    ],
  },
  {
    id: 'sofa',
    name: 'Sofa',
    icon: '🛋️',
    cogsPerUnit: 120.00,           // €120 cost
    revenuePerUnit: 200.00,        // €200 revenue
    annualHoldingRate: 0.08,       // 8% annual (large but durable)
    orderingCost: 100,             // €100 per order
    demandScale: 1,                // Low volume
    baseOrderQuantity: 10,         // Order 10 units at a time
    baseInitialInventory: 28,      // Start with ~1.4 week buffer
    maxInventory: 100,             // Y-axis max for sofas
    skuVariants: [
      'Grey 2-seater',
      'Blue 3-seater',
      'Green Corner',
      'Beige 3-seater',
    ],
  },
];

// Helper to get margin (stockout cost) for a product
export function getMargin(product: ProductConfig): number {
  return product.revenuePerUnit - product.cogsPerUnit;
}

// Helper to get holding cost per game-second
// Game: 36 seconds = 3 months = 0.25 years
export function getHoldingCostPerSecond(product: ProductConfig): number {
  return product.cogsPerUnit * product.annualHoldingRate * 0.25;
}

// Get product by ID
export function getProductById(id: string): ProductConfig | undefined {
  return PRODUCTS.find(p => p.id === id);
}
