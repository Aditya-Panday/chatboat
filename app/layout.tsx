import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Covers&All Chat Widget",
  description: "Embedded AI customer support widget for Covers&All.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full bg-transparent antialiased">
      <body className="h-full bg-transparent">{children}</body>
    </html>
  );
}
