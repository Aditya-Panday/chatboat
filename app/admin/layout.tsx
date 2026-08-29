import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin Login | Covers&All",
  description: "Sign in to the Covers&All chat admin console.",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
