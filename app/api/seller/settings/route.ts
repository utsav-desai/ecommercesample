import { NextResponse } from "next/server";
import {
  getStoreSettings,
  saveStoreSettings,
  resetCatalogToDefaults,
} from "@/lib/store-data";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to fetch store settings:", error);
    return NextResponse.json({ error: "Failed to fetch store settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "reset_defaults") {
      const result = await resetCatalogToDefaults();
      return NextResponse.json({ success: true, ...result });
    }

    const { action, ...updates } = body;
    const updated = await saveStoreSettings(updates);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Failed to save store settings:", error);
    return NextResponse.json({ error: "Failed to save store settings" }, { status: 500 });
  }
}
