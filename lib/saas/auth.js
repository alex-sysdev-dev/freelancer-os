import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from './db';

export const authOptions = {
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
          const user = await findUserByEmail(credentials.email);
          if (!user) return null;
          const valid = await bcrypt.compare(credentials.password, user.PasswordHash);
          if (!valid) return null;
          return { id: user.id, name: user.Name, email: user.Email };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/saas/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
