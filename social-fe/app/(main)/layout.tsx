import type { ReactNode } from "react";
import MainLayoutClient from "./main-layout-client";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
