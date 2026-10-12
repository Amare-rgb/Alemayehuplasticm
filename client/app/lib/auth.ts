// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// ============================================================
// Types
// ============================================================
type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string | null;
  role: string;
  avatar: string | null;
  phone: string | null;
};

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

// Prisma typing for the user model (no sellerProfile)
type PrismaClientWithUser = {
  user: {
    findUnique: (args: {
      where: { email: string };
    }) => Promise<unknown>;
  };
};

// ============================================================
// NextAuth options
// ============================================================
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('🔍 === LOGIN ATTEMPT ===');
          console.log('📧 Email:', credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials');
            return null;
          }

          const prismaClient = prisma as unknown as PrismaClientWithUser;

          const user = (await prismaClient.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          })) as UserRecord | null;

          if (!user) {
            console.log('❌ User not found:', credentials.email);
            return null;
          }

          console.log('✅ User found:', user.email);
          console.log('📝 Role:', user.role);

          if (!user.password) {
            console.log('❌ User has no password set (OAuth user)');
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
          console.log('🔐 Password match:', passwordMatch);

          if (!passwordMatch) {
            console.log('❌ Password mismatch for:', credentials.email);
            return null;
          }

          console.log('✅ Login successful for:', credentials.email);

          const nextAuthUser: NextAuthUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar ?? undefined,
            phone: user.phone,
          };

          return nextAuthUser;
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ✅ Only populate token fields on initial sign-in
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

        // ✅ Core fields
        session.user.id = tokenData.id as string;
        session.user.role = tokenData.role as string;
        session.user.email = tokenData.email as string;
        session.user.name = tokenData.name as string;

        // ✅ Extended fields
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

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret:
    process.env.NEXTAUTH_SECRET ||
    'alemayehu-plastic-nextauth-secret-Z7yX5wV3uT1sR9qP8oN6mK4jH2gF0dS',

  debug: process.env.NODE_ENV === 'development',
};