import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, getProductById, formatMoney, FREE_SHIPPING_THRESHOLD } from "@/lib/products";
import { ProductDetailActions } from "./product-actions";
import "./product.css";

export function generateStaticParams() {
  return PRODUCTS.map(({ id }) => ({ id }));
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);
  if (!product) notFound();

  return (
    <main className="product-detail-page">
      <header className="product-page-header">
        <Link href="/" className="wordmark">
          JUNIPER<span>MARKET</span>
        </Link>
        <div className="detail-header-nav">
          <Link href="/" className="back-link">
            ← Back to shop
          </Link>
          <Link href="/?cart=open" className="bag-link">
            Bag ↗
          </Link>
        </div>
      </header>
      <section className="product-detail">
        <div className={`detail-image ${product.tone}`}>
          <img src={product.image} alt={product.name} />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.categoryDetail}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatMoney(product.price)}</p>
          <p className="detail-description">{product.description}</p>
          <div className="detail-line">
            <span>Details</span>
            <b>{product.note}</b>
          </div>
          <div className="detail-line">
            <span>Shipping</span>
            <b>Free on orders over {formatMoney(FREE_SHIPPING_THRESHOLD)}</b>
          </div>
          <ProductDetailActions product={product} />
        </div>
      </section>
    </main>
  );
}

