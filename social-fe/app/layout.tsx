import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "@/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SocketProvider } from "@/providers/socket.provider";
import { AuthProvider } from "@/providers/auth.provider";
import BrowserTitle from "./components/browser-title";

export const metadata: Metadata = {
  title: {
    default: "Konekt",
    template: "%s | Konekt",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <AuthProvider>
            <Suspense fallback={null}>
              <BrowserTitle />
            </Suspense>
            <Toaster richColors position="top-center" />
            <TooltipProvider>
              <SocketProvider>{children}</SocketProvider>
            </TooltipProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
