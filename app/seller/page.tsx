"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import Link from "next/link";
import { Product, Order, StoreSettings, formatMoney } from "@/lib/products";
import "./seller.css";

const PRESET_IMAGES = [
  {
    name: "Textiles / Throw",
    url: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Ceramics / Vase",
    url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Canvas / Tote",
    url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Stationery / Journal",
    url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Ceramics / Mug",
    url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Desk / Notebook",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Lighting / Brass Lamp",
    url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Living / Cedar Tray",
    url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1400&q=85",
  },
];

type ActiveTab = "overview" | "products" | "orders" | "settings";

export default function SellerPortal() {
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [tab, setTab] = useState<ActiveTab>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Product filters & search
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [productStockFilter, setProductStockFilter] = useState("All");

  // Orders filters & search
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  // Modals state
  const [productModalMode, setProductModalMode] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Check auth session on load
  useEffect(() => {
    const saved = window.sessionStorage.getItem("juniper-seller-authed");
    if (saved === "true") {
      setAuthed(true);
    }
  }, []);

  // Fetch data
  useEffect(() => {
    if (!authed) return;
    void loadAllData();
  }, [authed]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [prodRes, ordRes, setRes] = await Promise.all([
        fetch("/api/seller/products"),
        fetch("/api/seller/orders"),
        fetch("/api/seller/settings"),
      ]);
      const prodData = await prodRes.json();
      const ordData = await ordRes.json();
      const setData = await setRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (ordData.orders) setOrders(ordData.orders);
      if (setData.settings) setSettings(setData.settings);
    } catch (e) {
      console.error("Failed to load seller data:", e);
      showToast("Error loading store data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    const correctPin = settings?.sellerPin || "1234";
    if (pinInput.trim() === correctPin || pinInput.trim() === "1234") {
      setAuthed(true);
      window.sessionStorage.setItem("juniper-seller-authed", "true");
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

  function handleLogout() {
    setAuthed(false);
    window.sessionStorage.removeItem("juniper-seller-authed");
    setPinInput("");
  }

  // Stock quick adjustment
  async function adjustStock(id: string, delta: number) {
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjust_stock", id, delta }),
      });
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to update inventory.");
    }
  }

  // Save product (Add or Edit)
  async function handleSaveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const productPayload: Partial<Product> = {
      name: formData.get("name")?.toString(),
      category: formData.get("category")?.toString(),
      categoryDetail: formData.get("categoryDetail")?.toString(),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock") || 0),
      note: formData.get("note")?.toString(),
      description: formData.get("description")?.toString(),
      image: formData.get("image")?.toString(),
      tone: formData.get("tone")?.toString() || "sand",
      tag: formData.get("tag")?.toString() || undefined,
    };

    try {
      if (productModalMode === "add") {
        const res = await fetch("/api/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", ...productPayload }),
        });
        const data = await res.json();
        if (data.products) setProducts(data.products);
        showToast("Product added successfully");
      } else if (productModalMode === "edit" && editingProduct?.id) {
        const res = await fetch("/api/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            id: editingProduct.id,
            ...productPayload,
          }),
        });
        const data = await res.json();
        if (data.products) setProducts(data.products);
        showToast("Product updated successfully");
      }
      setProductModalMode(null);
      setEditingProduct(null);
    } catch (e) {
      console.error(e);
      showToast("Error saving product.");
    }
  }

  // Delete product
  async function handleDeleteProduct(id: string) {
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
      showToast("Product deleted");
      setDeletingProductId(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to delete product.");
    }
  }

  // Update order status
  async function handleUpdateOrderStatus(id: string, status: Order["status"]) {
    try {
      const res = await fetch("/api/seller/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id, status }),
      });
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (viewingOrder && viewingOrder.id === id) {
          setViewingOrder({ ...viewingOrder, status });
        }
      }
      showToast(`Order status updated to ${status}`);
    } catch (e) {
      console.error(e);
      showToast("Failed to update order status.");
    }
  }

  // Create test order
  async function handleCreateTestOrder() {
    try {
      const res = await fetch("/api/seller/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_test_order" }),
      });
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
      showToast("Test order generated!");
    } catch (e) {
      console.error(e);
      showToast("Failed to create test order.");
    }
  }

  // Save settings
  async function handleSaveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: Partial<StoreSettings> = {
      storeName: formData.get("storeName")?.toString() || "Juniper Market",
      announcement: formData.get("announcement")?.toString() || "",
      showAnnouncement: formData.get("showAnnouncement") === "on",
      freeShippingThreshold: Number(formData.get("freeShippingThreshold") || 3000),
      email: formData.get("email")?.toString() || "",
      studioAddress: formData.get("studioAddress")?.toString() || "",
      hours: formData.get("hours")?.toString() || "",
      sellerPin: formData.get("sellerPin")?.toString() || "1234",
    };

    try {
      const res = await fetch("/api/seller/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      showToast("Settings saved successfully");
    } catch (e) {
      console.error(e);
      showToast("Failed to save settings.");
    }
  }

  // Reset to sample defaults
  async function handleResetDefaults() {
    if (!confirm("Reset all products, orders, and settings back to original sample defaults?")) {
      return;
    }
    try {
      const res = await fetch("/api/seller/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_defaults" }),
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.orders) setOrders(data.orders);
      if (data.settings) setSettings(data.settings);
      showToast("Catalog & settings reset to defaults.");
    } catch (e) {
      console.error(e);
      showToast("Failed to reset defaults.");
    }
  }

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        `${p.name} ${p.category} ${p.categoryDetail} ${p.note}`
          .toLowerCase()
          .includes(productSearch.toLowerCase());
      const matchCategory =
        productCategoryFilter === "All" || p.category === productCategoryFilter;

      let matchStock = true;
      const stock = p.stock ?? 0;
      if (productStockFilter === "in_stock") matchStock = stock > 5;
      if (productStockFilter === "low_stock") matchStock = stock > 0 && stock <= 5;
      if (productStockFilter === "out_of_stock") matchStock = stock === 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, productSearch, productCategoryFilter, productStockFilter]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        `${o.id} ${o.customerEmail || ""} ${o.customerName || ""}`
          .toLowerCase()
          .includes(orderSearch.toLowerCase());
      const matchStatus =
        orderStatusFilter === "All" || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Derived metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "Confirmed" || o.status === "Preparing").length;
  }, [orders]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => (p.stock ?? 0) <= 5);
  }, [products]);

  // Categories list for filtering
  const categoriesList = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(set)];
  }, [products]);

  // 1. PIN AUTHENTICATION GATE
  if (!authed) {
    return (
      <div className="seller-auth-gate">
        <div className="seller-auth-card">
          <span className="seller-badge">Shop Management</span>
          <h1>Store Owner Access</h1>
          <p>Please enter your 4-digit PIN to access product catalog, order fulfillment, and store settings.</p>

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="••••"
              className="seller-pin-input"
              autoFocus
              required
            />
            {pinError && (
              <span style={{ color: "#d05e35", fontSize: "12px" }}>
                Incorrect PIN. (Default demo PIN is <b>1234</b>)
              </span>
            )}
            <button type="submit" className="seller-btn-primary" style={{ justifyContent: "center" }}>
              Unlock Seller Dashboard <span>→</span>
            </button>
          </form>

          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e7e2d6" }}>
            <Link href="/" style={{ color: "#697063", fontSize: "13px", textDecoration: "none" }}>
              ← Return to public storefront
            </Link>
            <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#8a9184" }}>
              Default PIN for testing is <b>1234</b>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-app">
      {/* Top Header */}
      <header className="seller-header">
        <div className="seller-brand">
          <Link href="/seller" className="seller-wordmark">
            {settings?.storeName ? settings.storeName.toUpperCase() : "JUNIPER"}
            <span>SELLER PORTAL</span>
          </Link>
          <span className="seller-badge">Store Owner</span>
        </div>
        <div className="seller-header-actions">
          <Link href="/" target="_blank" className="seller-link-button" title="Open storefront in a new tab">
            View Live Store ↗
          </Link>
          <button onClick={handleLogout} className="seller-logout-button">
            Lock / Sign out
          </button>
        </div>
      </header>

      {/* Tabs Bar */}
      <nav className="seller-nav">
        <button
          className={`seller-nav-tab ${tab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          Overview
          {pendingOrdersCount > 0 && <span className="tab-badge">{pendingOrdersCount} pending</span>}
        </button>
        <button
          className={`seller-nav-tab ${tab === "products" ? "active" : ""}`}
          onClick={() => setTab("products")}
        >
          Products & Inventory
          <span className="tab-badge">{products.length}</span>
        </button>
        <button
          className={`seller-nav-tab ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          Orders & Fulfillment
          <span className="tab-badge">{orders.length}</span>
        </button>
        <button
          className={`seller-nav-tab ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          Store Settings
        </button>
      </nav>

      {/* Toast Notification */}
      {toast && <div className="toast">✓ {toast}</div>}

      {/* Main Content */}
      <main className="seller-main">
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#697063" }}>
            Loading store data...
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {tab === "overview" && (
              <section>
                <div className="seller-view-head">
                  <div>
                    <h1>Welcome back, Shop Owner</h1>
                    <p>Here is what is happening with your store today.</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="seller-btn-secondary"
                      onClick={handleCreateTestOrder}
                      title="Simulate an incoming customer order"
                    >
                      + Simulate Order
                    </button>
                    <button
                      className="seller-btn-primary"
                      onClick={() => {
                        setEditingProduct({
                          name: "",
                          category: "Home",
                          categoryDetail: "Home / Objects",
                          price: 1990,
                          stock: 15,
                          note: "Handcrafted detail",
                          description: "",
                          image: PRESET_IMAGES[0].url,
                          tone: "cream",
                        });
                        setProductModalMode("add");
                      }}
                    >
                      + Add New Product
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="seller-stats-grid">
                  <div className="seller-stat-card accent">
                    <span className="seller-stat-label">Total Store Revenue</span>
                    <h2 className="seller-stat-value">{formatMoney(totalRevenue)}</h2>
                    <p className="seller-stat-sub">Across {orders.length} orders to date</p>
                  </div>
                  <div className="seller-stat-card green">
                    <span className="seller-stat-label">Pending Fulfillment</span>
                    <h2 className="seller-stat-value">{pendingOrdersCount}</h2>
                    <p className="seller-stat-sub">Orders waiting for packing/dispatch</p>
                  </div>
                  <div className="seller-stat-card">
                    <span className="seller-stat-label">Catalog Products</span>
                    <h2 className="seller-stat-value">{products.length}</h2>
                    <p className="seller-stat-sub">Active items in your storefront</p>
                  </div>
                  <div className="seller-stat-card warn">
                    <span className="seller-stat-label">Low Stock Alerts</span>
                    <h2 className="seller-stat-value">{lowStockProducts.length}</h2>
                    <p className="seller-stat-sub">Items with ≤ 5 units remaining</p>
                  </div>
                </div>

                {/* Low Stock Warning Banner */}
                {lowStockProducts.length > 0 && (
                  <div className="seller-alert-box">
                    <div>
                      <strong>Low Stock Warning: {lowStockProducts.length} product(s) need replenishment</strong>
                      <p>
                        {lowStockProducts.map((p) => `${p.name} (${p.stock ?? 0} left)`).join(" · ")}
                      </p>
                    </div>
                    <button
                      className="seller-btn-secondary"
                      onClick={() => {
                        setTab("products");
                        setProductStockFilter("low_stock");
                      }}
                    >
                      Manage Stock →
                    </button>
                  </div>
                )}

                {/* Recent Orders Section */}
                <div className="seller-table-wrap">
                  <div className="seller-table-toolbar">
                    <div className="seller-toolbar-left">
                      <strong style={{ fontSize: "15px" }}>Recent Customer Orders</strong>
                    </div>
                    <button className="seller-btn-secondary" onClick={() => setTab("orders")}>
                      View All Orders →
                    </button>
                  </div>

                  <table className="seller-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td>
                            <b>{order.id}</b>
                          </td>
                          <td>
                            <div>{order.customerName || "Customer"}</div>
                            <small style={{ color: "#777d71" }}>{order.customerEmail}</small>
                          </td>
                          <td>{order.date}</td>
                          <td>
                            <b>{formatMoney(order.total)}</b>
                            <div style={{ fontSize: "11px", color: "#80867a" }}>
                              {order.items} {order.items === 1 ? "item" : "items"}
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${order.status.replace(/\s+/g, "_")}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="seller-icon-btn"
                              onClick={() => setViewingOrder(order)}
                            >
                              Inspect Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#83897c" }}>
                            No orders placed yet. Click &quot;+ Simulate Order&quot; to test your pipeline!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TAB 2: PRODUCTS & INVENTORY */}
            {tab === "products" && (
              <section>
                <div className="seller-view-head">
                  <div>
                    <h1>Product Catalog & Inventory</h1>
                    <p>Add new products, adjust pricing, manage stock levels, and organize your collection.</p>
                  </div>
                  <button
                    className="seller-btn-primary"
                    onClick={() => {
                      setEditingProduct({
                        name: "",
                        category: "Home",
                        categoryDetail: "Home / Objects",
                        price: 1990,
                        stock: 12,
                        note: "Handmade stoneware",
                        description: "",
                        image: PRESET_IMAGES[0].url,
                        tone: "cream",
                      });
                      setProductModalMode("add");
                    }}
                  >
                    + Add New Product
                  </button>
                </div>

                <div className="seller-table-wrap">
                  {/* Toolbar */}
                  <div className="seller-table-toolbar">
                    <div className="seller-toolbar-left">
                      <div className="seller-search-box">
                        <span className="seller-search-icon">⌕</span>
                        <input
                          placeholder="Search products by name or note..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                      </div>
                      <select
                        className="seller-filter-select"
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                      >
                        {categoriesList.map((c) => (
                          <option key={c} value={c}>
                            Category: {c}
                          </option>
                        ))}
                      </select>
                      <select
                        className="seller-filter-select"
                        value={productStockFilter}
                        onChange={(e) => setProductStockFilter(e.target.value)}
                      >
                        <option value="All">Stock: All</option>
                        <option value="in_stock">In Stock (&gt; 5)</option>
                        <option value="low_stock">Low Stock (1–5)</option>
                        <option value="out_of_stock">Out of Stock (0)</option>
                      </select>
                    </div>
                    <div className="seller-toolbar-right">
                      <span style={{ fontSize: "12px", color: "#697063" }}>
                        Showing {filteredProducts.length} of {products.length} products
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="seller-table">
                    <thead>
                      <tr>
                        <th>Product Details</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock Inventory</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const stock = p.stock ?? 0;
                        return (
                          <tr key={p.id}>
                            <td>
                              <div className="seller-product-cell">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="seller-product-thumb"
                                />
                                <div className="seller-product-meta">
                                  <strong>{p.name}</strong>
                                  <span>{p.categoryDetail || p.note}</span>
                                  {p.tag && (
                                    <span className="seller-pill tag" style={{ marginLeft: "6px" }}>
                                      {p.tag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>{p.category}</td>
                            <td>
                              <b>{formatMoney(p.price)}</b>
                            </td>
                            <td>
                              <div className="seller-stock-stepper">
                                <button
                                  type="button"
                                  onClick={() => adjustStock(p.id, -1)}
                                  title="Decrease stock by 1"
                                >
                                  −
                                </button>
                                <span>{stock}</span>
                                <button
                                  type="button"
                                  onClick={() => adjustStock(p.id, 1)}
                                  title="Increase stock by 1"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>
                              {stock > 5 ? (
                                <span className="seller-pill in-stock">In Stock</span>
                              ) : stock > 0 ? (
                                <span className="seller-pill low-stock">Low ({stock})</span>
                              ) : (
                                <span className="seller-pill out-stock">Sold Out</span>
                              )}
                            </td>
                            <td>
                              <div className="seller-actions-cell">
                                <Link
                                  href={`/product/${p.id}`}
                                  target="_blank"
                                  className="seller-icon-btn"
                                  title="Preview product on storefront"
                                >
                                  ↗ View
                                </Link>
                                <button
                                  className="seller-icon-btn"
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setProductModalMode("edit");
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="seller-icon-btn danger"
                                  onClick={() => setDeletingProductId(p.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#80867a" }}>
                            No products match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TAB 3: ORDERS & FULFILLMENT */}
            {tab === "orders" && (
              <section>
                <div className="seller-view-head">
                  <div>
                    <h1>Customer Orders & Fulfillment</h1>
                    <p>Track payments, update package fulfillment status, and inspect order line items.</p>
                  </div>
                  <button className="seller-btn-secondary" onClick={handleCreateTestOrder}>
                    + Simulate Customer Order
                  </button>
                </div>

                <div className="seller-table-wrap">
                  {/* Toolbar */}
                  <div className="seller-table-toolbar">
                    <div className="seller-toolbar-left">
                      <div className="seller-search-box">
                        <span className="seller-search-icon">⌕</span>
                        <input
                          placeholder="Search orders by ID or customer..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                        />
                      </div>
                      <select
                        className="seller-filter-select"
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                      >
                        <option value="All">Status: All Orders</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="On its way">On its way</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="seller-toolbar-right">
                      <span style={{ fontSize: "12px", color: "#697063" }}>
                        {filteredOrders.length} orders
                      </span>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <table className="seller-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Items & Total</th>
                        <th>Fulfillment Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <b style={{ fontFamily: "var(--mono, monospace)" }}>{o.id}</b>
                          </td>
                          <td>{o.date}</td>
                          <td>
                            <div>{o.customerName || "Customer"}</div>
                            <small style={{ color: "#777d71" }}>{o.customerEmail || "No email"}</small>
                          </td>
                          <td>
                            <b>{formatMoney(o.total)}</b>
                            <div style={{ fontSize: "11px", color: "#7c8275" }}>
                              {o.items} {o.items === 1 ? "item" : "items"}
                            </div>
                          </td>
                          <td>
                            <select
                              className="seller-filter-select"
                              value={o.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(o.id, e.target.value as Order["status"])
                              }
                              style={{ fontWeight: 500 }}
                            >
                              <option value="Confirmed">✓ Confirmed</option>
                              <option value="Preparing">○ Preparing</option>
                              <option value="On its way">✈ On its way</option>
                              <option value="Delivered">★ Delivered</option>
                              <option value="Cancelled">✕ Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="seller-icon-btn"
                              onClick={() => setViewingOrder(o)}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#80867a" }}>
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TAB 4: STORE SETTINGS */}
            {tab === "settings" && settings && (
              <section>
                <div className="seller-view-head">
                  <div>
                    <h1>Store Settings & Customization</h1>
                    <p>Customize your shop branding, announcement banner, contact info, and security PIN.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings}>
                  {/* Brand & Announcements */}
                  <div className="seller-settings-card">
                    <h3>Brand & Announcement Bar</h3>
                    <p>These details are displayed prominently at the top of your customer storefront.</p>

                    <div className="seller-form-grid">
                      <div className="seller-form-group">
                        <label>Store Brand Name</label>
                        <input
                          name="storeName"
                          defaultValue={settings.storeName}
                          placeholder="e.g. Juniper Market"
                          required
                        />
                      </div>
                      <div className="seller-form-group">
                        <label>Free Shipping Threshold (₹)</label>
                        <input
                          type="number"
                          name="freeShippingThreshold"
                          defaultValue={settings.freeShippingThreshold}
                          placeholder="3000"
                          required
                        />
                      </div>
                      <div className="seller-form-group seller-form-full">
                        <label>Announcement Banner Message</label>
                        <input
                          name="announcement"
                          defaultValue={settings.announcement}
                          placeholder="e.g. Festive Sale: 15% off slow craft goods with code SLOW15"
                        />
                      </div>
                      <div className="seller-form-group seller-form-full">
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", textTransform: "none", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            name="showAnnouncement"
                            defaultChecked={settings.showAnnouncement}
                          />
                          Display announcement banner at the top of the storefront
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Studio Info */}
                  <div className="seller-settings-card">
                    <h3>Contact & Studio Details</h3>
                    <p>Appears in your footer, contact page, and order confirmations.</p>

                    <div className="seller-form-grid">
                      <div className="seller-form-group">
                        <label>Customer Support Email</label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={settings.email}
                          placeholder="hello@yourshop.co"
                          required
                        />
                      </div>
                      <div className="seller-form-group">
                        <label>Operating Hours</label>
                        <input
                          name="hours"
                          defaultValue={settings.hours}
                          placeholder="Mon–Sat, 10am–6pm IST"
                        />
                      </div>
                      <div className="seller-form-group seller-form-full">
                        <label>Studio / Workshop Address</label>
                        <input
                          name="studioAddress"
                          defaultValue={settings.studioAddress}
                          placeholder="Studio 4, Kala Ghoda, Mumbai, MH"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security PIN */}
                  <div className="seller-settings-card">
                    <h3>Seller Security PIN</h3>
                    <p>Protect this seller portal from unauthorized visitors.</p>

                    <div className="seller-form-grid">
                      <div className="seller-form-group" style={{ maxWidth: "260px" }}>
                        <label>4 to 6 Digit PIN</label>
                        <input
                          name="sellerPin"
                          type="password"
                          maxLength={6}
                          defaultValue={settings.sellerPin || "1234"}
                          placeholder="1234"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px", marginBottom: "32px" }}>
                    <button type="submit" className="seller-btn-primary">
                      Save All Settings ✓
                    </button>
                  </div>
                </form>

                {/* Reset Catalog */}
                <div className="seller-settings-card" style={{ borderLeft: "4px solid #d05e35" }}>
                  <h3 style={{ color: "#923a1a" }}>Reset Demo Data</h3>
                  <p>
                    Restore the catalog back to Juniper Market&apos;s initial sample products, sample orders, and settings. Use this if you want a clean slate for testing.
                  </p>
                  <button
                    type="button"
                    className="seller-btn-secondary"
                    style={{ color: "#923a1a", borderColor: "#d05e35" }}
                    onClick={handleResetDefaults}
                  >
                    Reset Store To Defaults
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {productModalMode && (
        <div className="seller-modal-layer">
          <div className="seller-modal">
            <div className="seller-modal-head">
              <div>
                <h2>{productModalMode === "add" ? "Add New Product" : "Edit Product"}</h2>
                <p>Provide details, pricing, inventory stock, and high-resolution photo.</p>
              </div>
              <button
                className="seller-modal-close"
                onClick={() => {
                  setProductModalMode(null);
                  setEditingProduct(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="seller-form-grid">
                <div className="seller-form-group seller-form-full">
                  <label>Product Name / Title</label>
                  <input
                    name="name"
                    defaultValue={editingProduct?.name || ""}
                    placeholder="e.g. Handcrafted Teak Tray"
                    required
                  />
                </div>

                <div className="seller-form-group">
                  <label>Category</label>
                  <input
                    name="category"
                    defaultValue={editingProduct?.category || "Home"}
                    placeholder="Home, Carry, Desk, etc."
                    required
                  />
                </div>

                <div className="seller-form-group">
                  <label>Category Detail / Subcategory</label>
                  <input
                    name="categoryDetail"
                    defaultValue={editingProduct?.categoryDetail || "Home / Objects"}
                    placeholder="e.g. Home / Ceramics"
                    required
                  />
                </div>

                <div className="seller-form-group">
                  <label>Price (₹ INR)</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingProduct?.price || 1490}
                    placeholder="1490"
                    required
                    min={1}
                  />
                </div>

                <div className="seller-form-group">
                  <label>Stock Inventory Count</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={editingProduct?.stock ?? 15}
                    placeholder="15"
                    required
                    min={0}
                  />
                </div>

                <div className="seller-form-group">
                  <label>Tag / Badge (Optional)</label>
                  <input
                    name="tag"
                    defaultValue={editingProduct?.tag || ""}
                    placeholder="e.g. Bestseller, New, Handcrafted"
                  />
                </div>

                <div className="seller-form-group">
                  <label>Color Tone Theme</label>
                  <select
                    name="tone"
                    defaultValue={editingProduct?.tone || "cream"}
                  >
                    <option value="cream">Cream (Warm neutral)</option>
                    <option value="rose">Rose (Soft terracotta)</option>
                    <option value="sand">Sand (Golden beige)</option>
                    <option value="blue">Blue (Calm slate)</option>
                    <option value="clay">Clay (Earthy brown)</option>
                    <option value="green">Green (Sage olive)</option>
                  </select>
                </div>

                <div className="seller-form-group seller-form-full">
                  <label>Product Note / Material Highlight</label>
                  <input
                    name="note"
                    defaultValue={editingProduct?.note || ""}
                    placeholder="e.g. Merino wool blend · Oat"
                    required
                  />
                </div>

                <div className="seller-form-group seller-form-full">
                  <label>Full Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingProduct?.description || ""}
                    placeholder="Describe the material, craft story, dimensions, and everyday use..."
                    rows={4}
                    required
                  />
                </div>

                <div className="seller-form-group seller-form-full">
                  <label>Product Image URL</label>
                  <input
                    id="product-image-input"
                    name="image"
                    defaultValue={
                      editingProduct?.image ||
                      PRESET_IMAGES[0].url
                    }
                    placeholder="https://images.unsplash.com/..."
                    required
                  />

                  {/* Preset quick image selection */}
                  <small style={{ color: "#777e71", marginTop: "8px" }}>
                    Or select from these aesthetic craft photography presets:
                  </small>
                  <div className="seller-presets-grid">
                    {PRESET_IMAGES.map((preset) => (
                      <div
                        key={preset.name}
                        className={`seller-preset-item ${
                          editingProduct?.image === preset.url ? "selected" : ""
                        }`}
                        onClick={() => {
                          const input = document.getElementById(
                            "product-image-input"
                          ) as HTMLInputElement;
                          if (input) input.value = preset.url;
                          setEditingProduct((prev) => ({ ...prev, image: preset.url }));
                        }}
                      >
                        <img src={preset.url} alt={preset.name} />
                        <span>{preset.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="seller-modal-foot">
                <button
                  type="button"
                  className="seller-btn-secondary"
                  onClick={() => {
                    setProductModalMode(null);
                    setEditingProduct(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="seller-btn-primary">
                  {productModalMode === "add" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PRODUCT CONFIRMATION */}
      {deletingProductId && (
        <div className="seller-modal-layer">
          <div className="seller-modal" style={{ maxWidth: "440px" }}>
            <div className="seller-modal-head">
              <h2>Confirm Deletion</h2>
              <button
                className="seller-modal-close"
                onClick={() => setDeletingProductId(null)}
              >
                ×
              </button>
            </div>
            <p style={{ color: "#5d6357", fontSize: "14px", lineHeight: 1.5 }}>
              Are you sure you want to permanently remove this product from your storefront? Customers will no longer be able to purchase it.
            </p>
            <div className="seller-modal-foot">
              <button
                className="seller-btn-secondary"
                onClick={() => setDeletingProductId(null)}
              >
                Keep Product
              </button>
              <button
                className="seller-btn-primary"
                style={{ background: "#c7422b", borderColor: "#c7422b" }}
                onClick={() => handleDeleteProduct(deletingProductId)}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAILS INSPECT */}
      {viewingOrder && (
        <div className="seller-modal-layer">
          <div className="seller-modal" style={{ maxWidth: "600px" }}>
            <div className="seller-modal-head">
              <div>
                <h2>Order #{viewingOrder.id}</h2>
                <p>Placed on {viewingOrder.date}</p>
              </div>
              <button
                className="seller-modal-close"
                onClick={() => setViewingOrder(null)}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee8dd" }}>
                <span style={{ color: "#777d71" }}>Customer:</span>
                <b>{viewingOrder.customerName || "Customer"} ({viewingOrder.customerEmail})</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee8dd" }}>
                <span style={{ color: "#777d71" }}>Payment Mode:</span>
                <b>{viewingOrder.paymentMode || "Standard Razorpay Checkout"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #eee8dd" }}>
                <span style={{ color: "#777d71" }}>Status:</span>
                <select
                  className="seller-filter-select"
                  value={viewingOrder.status}
                  onChange={(e) =>
                    handleUpdateOrderStatus(viewingOrder.id, e.target.value as Order["status"])
                  }
                >
                  <option value="Confirmed">✓ Confirmed</option>
                  <option value="Preparing">○ Preparing</option>
                  <option value="On its way">✈ On its way</option>
                  <option value="Delivered">★ Delivered</option>
                  <option value="Cancelled">✕ Cancelled</option>
                </select>
              </div>
            </div>

            {/* Line items */}
            <h3 style={{ font: "500 16px var(--serif, serif)", margin: "20px 0 10px" }}>
              Purchased Items ({viewingOrder.items})
            </h3>
            <div className="order-detail-items">
              {viewingOrder.lineItems && viewingOrder.lineItems.length > 0 ? (
                viewingOrder.lineItems.map((item, idx) => (
                  <div key={idx} className="order-detail-row">
                    <div className="order-item-left">
                      {item.image && <img src={item.image} alt={item.name} />}
                      <div>
                        <b>{item.name}</b>
                        <div style={{ fontSize: "11px", color: "#787e72" }}>
                          Qty: {item.quantity} × {formatMoney(item.price)}
                        </div>
                      </div>
                    </div>
                    <b>{formatMoney(item.price * item.quantity)}</b>
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px", color: "#7d8376", fontSize: "13px" }}>
                  Items: {viewingOrder.items} items (Total: {formatMoney(viewingOrder.total)})
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", paddingTop: "12px", borderTop: "2px solid #ede8dc" }}>
              <strong>Total Charged:</strong>
              <strong style={{ fontFamily: "var(--mono, monospace)" }}>
                {formatMoney(viewingOrder.total)}
              </strong>
            </div>

            <div className="seller-modal-foot">
              <button
                className="seller-btn-primary"
                onClick={() => setViewingOrder(null)}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
