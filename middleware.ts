import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const token = req.nextauth.token;
      
      // Allow access to login page
      if (req.nextUrl.pathname === '/admin/login') {
        return NextResponse.next();
      }
      
      // Check if user is authenticated and has admin role
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public routes
        if (!req.nextUrl.pathname.startsWith('/admin')) {
          return true;
        }
        
        // Allow login page
        if (req.nextUrl.pathname === '/admin/login') {
          return true;
        }
        
        // Check if user is authenticated
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: ['/admin/:path*']
};
