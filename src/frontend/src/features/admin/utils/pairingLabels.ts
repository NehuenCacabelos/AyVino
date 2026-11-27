export const PAIRING_CATEGORY_LABELS: Record<string, string> = {
  Meat: 'Carnes',
  Fish: 'Pescados',
  Seafood: 'Mariscos',
  Cheese: 'Quesos',
  Dessert: 'Postres',
  Pasta: 'Pastas',
  Vegetarian: 'Vegetariano',
  Appetizer: 'Picadas',
  Other: 'Otros',
};

export const PAIRING_CATEGORY_OPTIONS = [
  { value: 'Meat', label: 'Carnes' },
  { value: 'Fish', label: 'Pescados' },
  { value: 'Seafood', label: 'Mariscos' },
  { value: 'Cheese', label: 'Quesos' },
  { value: 'Dessert', label: 'Postres' },
  { value: 'Pasta', label: 'Pastas' },
  { value: 'Vegetarian', label: 'Vegetariano' },
  { value: 'Appetizer', label: 'Picadas' },
  { value: 'Other', label: 'Otros' },
] as const;

