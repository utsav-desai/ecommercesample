import { NextResponse } from "next/server";
import { getStoredProducts, saveStoredProducts } from "@/lib/store-data";
import { Product } from "@/lib/products";

export async function GET() {
  try {
    const products = await getStoredProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const products = await getStoredProducts();

    if (action === "create") {
      const newProduct: Product = {
        id: String(Date.now()),
        name: body.name || "Untitled Product",
        category: body.category || "Home",
        categoryDetail: body.categoryDetail || `${body.category || "Home"} / Objects`,
        price: Number(body.price) || 999,
        note: body.note || "Handcrafted",
        description: body.description || "",
        image:
          body.image ||
          "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1400&q=85",
        tone: body.tone || "sand",
        tag: body.tag || undefined,
        stock: Number(body.stock ?? 10),
        status: body.status || "active",
      };

      const updated = [newProduct, ...products];
      await saveStoredProducts(updated);
      return NextResponse.json({ success: true, product: newProduct, products: updated });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      const index = products.findIndex((p) => String(p.id) === String(id));
      if (index === -1) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const updatedProduct: Product = {
        ...products[index],
        ...updates,
        price: updates.price !== undefined ? Number(updates.price) : products[index].price,
        stock: updates.stock !== undefined ? Number(updates.stock) : products[index].stock,
      };

      products[index] = updatedProduct;
      await saveStoredProducts(products);
      return NextResponse.json({ success: true, product: updatedProduct, products });
    }

    if (action === "delete") {
      const { id } = body;
      const updated = products.filter((p) => String(p.id) !== String(id));
      await saveStoredProducts(updated);
      return NextResponse.json({ success: true, products: updated });
    }

    if (action === "adjust_stock") {
      const { id, delta } = body;
      const index = products.findIndex((p) => String(p.id) === String(id));
      if (index === -1) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const currentStock = products[index].stock ?? 0;
      const newStock = Math.max(0, currentStock + Number(delta));
      products[index] = { ...products[index], stock: newStock };
      await saveStoredProducts(products);
      return NextResponse.json({ success: true, product: products[index], products });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error modifying products:", error);
    return NextResponse.json({ error: "Failed to update products" }, { status: 500 });
  }
}
