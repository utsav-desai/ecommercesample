import Link from "next/link";
import { notFound } from "next/navigation";
import "./product.css";

const products = [
  { id: "1", name: "Solace Throw", category: "Home / Textiles", price: "$88.00", note: "Merino blend · Oat", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85", description: "A soft, substantial throw for slow mornings and long evenings. Woven from a warm merino blend with a gentle, tactile finish." },
  { id: "2", name: "Dawn Vessel", category: "Home / Ceramics", price: "$42.00", note: "Hand-thrown stoneware", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1400&q=85", description: "A quietly sculptural vessel made by hand in small batches. It is just as lovely holding branches as it is standing on its own." },
  { id: "3", name: "Everyday Tote", category: "Carry / Bags", price: "$68.00", note: "Washed canvas · Clay", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85", description: "A generous, hardworking tote in washed cotton canvas. Built for market trips, weekday commutes, and everything in between." },
  { id: "4", name: "Morrow Journal", category: "Desk / Paper", price: "$24.00", note: "Italian paper · 192 pages", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1400&q=85", description: "A clear place to begin. Bound in cloth and filled with smooth Italian paper that welcomes every kind of thought." },
  { id: "5", name: "Common Ground Mug", category: "Home / Ceramics", price: "$28.00", note: "Speckled porcelain", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=85", description: "A familiar shape, made a little more special. Each porcelain mug is gently speckled and finished with a soft satin glaze." },
  { id: "6", name: "Field Notes Set", category: "Desk / Paper", price: "$18.00", note: "Set of three · Recycled", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1400&q=85", description: "Three pocket-sized notebooks for lists, sketches, and passing observations. Printed on recycled stock with a tactile uncoated cover." },
];

export function generateStaticParams() { return products.map(({ id }) => ({ id })); }

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find(({ id }) => id === params.id);
  if (!product) notFound();
  return <main className="product-detail-page">
    <header className="product-page-header"><Link href="/" className="wordmark">JUNIPER<span>MARKET</span></Link><Link href="/" className="back-link">← Back to shop</Link></header>
    <section className="product-detail"><div className="detail-image"><img src={product.image} alt={product.name} /></div><div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="detail-price">{product.price}</p><p className="detail-description">{product.description}</p><div className="detail-line"><span>Details</span><b>{product.note}</b></div><div className="detail-line"><span>Shipping</span><b>Free on orders over $75</b></div><Link className="primary-button detail-button" href="/?add-to-cart=1">Back to shop to add to bag <span>→</span></Link></div></section>
  </main>;
}
