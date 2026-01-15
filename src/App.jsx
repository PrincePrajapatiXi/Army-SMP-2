import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/ThemeToggle';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import PageLoader from './components/PageLoader';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';
import BackToTop from './components/BackToTop';
import MobileNav from './components/MobileNav';
import StructuredData from './components/StructuredData';
import CookieConsent from './components/CookieConsent';

// Lazy load pages for code splitting
// This reduces initial bundle size by loading pages only when needed
const Home = lazy(() => import('./pages/Home'));
const Store = lazy(() => import('./pages/Store'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Admin = lazy(() => import('./pages/Admin/index'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Auth pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

// Layout wrapper to hide navbar/footer on admin and auth pages
function Layout({ children }) {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/oauth-callback'].includes(location.pathname);
  const is404Page = !['/', '/store', '/checkout', '/orders', '/admin', '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/profile', '/oauth-callback'].includes(location.pathname);

  return (
    <div className="app-container">
      {/* Global SEO Structured Data */}
      <StructuredData type="organization" />
      <StructuredData type="website" />

      {/* Network Status Indicator */}
      <NetworkStatus />

      {!isAdminPage && !isAuthPage && <Navbar />}
      <PageTransition>
        <main>
          {/* Suspense provides fallback UI while lazy components load */}
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </PageTransition>
      {!isAdminPage && !isAuthPage && <Footer />}

      {/* Back to Top Button */}
      {!isAdminPage && <BackToTop />}

      {/* Mobile Navigation */}
      {!isAdminPage && !isAuthPage && !is404Page && <MobileNav />}

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/store" element={<Store />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="/admin" element={<Admin />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/oauth-callback" element={<OAuthCallback />} />

                    {/* 404 Not Found - Catch all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </Router>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
