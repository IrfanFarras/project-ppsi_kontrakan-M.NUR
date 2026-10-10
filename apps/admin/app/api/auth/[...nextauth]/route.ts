import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE_URL } from "@rental/api-client";

interface BackendLoginResponse {
  data: {
    user: { id: number; name: string; email: string; role: string };
    token: string;
  };
}

/** Baca `exp` (detik) dari JWT backend -> ms epoch. 0 jika tidak terbaca. */
function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const { data } = (await res.json()) as BackendLoginResponse;

          // Panel admin hanya untuk OWNER.
          if (data.user.role !== "OWNER") return null;

          return {
            id: String(data.user.id),
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            accessToken: data.token,
          };
        } catch (err) {
          console.error("Login ke backend gagal:", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // `user` hanya ada saat sign-in pertama
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.accessTokenExpires = getTokenExpiry(user.accessToken);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
