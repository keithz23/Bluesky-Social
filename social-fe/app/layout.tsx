import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SocketProvider } from "@/providers/socket.provider";
import { AuthProvider } from "@/providers/auth.provider";

export const metadata: Metadata = {
  title: "Konekt",
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
