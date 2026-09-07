import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juniper Market | Better everyday goods",
  description: "A considered collection of products for slower, brighter living.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
