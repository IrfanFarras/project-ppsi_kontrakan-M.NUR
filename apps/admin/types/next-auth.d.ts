import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: string;
    accessToken: string;
  }

  interface Session {
    accessToken: string;
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    /** JWT dari backend Express (dipakai sebagai Bearer token). */
    accessToken: string;
    /** Waktu kedaluwarsa JWT backend, dalam ms epoch. */
    accessTokenExpires: number;
  }
}