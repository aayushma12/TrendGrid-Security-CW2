import type { Metadata } from "next";
import "@/styles/admin.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: {
    default: "Admin Console",
    template: "%s · TrendGrid Admin",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider scope="admin">
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
