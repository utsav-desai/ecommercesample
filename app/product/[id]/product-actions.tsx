"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/products";

export function ProductDetailActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    try {
      const saved = window.localStorage.getItem("juniper-cart");
      const currentCart = saved ? JSON.parse(saved) : [];
      const existingIndex = currentCart.findIndex(
        (item: { id: string | number }) => String(item.id) === String(product.id)
      );

      if (existingIndex > -1) {
        currentCart[existingIndex].quantity += quantity;
      } else {
        currentCart.push({ ...product, quantity });
      }

      window.localStorage.setItem("juniper-cart", JSON.stringify(currentCart));
      setAdded(true);
      setTimeout(() => setAdded(false), 3500);
    } catch (e) {
      console.error("Failed to add to bag:", e);
    }
  }

  return (
    <div className="product-actions-wrap">
      <div className="detail-qty-row">
        <div className="detail-qty">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="primary-button detail-button-add"
          onClick={handleAddToCart}
        >
          {added ? "Added to bag ✓" : "Add to bag"} <span>+</span>
        </button>
      </div>
      {added && (
        <div className="detail-added-notice">
          <span>✓ {product.name} added to your bag.</span>
          <Link href="/?cart=open">Open bag →</Link>
        </div>
      )}
    </div>
  );
}
