import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/saas/login',
  },
});

export const config = {
  matcher: ['/saas/dashboard/:path*'],
};
