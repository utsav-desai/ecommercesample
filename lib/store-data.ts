import fs from "fs/promises";
import path from "path";
import {
  Product,
  Order,
  StoreSettings,
  PRODUCTS,
  DEFAULT_STORE_SETTINGS,
} from "./products";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: "JM-8842K",
    date: "7 Sep 2026",
    total: 7370,
    items: 2,
    status: "Preparing",
    customerEmail: "priya.sharma@example.com",
    customerName: "Priya Sharma",
    paymentMode: "UPI (Google Pay)",
    lineItems: [
      {
        id: "1",
        name: "Solace Throw",
        price: 4880,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85",
      },
      {
        id: "2",
        name: "Dawn Vessel",
        price: 2490,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1400&q=85",
      },
    ],
  },
  {
    id: "JM-3921T",
    date: "6 Sep 2026",
    total: 3290,
    items: 1,
    status: "Confirmed",
    customerEmail: "rohit.mehta@example.com",
    customerName: "Rohit Mehta",
    paymentMode: "Razorpay Cards",
    lineItems: [
      {
        id: "3",
        name: "Everyday Tote",
        price: 3290,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85",
      },
    ],
  },
  {
    id: "JM-1049P",
    date: "3 Sep 2026",
    total: 2680,
    items: 2,
    status: "Delivered",
    customerEmail: "ananya.iyer@example.com",
    customerName: "Ananya Iyer",
    paymentMode: "UPI (PhonePe)",
    lineItems: [
      {
        id: "5",
        name: "Common Ground Mug",
        price: 1490,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=85",
      },
      {
        id: "4",
        name: "Morrow Journal",
        price: 1190,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1400&q=85",
      },
    ],
  },
];

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create data directory:", error);
  }
}

export async function getStoredProducts(): Promise<Product[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    try {
      await saveStoredProducts(PRODUCTS);
    } catch {
      // Ignore write errors if read-only filesystem
    }
  }
  return PRODUCTS;
}

export async function saveStoredProducts(products: Product[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
}

export async function getStoredProductById(id: string | number): Promise<Product | undefined> {
  const products = await getStoredProducts();
  const normalizedId = String(id);
  return products.find((p) => String(p.id) === normalizedId);
}

export async function getStoredOrders(): Promise<Order[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    try {
      await saveStoredOrders(INITIAL_DEMO_ORDERS);
    } catch {
      // Ignore write errors
    }
  }
  return INITIAL_DEMO_ORDERS;
}

export async function saveStoredOrders(orders: Order[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      return { ...DEFAULT_STORE_SETTINGS, ...parsed };
    }
  } catch {
    try {
      await saveStoreSettings(DEFAULT_STORE_SETTINGS);
    } catch {
      // Ignore write errors
    }
  }
  return DEFAULT_STORE_SETTINGS;
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const updated = { ...current, ...settings };
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

export async function resetCatalogToDefaults(): Promise<{ products: Product[]; orders: Order[]; settings: StoreSettings }> {
  await ensureDataDir();
  await saveStoredProducts(PRODUCTS);
  await saveStoredOrders(INITIAL_DEMO_ORDERS);
  await saveStoreSettings(DEFAULT_STORE_SETTINGS);
  return {
    products: PRODUCTS,
    orders: INITIAL_DEMO_ORDERS,
    settings: DEFAULT_STORE_SETTINGS,
  };
}
