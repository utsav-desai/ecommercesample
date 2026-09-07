"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = { id: number; name: string; category: string; price: number; note: string; image: string; tone: string; tag?: string };
type CartItem = Product & { quantity: number };

const products: Product[] = [
  { id: 1, name: "Solace Throw", category: "Home", price: 88, note: "Merino blend · Oat", tag: "Bestseller", tone: "cream", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Dawn Vessel", category: "Home", price: 42, note: "Hand-thrown stoneware", tone: "rose", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Everyday Tote", category: "Carry", price: 68, note: "Washed canvas · Clay", tag: "New", tone: "sand", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "Morrow Journal", category: "Desk", price: 24, note: "Italian paper · 192 pages", tone: "blue", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Common Ground Mug", category: "Home", price: 28, note: "Speckled porcelain", tone: "clay", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Field Notes Set", category: "Desk", price: 18, note: "Set of three · Recycled", tone: "green", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85" },
];

const money = (number: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(number);

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

  useEffect(() => { const saved = window.localStorage.getItem("juniper-cart"); if (saved) setCart(JSON.parse(saved)); }, []);
  useEffect(() => { window.localStorage.setItem("juniper-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("payment") === "success") { setOrderComplete(true); setCart([]); } }, []);

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
  async function startCheckout() {
    const response = await fetch("/api/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
    const data = await response.json();
    if (data.mode === "stripe" && data.url) window.location.href = data.url;
    else { setCartOpen(false); setCheckout(true); }
  }
  function submitDemoPayment(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setOrderComplete(true); setCheckout(false); setCart([]); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return <main>
    <div className="announcement">Complimentary shipping on orders over $75 <span>·</span> Made thoughtfully, sent lightly.</div>
    <header className="site-header">
      <button className="wordmark" onClick={() => setPage("home")} aria-label="Juniper Market home">JUNIPER<span>MARKET</span></button>
      <nav aria-label="Main navigation">
        {["home", "shop", "about", "contact"].map((item) => <button className={page === item ? "nav-active" : ""} onClick={() => { setPage(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} key={item}>{item === "home" ? "Home" : item === "shop" ? "Shop" : item === "about" ? "Our story" : "Contact"}</button>)}
      </nav>
      <div className="header-actions">
        <button className="icon-button search-trigger" onClick={() => { setPage("shop"); setTimeout(() => document.getElementById("product-search")?.focus(), 50); }} aria-label="Search">⌕</button>
        <button className="account-button" onClick={() => setAuthOpen("login")}>Account</button>
        <button className="bag-button" onClick={() => setCartOpen(true)} aria-label="Open shopping bag">Bag <em>{cartCount}</em></button>
      </div>
    </header>

    {notice && <div className="toast">✓ {notice}</div>}
    {orderComplete && <section className="order-confirmation"><span>Order confirmed</span><strong>Thank you for making room for something good.</strong><button onClick={() => setOrderComplete(false)}>Dismiss</button></section>}

    {page === "home" && <>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">The art of the everyday</p><h1>Well-made things<br />for a <i>well-lived</i> life.</h1><p className="hero-subtitle">A considered collection of useful objects, soft layers, and quiet pieces that make home feel more like yours.</p><button className="primary-button" onClick={() => setPage("shop")}>Shop the collection <span>→</span></button></div>
        <div className="hero-image"><div className="hero-stamp">EST.<br />2017</div><img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=90" alt="Sunlit, warmly furnished home" /></div>
      </section>
      <section className="category-band"><p>Find your new favorite</p><div>{[["Home", "01"], ["Carry", "02"], ["Desk", "03"]].map(([name, no]) => <button key={name} onClick={() => { setPage("shop"); setActiveCategory(name); }}><span>{no}</span>{name}<b>↗</b></button>)}</div></section>
      <section className="featured section-wrap"><div className="section-heading"><div><p className="eyebrow">Gathered with care</p><h2>Fresh from the shelves</h2></div><button className="text-link" onClick={() => setPage("shop")}>Shop all <span>→</span></button></div><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard product={product} key={product.id} addToCart={addToCart} />)}</div></section>
      <section className="values"><div className="values-image"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85" alt="Modern interior with natural materials" /></div><div className="values-copy"><p className="eyebrow">Why Juniper</p><h2>Less, but better.</h2><p>We believe the best objects earn their place slowly. That’s why we look for honest materials, thoughtful makers, and designs that age with grace.</p><div className="value-list"><span>01 <b>Made to keep</b></span><span>02 <b>People over profit</b></span><span>03 <b>Lighter on the earth</b></span></div><button className="text-link" onClick={() => setPage("about")}>Meet our makers <span>→</span></button></div></section>
      <Newsletter />
    </>}

    {page === "shop" && <section className="shop-page section-wrap"><div className="page-intro"><p className="eyebrow">The collection</p><h1>Objects with a point of view.</h1><p>Useful, beautiful, and made for repeat use.</p></div><div className="catalogue-tools"><div className="categories">{["All", "Home", "Carry", "Desk"].map((category) => <button className={activeCategory === category ? "selected" : ""} onClick={() => setActiveCategory(category)} key={category}>{category}</button>)}</div><label className="search-field"><span>⌕</span><input id="product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" /></label></div><div className="results-line"><span>{filtered.length} pieces</span><span>Sort: <b>Featured</b>⌄</span></div><div className="product-grid all-products">{filtered.map((product) => <ProductCard product={product} key={product.id} addToCart={addToCart} />)}</div>{filtered.length === 0 && <div className="empty-search"><strong>Nothing quite matches that.</strong><button onClick={() => { setSearch(""); setActiveCategory("All"); }}>See everything</button></div>}</section>}

    {page === "about" && <section className="about-page"><div className="about-hero"><div><p className="eyebrow">Our story</p><h1>For the spaces<br />in <i>between.</i></h1></div><p>Juniper started with a tiny question: what if the things surrounding us asked a little more of themselves?</p></div><img className="about-wide-image" src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85" alt="A calm contemporary room" /><div className="about-copy"><p className="eyebrow">A slower approach</p><h2>Good design doesn’t need to shout.</h2><p>We partner with independent studios and small-batch makers who treat every decision as an opportunity to do better. The result is a collection that is warm, useful and built to last beyond a season.</p><p>From the first sketch to the final parcel, we keep things considered: fewer materials, better working conditions, and no unnecessary extras.</p></div><section className="numbers"><div><strong>34</strong><span>Independent makers</span></div><div><strong>8</strong><span>Countries represented</span></div><div><strong>93%</strong><span>Plastic-free packaging</span></div></section><Newsletter /></section>}

    {page === "contact" && <section className="contact-page section-wrap"><div className="contact-intro"><p className="eyebrow">Get in touch</p><h1>We’d love to hear<br />from you.</h1><p>Questions about an order, a product, or simply want to say hello? Drop us a note.</p><div className="contact-details"><span><b>Email</b> hello@junipermarket.co</span><span><b>Studio</b> 84 Meadow Lane, Brooklyn, NY</span><span><b>Hours</b> Mon–Fri, 9am–5pm EST</span></div></div><form className="contact-form" onSubmit={(event) => { event.preventDefault(); setNotice("Thank you — we’ll be in touch shortly."); event.currentTarget.reset(); }}><label>Your name<input required placeholder="Alex Morgan" /></label><label>Email address<input type="email" required placeholder="alex@example.com" /></label><label>What can we help with?<select defaultValue=""><option value="" disabled>Select a topic</option><option>Order question</option><option>Product question</option><option>Press & partnerships</option><option>Something else</option></select></label><label>Message<textarea required placeholder="Tell us a little more..." rows={5} /></label><button className="primary-button">Send message <span>→</span></button></form></section>}

    <footer><div className="footer-main"><div><button className="wordmark" onClick={() => setPage("home")}>JUNIPER<span>MARKET</span></button><p>Useful things, beautifully made.</p></div><div><b>Explore</b><button onClick={() => setPage("shop")}>Shop</button><button onClick={() => setPage("about")}>Our story</button><button onClick={() => setPage("contact")}>Contact</button></div><div><b>Customer care</b><button onClick={() => setAuthOpen("login")}>Your account</button><button onClick={() => setCartOpen(true)}>Shipping & returns</button><button onClick={() => setCartOpen(true)}>Payment & security</button></div><div className="footer-social"><b>Follow along</b><a href="#">Instagram ↗</a><a href="#">Pinterest ↗</a></div></div><div className="footer-bottom"><span>© 2025 Juniper Market</span><span>Privacy&nbsp;&nbsp; Terms&nbsp;&nbsp; Accessibility</span><span>Made with intention</span></div></footer>

    {cartOpen && <aside className="cart-drawer" aria-label="Shopping bag"><div className="drawer-overlay" onClick={() => setCartOpen(false)} /><div className="drawer"><div className="drawer-head"><h2>Your bag <small>({cartCount})</small></h2><button onClick={() => setCartOpen(false)}>×</button></div>{cart.length === 0 ? <div className="empty-bag"><span>✦</span><h3>Your bag is waiting.</h3><p>Bring home something considered.</p><button className="primary-button" onClick={() => { setCartOpen(false); setPage("shop"); }}>Explore the shop</button></div> : <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div><b>{item.name}</b><small>{item.note}</small><span>{money(item.price)}</span><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)}>−</button><em>{item.quantity}</em><button onClick={() => updateQuantity(item.id, 1)}>+</button></div></div><button className="remove" onClick={() => updateQuantity(item.id, -item.quantity)}>×</button></div>)}</div><div className="cart-footer"><p><span>Subtotal</span><b>{money(subtotal)}</b></p><small>Shipping and taxes calculated at checkout.</small><button className="primary-button full" onClick={startCheckout}>Secure checkout <span>→</span></button><div className="payment-icons">⌁ Visa&nbsp;&nbsp; Mastercard&nbsp;&nbsp; Amex&nbsp;&nbsp; Stripe</div></div></>}</div></aside>}

    {checkout && <div className="modal-layer"><div className="checkout-modal"><button className="modal-close" onClick={() => setCheckout(false)}>×</button><p className="eyebrow">Secure checkout</p><h2>Your order, almost home.</h2><div className="checkout-total"><span>Total due today</span><b>{money(subtotal)}</b></div><form onSubmit={submitDemoPayment}><label>Card number<input required inputMode="numeric" placeholder="4242 4242 4242 4242" minLength={12} /></label><div className="input-row"><label>Expiry<input required placeholder="MM / YY" /></label><label>CVC<input required placeholder="123" inputMode="numeric" /></label></div><label>Email for your receipt<input required type="email" placeholder="you@example.com" /></label><button className="primary-button full">Pay {money(subtotal)} <span>→</span></button></form><p className="demo-note">Demo payment mode. Add <code>STRIPE_SECRET_KEY</code> to use Stripe&apos;s hosted test checkout.</p></div></div>}
    {authOpen && <div className="modal-layer"><div className="auth-modal"><button className="modal-close" onClick={() => setAuthOpen(null)}>×</button><p className="eyebrow">Welcome to Juniper</p><h2>{authOpen === "login" ? "Good to see you." : "Make yourself at home."}</h2><form onSubmit={(event) => { event.preventDefault(); setAuthOpen(null); setNotice(authOpen === "login" ? "Welcome back." : "Your account is ready."); }}><label>Email address<input type="email" required placeholder="you@example.com" /></label><label>Password<input type="password" required placeholder="••••••••" /></label>{authOpen === "signup" && <label className="check-label"><input type="checkbox" /> Send me thoughtful updates.</label>}<button className="primary-button full">{authOpen === "login" ? "Sign in" : "Create account"} <span>→</span></button></form><p>{authOpen === "login" ? <>New here? <button onClick={() => setAuthOpen("signup")}>Create an account</button></> : <>Already have an account? <button onClick={() => setAuthOpen("login")}>Sign in</button></>}</p></div></div>}
  </main>;
}

function ProductCard({ product, addToCart }: { product: Product; addToCart: (product: Product) => void }) { return <article className="product-card"><div className={`product-image ${product.tone}`}>{product.tag && <span className="product-tag">{product.tag}</span>}<img src={product.image} alt={product.name} /><button className="quick-add" onClick={() => addToCart(product)}>Add to bag <span>+</span></button></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.note}</p></div><b>{money(product.price)}</b></div></article>; }
function Newsletter() { const [sent, setSent] = useState(false); return <section className="newsletter"><div><p className="eyebrow">Letters from the field</p><h2>A little good news<br />in your inbox.</h2></div>{sent ? <div className="newsletter-sent">Thank you — you&apos;re on the list. ✦</div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}><input required type="email" placeholder="Your email address" aria-label="Email address" /><button aria-label="Subscribe">→</button><small>Occasional notes, new finds, and 10% off your first order.</small></form>}</section>; }
