"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import "./interactions.css";

type Product = { id: number; name: string; category: string; price: number; note: string; image: string; tone: string; tag?: string };
type CartItem = Product & { quantity: number };
type Order = { id: string; date: string; total: number; items: number; status: "Confirmed" | "Preparing" | "On its way" };

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; }
}

const products: Product[] = [
  { id: 1, name: "Solace Throw", category: "Home", price: 4880, note: "Merino blend · Oat", tag: "Bestseller", tone: "cream", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Dawn Vessel", category: "Home", price: 2490, note: "Hand-thrown stoneware", tone: "rose", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Everyday Tote", category: "Carry", price: 3290, note: "Washed canvas · Clay", tag: "New", tone: "sand", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "Morrow Journal", category: "Desk", price: 1190, note: "Italian paper · 192 pages", tone: "blue", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Common Ground Mug", category: "Home", price: 1490, note: "Speckled porcelain", tone: "clay", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Field Notes Set", category: "Desk", price: 790, note: "Set of three · Recycled", tone: "green", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85" },
];

const money = (number: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(number);

export default function Storefront() {
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState<"login" | "signup" | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState<string | null>(null);
  const [checkoutAfterAuth, setCheckoutAfterAuth] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { const saved = window.localStorage.getItem("juniper-cart"); if (saved) setCart(JSON.parse(saved)); }, []);
  useEffect(() => { const saved = window.localStorage.getItem("juniper-account"); if (saved) setAccount(saved); const savedOrders = window.localStorage.getItem("juniper-orders"); if (savedOrders) setOrders(JSON.parse(savedOrders)); }, []);
  useEffect(() => { window.localStorage.setItem("juniper-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (account) window.localStorage.setItem("juniper-account", account); }, [account]);
  useEffect(() => { window.localStorage.setItem("juniper-orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("payment") === "success") { setOrderComplete(true); setCart([]); } }, []);
  useEffect(() => { if (account && checkoutAfterAuth) { setCheckoutAfterAuth(false); setAuthOpen(null); void startCheckout(); } }, [account, checkoutAfterAuth]);

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const filtered = useMemo(() => products.filter((product) =>
    (activeCategory === "All" || product.category === activeCategory) &&
    `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [activeCategory, search]);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  function addToCart(product: Product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      return existing ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to bag`); setTimeout(() => setNotice(""), 1800);
  }
  function updateQuantity(id: number, delta: number) { setCart((items) => items.flatMap((item) => item.id === id ? (item.quantity + delta > 0 ? [{ ...item, quantity: item.quantity + delta }] : []) : [item])); }
  function completeOrder() { const order: Order = { id: `JM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, date: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date()), total: subtotal, items: cartCount, status: "Confirmed" }; setOrders((existing) => [order, ...existing]); setCart([]); setOrderComplete(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function requestCheckout() { if (!account) { setCheckoutAfterAuth(true); setCartOpen(false); setAuthOpen("signup"); return; } void startCheckout(); }
  function completeAuthentication(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const email = new FormData(event.currentTarget).get("email")?.toString() || "Member"; setAccount(email); setNotice(authOpen === "login" ? "Welcome back." : "Your account is ready."); if (!checkoutAfterAuth) setAuthOpen(null); }
  async function startCheckout() {
    const response = await fetch("/api/create-razorpay-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
    const data = await response.json();
    if (data.mode !== "razorpay") { setCartOpen(false); setCheckout(true); return; }
    if (!window.Razorpay) {
      const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true;
      await new Promise<void>((resolve, reject) => { script.onload = () => resolve(); script.onerror = () => reject(new Error("Could not load Razorpay")); document.body.appendChild(script); });
    }
    const razorpay = new window.Razorpay!({ key: data.keyId, amount: data.amount, currency: data.currency, name: "Juniper Market", description: "Thoughtful everyday goods", order_id: data.orderId, theme: { color: "#364535" }, handler: async (payment: Record<string, string>) => {
      const verification = await fetch("/api/verify-razorpay-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
      if (verification.ok) completeOrder();
      else setNotice("We couldn’t verify that payment. Please try again.");
    }});
    razorpay.open();
  }
  function submitDemoPayment(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setCheckout(false); completeOrder(); }

  return <main>
    <div className="announcement">Complimentary shipping on orders over ₹3,000 <span>·</span> Made thoughtfully, sent lightly.</div>
    <header className="site-header">
      <button className="wordmark" onClick={() => setPage("home")} aria-label="Juniper Market home">JUNIPER<span>MARKET</span></button>
      <nav aria-label="Main navigation">
        {["home", "shop", "about", "contact"].map((item) => <button className={page === item ? "nav-active" : ""} onClick={() => { setPage(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} key={item}>{item === "home" ? "Home" : item === "shop" ? "Shop" : item === "about" ? "Our story" : "Contact"}</button>)}
      </nav>
      <div className="header-actions">
        <button className="icon-button search-trigger" onClick={() => { setPage("shop"); setTimeout(() => document.getElementById("product-search")?.focus(), 50); }} aria-label="Search">⌕</button>
        <button className="account-button" onClick={() => account ? setPage("tracking") : setAuthOpen("login")}>{account ? "Orders" : "Account"}</button>
        <button className="bag-button" onClick={() => setCartOpen(true)} aria-label="Open shopping bag">Bag <em>{cartCount}</em></button>
      </div>
    </header>

    {notice && <div className="toast">✓ {notice}</div>}
    {orderComplete && <section className="order-confirmation"><span>Order confirmed</span><strong>Thank you for making room for something good.</strong><button onClick={() => { setOrderComplete(false); setPage("tracking"); }}>Track order →</button><button onClick={() => setOrderComplete(false)}>Dismiss</button></section>}

    {page === "home" && <>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">The art of the everyday</p><h1>Well-made things<br />for a <i>well-lived</i> life.</h1><p className="hero-subtitle">A considered collection of useful objects, soft layers, and quiet pieces that make home feel more like yours.</p><button className="primary-button" onClick={() => setPage("shop")}>Shop the collection <span>→</span></button></div>
        <div className="hero-image"><div className="hero-stamp">EST.<br />2017</div><img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=90" alt="Sunlit, warmly furnished home" /></div>
      </section>
      <section className="category-band"><p>Find your new favorite</p><div>{[["Home", "01"], ["Carry", "02"], ["Desk", "03"]].map(([name, no]) => <button key={name} onClick={() => { setPage("shop"); setActiveCategory(name); }}><span>{no}</span>{name}<b>↗</b></button>)}</div></section>
      <section className="featured section-wrap"><div className="section-heading"><div><p className="eyebrow">Gathered with care</p><h2>Fresh from the shelves</h2></div><button className="text-link" onClick={() => setPage("shop")}>Shop all <span>→</span></button></div><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard product={product} key={product.id} addToCart={addToCart} updateQuantity={updateQuantity} quantity={cart.find((item) => item.id === product.id)?.quantity || 0} />)}</div></section>
      <section className="values"><div className="values-image"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85" alt="Modern interior with natural materials" /></div><div className="values-copy"><p className="eyebrow">Why Juniper</p><h2>Less, but better.</h2><p>We believe the best objects earn their place slowly. That’s why we look for honest materials, thoughtful makers, and designs that age with grace.</p><div className="value-list"><span>01 <b>Made to keep</b></span><span>02 <b>People over profit</b></span><span>03 <b>Lighter on the earth</b></span></div><button className="text-link" onClick={() => setPage("about")}>Meet our makers <span>→</span></button></div></section>
      <Newsletter />
    </>}

    {page === "shop" && <section className="shop-page section-wrap"><div className="page-intro"><p className="eyebrow">The collection</p><h1>Objects with a point of view.</h1><p>Useful, beautiful, and made for repeat use.</p></div><div className="catalogue-tools"><div className="categories">{["All", "Home", "Carry", "Desk"].map((category) => <button className={activeCategory === category ? "selected" : ""} onClick={() => setActiveCategory(category)} key={category}>{category}</button>)}</div><label className="search-field"><span>⌕</span><input id="product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" /></label></div><div className="results-line"><span>{filtered.length} pieces</span><span>Sort: <b>Featured</b>⌄</span></div><div className="product-grid all-products">{filtered.map((product) => <ProductCard product={product} key={product.id} addToCart={addToCart} updateQuantity={updateQuantity} quantity={cart.find((item) => item.id === product.id)?.quantity || 0} />)}</div>{filtered.length === 0 && <div className="empty-search"><strong>Nothing quite matches that.</strong><button onClick={() => { setSearch(""); setActiveCategory("All"); }}>See everything</button></div>}</section>}

    {page === "about" && <section className="about-page"><div className="about-hero"><div><p className="eyebrow">Our story</p><h1>For the spaces<br />in <i>between.</i></h1></div><p>Juniper started with a tiny question: what if the things surrounding us asked a little more of themselves?</p></div><img className="about-wide-image" src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85" alt="A calm contemporary room" /><div className="about-copy"><p className="eyebrow">A slower approach</p><h2>Good design doesn’t need to shout.</h2><p>We partner with independent studios and small-batch makers who treat every decision as an opportunity to do better. The result is a collection that is warm, useful and built to last beyond a season.</p><p>From the first sketch to the final parcel, we keep things considered: fewer materials, better working conditions, and no unnecessary extras.</p></div><section className="numbers"><div><strong>34</strong><span>Independent makers</span></div><div><strong>8</strong><span>Countries represented</span></div><div><strong>93%</strong><span>Plastic-free packaging</span></div></section><Newsletter /></section>}

    {page === "contact" && <section className="contact-page section-wrap"><div className="contact-intro"><p className="eyebrow">Get in touch</p><h1>We’d love to hear<br />from you.</h1><p>Questions about an order, a product, or simply want to say hello? Drop us a note.</p><div className="contact-details"><span><b>Email</b> hello@junipermarket.co</span><span><b>Studio</b> 84 Meadow Lane, Brooklyn, NY</span><span><b>Hours</b> Mon–Fri, 9am–5pm EST</span></div></div><form className="contact-form" onSubmit={(event) => { event.preventDefault(); setNotice("Thank you — we’ll be in touch shortly."); event.currentTarget.reset(); }}><label>Your name<input required placeholder="Alex Morgan" /></label><label>Email address<input type="email" required placeholder="alex@example.com" /></label><label>What can we help with?<select defaultValue=""><option value="" disabled>Select a topic</option><option>Order question</option><option>Product question</option><option>Press & partnerships</option><option>Something else</option></select></label><label>Message<textarea required placeholder="Tell us a little more..." rows={5} /></label><button className="primary-button">Send message <span>→</span></button></form></section>}

    {page === "tracking" && <section className="tracking-page section-wrap"><div className="tracking-heading"><div><p className="eyebrow">Your account</p><h1>Orders & tracking</h1><p>{account || "Sign in to see your orders."}</p></div>{account && <button className="text-link" onClick={() => { window.localStorage.removeItem("juniper-account"); setAccount(null); setPage("home"); }}>Sign out</button>}</div>{orders.length ? <div className="order-list">{orders.map((order) => <article className="tracked-order" key={order.id}><div className="order-top"><span>{order.id}</span><b>{order.status}</b></div><h2>Your order is confirmed.</h2><p>We’re preparing {order.items} {order.items === 1 ? "item" : "items"} with care. We’ll email {account} when it is on its way.</p><div className="tracking-steps"><span className="done">✓ Order placed</span><span>○ Preparing</span><span>○ On its way</span></div><div className="order-meta"><span>Placed {order.date}</span><strong>{money(order.total)}</strong></div></article>)}</div> : <div className="empty-orders"><span>⌁</span><h2>No orders yet.</h2><p>When your order is placed, its progress will appear here.</p><button className="primary-button" onClick={() => setPage("shop")}>Explore the shop <span>→</span></button></div>}</section>}

    <footer><div className="footer-main"><div><button className="wordmark" onClick={() => setPage("home")}>JUNIPER<span>MARKET</span></button><p>Useful things, beautifully made.</p></div><div><b>Explore</b><button onClick={() => setPage("shop")}>Shop</button><button onClick={() => setPage("about")}>Our story</button><button onClick={() => setPage("contact")}>Contact</button></div><div><b>Customer care</b><button onClick={() => account ? setPage("tracking") : setAuthOpen("login")}>Your account</button><button onClick={() => setPage("tracking")}>Order tracking</button><button onClick={() => setCartOpen(true)}>Payment & security</button></div><div className="footer-social"><b>Follow along</b><a href="#">Instagram ↗</a><a href="#">Pinterest ↗</a></div></div><div className="footer-bottom"><span>© 2025 Juniper Market</span><span>Privacy&nbsp;&nbsp; Terms&nbsp;&nbsp; Accessibility</span><span>Made with intention</span></div></footer>

    {cartOpen && <aside className="cart-drawer" aria-label="Shopping bag"><div className="drawer-overlay" onClick={() => setCartOpen(false)} /><div className="drawer"><div className="drawer-head"><h2>Your bag <small>({cartCount})</small></h2><button onClick={() => setCartOpen(false)}>×</button></div>{cart.length === 0 ? <div className="empty-bag"><span>✦</span><h3>Your bag is waiting.</h3><p>Bring home something considered.</p><button className="primary-button" onClick={() => { setCartOpen(false); setPage("shop"); }}>Explore the shop</button></div> : <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div><b>{item.name}</b><small>{item.note}</small><span>{money(item.price)}</span><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)}>−</button><em>{item.quantity}</em><button onClick={() => updateQuantity(item.id, 1)}>+</button></div></div><button className="remove" onClick={() => updateQuantity(item.id, -item.quantity)}>×</button></div>)}</div><div className="cart-footer"><p><span>Subtotal</span><b>{money(subtotal)}</b></p><small>Shipping and taxes calculated at checkout.</small><button className="primary-button full" onClick={requestCheckout}>{account ? "Secure checkout" : "Create account to checkout"} <span>→</span></button><div className="payment-icons">UPI&nbsp;&nbsp; Cards&nbsp;&nbsp; Netbanking&nbsp;&nbsp; Razorpay</div></div></>}</div></aside>}

    {checkout && <div className="modal-layer"><div className="checkout-modal"><button className="modal-close" onClick={() => setCheckout(false)}>×</button><p className="eyebrow">Secure checkout</p><h2>Your order, almost home.</h2><div className="checkout-total"><span>Total due today</span><b>{money(subtotal)}</b></div><form onSubmit={submitDemoPayment}><label>UPI ID or card number<input required placeholder="name@bank or 4111 1111 1111 1111" minLength={8} /></label><div className="input-row"><label>Expiry<input required placeholder="MM / YY" /></label><label>CVC<input required placeholder="123" inputMode="numeric" /></label></div><label>Email for your receipt<input required type="email" placeholder="you@example.com" /></label><button className="primary-button full">Pay {money(subtotal)} <span>→</span></button></form><p className="demo-note">Demo payment mode. Add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> to open Razorpay test checkout with UPI, cards, and netbanking.</p></div></div>}
    {authOpen && <div className="modal-layer"><div className="auth-modal"><button className="modal-close" onClick={() => setAuthOpen(null)}>×</button><p className="eyebrow">Welcome to Juniper</p><h2>{authOpen === "login" ? "Good to see you." : "Make yourself at home."}</h2>{checkoutAfterAuth && <p className="checkout-gate">Create an account to securely continue to payment. Your bag is saved.</p>}<form onSubmit={completeAuthentication}><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input type="password" required placeholder="••••••••" /></label>{authOpen === "signup" && <label className="check-label"><input type="checkbox" /> Send me thoughtful updates.</label>}<button className="primary-button full">{authOpen === "login" ? "Sign in & continue" : "Create account & continue"} <span>→</span></button></form><p>{authOpen === "login" ? <>New here? <button onClick={() => setAuthOpen("signup")}>Create an account</button></> : <>Already have an account? <button onClick={() => setAuthOpen("login")}>Sign in</button></>}</p></div></div>}
  </main>;
}

function ProductCard({ product, quantity, addToCart, updateQuantity }: { product: Product; quantity: number; addToCart: (product: Product) => void; updateQuantity: (id: number, delta: number) => void }) {
  const [celebrate, setCelebrate] = useState(false);
  function add() { addToCart(product); setCelebrate(true); window.setTimeout(() => setCelebrate(false), 850); }
  return <article className="product-card"><div className={`product-image ${product.tone}`}>{product.tag && <span className="product-tag">{product.tag}</span>}<img src={product.image} alt={product.name} />{quantity === 0 ? <button className="quick-add" onClick={add}>Add to bag <span>+</span></button> : <div className="quick-add quantity-add"><button onClick={() => updateQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}>−</button><span><i>✓</i> {quantity} in bag</span><button onClick={add} aria-label={`Add one ${product.name}`}>+</button></div>}{celebrate && <span className="add-success" aria-hidden="true">✓<i>✦</i><b>✦</b><em>✦</em></span>}</div><div className="product-info"><div><h3>{product.name}</h3><p>{product.note}</p></div><b>{money(product.price)}</b></div></article>;
}
function Newsletter() { const [sent, setSent] = useState(false); return <section className="newsletter"><div><p className="eyebrow">Letters from the field</p><h2>A little good news<br />in your inbox.</h2></div>{sent ? <div className="newsletter-sent">Thank you — you&apos;re on the list. ✦</div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}><input required type="email" placeholder="Your email address" aria-label="Email address" /><button aria-label="Subscribe">→</button><small>Occasional notes, new finds, and 10% off your first order.</small></form>}</section>; }
