// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

type NextAuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  phone?: string | null;
};

type CustomToken = {
  id?: string;
  role?: string;
  email?: string;
  name?: string;
  phone?: string | null;
};

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
  throw new Error('❌ NEXTAUTH_SECRET missing or too short (min 32 chars)');
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email.trim().toLowerCase(),
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          if (!data?.success || !data?.user) return null;

          const user: NextAuthUser = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: String(data.user.role || 'USER').toUpperCase(),
            image: data.user.avatar ?? undefined,
            phone: data.user.phone ?? null,
          };

          return user;
        } catch (error) {
          console.error('❌ NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userData = user as NextAuthUser;
        token.role = userData.role;
        token.id = userData.id;
        token.email = userData.email;
        token.name = userData.name;
        token.phone = userData.phone;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        const tokenData = token as CustomToken;
        session.user.id = tokenData.id as string;
        session.user.role = tokenData.role as string;
        session.user.email = tokenData.email as string;
        session.user.name = tokenData.name as string;

        const extendedSession = session.user as {
          id: string;
          role: string;
          email: string;
          name: string;
          phone?: string | null;
        };
        extendedSession.phone = tokenData.phone ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/signin',
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};