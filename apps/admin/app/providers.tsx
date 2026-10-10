"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Tidak refetch session tiap kali tab difokuskan ulang (mengurangi request berulang)
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
