import { NextResponse } from "next/server";
import { getStoredOrders, saveStoredOrders, getStoredProducts, saveStoredProducts } from "@/lib/store-data";
import { Order } from "@/lib/products";

export async function GET() {
  try {
    const orders = await getStoredOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const orders = await getStoredOrders();

    if (action === "update_status") {
      const { id, status } = body;
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      orders[index] = { ...orders[index], status };
      await saveStoredOrders(orders);
      return NextResponse.json({ success: true, order: orders[index], orders });
    }

    if (action === "create") {
      const { order } = body;
      if (!order) {
        return NextResponse.json({ error: "Order payload required" }, { status: 400 });
      }

      const newOrder: Order = {
        id: order.id || `JM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        date:
          order.date ||
          new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date()),
        total: Number(order.total) || 0,
        items: Number(order.items) || (order.lineItems ? order.lineItems.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0) : 1),
        status: order.status || "Confirmed",
        customerEmail: order.customerEmail || "customer@example.com",
        customerName: order.customerName || "Customer",
        paymentMode: order.paymentMode || "Standard Checkout",
        lineItems: order.lineItems || [],
      };

      const updatedOrders = [newOrder, ...orders];
      await saveStoredOrders(updatedOrders);

      // Deduct stock for purchased items if available
      try {
        const products = await getStoredProducts();
        let changed = false;
        if (Array.isArray(order.lineItems)) {
          for (const item of order.lineItems) {
            const p = products.find((prod) => String(prod.id) === String(item.id));
            if (p && typeof p.stock === "number") {
              p.stock = Math.max(0, p.stock - (Number(item.quantity) || 1));
              changed = true;
            }
          }
        }
        if (changed) {
          await saveStoredProducts(products);
        }
      } catch (err) {
        console.error("Failed to decrement inventory:", err);
      }

      return NextResponse.json({ success: true, order: newOrder, orders: updatedOrders });
    }

    if (action === "create_test_order") {
      const products = await getStoredProducts();
      const sampleItem = products[Math.floor(Math.random() * products.length)] || products[0];
      const randomNames = ["Arjun Patel", "Deepa Nair", "Kabir Roy", "Sneha Kapoor", "Vikram Joshi"];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomEmail = `${randomName.toLowerCase().replace(" ", ".")}@example.com`;

      const testOrder: Order = {
        id: `JM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        date: new Intl.DateTimeFormat("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date()),
        total: sampleItem ? sampleItem.price : 2490,
        items: 1,
        status: "Confirmed",
        customerEmail: randomEmail,
        customerName: randomName,
        paymentMode: "UPI / Test",
        lineItems: sampleItem
          ? [
              {
                id: sampleItem.id,
                name: sampleItem.name,
                price: sampleItem.price,
                quantity: 1,
                image: sampleItem.image,
              },
            ]
          : [],
      };

      const updated = [testOrder, ...orders];
      await saveStoredOrders(updated);
      return NextResponse.json({ success: true, order: testOrder, orders: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing orders:", error);
    return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
  }
}
