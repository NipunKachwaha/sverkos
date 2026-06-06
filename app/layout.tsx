// app/layout.tsx
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar"; // We will create this next
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}