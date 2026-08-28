import Dexie, { type Table } from 'dexie';

// Define Interfaces
export interface Item {
  id?: number;
  name: string;
  categoryId: string;
  locationId: string;
  quantity: number;
  price?: number;
  purchaseDate?: string; // YYYY-MM-DD
  expiryDate?: string;   // YYYY-MM-DD
  tags: string[];        // Array of tags
  notes?: string;
  photo?: string;        // Base64 string for image
}

export interface Category {
  id: string; // uuid or slug
  name: string;
  color: string; // Hex color
  icon: string; // Lucide icon name
}

export interface StorageLocation {
  id: string; // uuid or slug
  name: string;
  parentId?: string; // For nesting e.g., Living Room -> TV Cabinet
  description?: string;
}

// Dexie Database Class
class MyThingsDatabase extends Dexie {
  items!: Table<Item>;
  categories!: Table<Category>;
  locations!: Table<StorageLocation>;

  constructor() {
    super('MyThingsDatabase');
    this.version(1).stores({
      items: '++id, name, categoryId, locationId, *tags, expiryDate',
      categories: 'id, name',
      locations: 'id, name, parentId',
    });
  }
}

export const db = new MyThingsDatabase();

// Helper to generate UUID
export function generateUUID(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Default Categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-electronics', name: '电子产品', color: '#007AFF', icon: 'Smartphone' },
  { id: 'cat-clothing', name: '服饰衣物', color: '#FF9500', icon: 'Shirt' },
  { id: 'cat-books', name: '书籍纸张', color: '#5856D6', icon: 'BookOpen' },
  { id: 'cat-medicine', name: '医药健康', color: '#FF3B30', icon: 'HeartPulse' },
  { id: 'cat-food', name: '食品饮料', color: '#34C759', icon: 'Apple' },
  { id: 'cat-cosmetics', name: '美妆个护', color: '#FF2D55', icon: 'Sparkles' },
  { id: 'cat-tools', name: '工具设备', color: '#8E8E93', icon: 'Wrench' },
  { id: 'cat-others', name: '其它物品', color: '#AF52DE', icon: 'Package' },
];

// Default Locations
export const DEFAULT_LOCATIONS: StorageLocation[] = [
  { id: 'loc-home', name: '家', description: '日常居住地' },
  { id: 'loc-livingroom', name: '客厅', parentId: 'loc-home' },
  { id: 'loc-bedroom', name: '卧室', parentId: 'loc-home' },
  { id: 'loc-kitchen', name: '厨房', parentId: 'loc-home' },
];

// Populate defaults on first database creation
db.on('populate', () => {
  db.categories.bulkAdd(DEFAULT_CATEGORIES);
  db.locations.bulkAdd(DEFAULT_LOCATIONS);
});
