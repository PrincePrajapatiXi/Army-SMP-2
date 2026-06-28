import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/ui/ThemeToggle';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PageTransition from './components/ui/PageTransition';
import PageLoader from './components/ui/PageLoader';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import NetworkStatus from './components/features/NetworkStatus';
import BackToTop from './components/ui/BackToTop';
import MobileNav from './components/layout/MobileNav';
import StructuredData from './components/utils/StructuredData';
import CookieConsent from './components/features/CookieConsent';
import PWAInstallPrompt from './components/features/PWAInstallPrompt';
import useGestureNavigation from './hooks/useGestureNavigation';
import RecentPurchaseNotification from './components/features/RecentPurchaseNotification';

// Lazy load pages for code splitting
// This reduces initial bundle size by loading pages only when needed
const Home = lazy(() => import('./pages/Home'));
const Store = lazy(() => import('./pages/Store'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Admin = lazy(() => import('./pages/Admin/index'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

// Auth pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

// Policy pages
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const ContactUs = lazy(() => import('./pages/ContactUs'));

// Layout wrapper to hide navbar/footer on admin and auth pages
function Layout({ children }) {
  const location = useLocation();
  const adminPath = import.meta.env.VITE_ADMIN_PATH || '/admin-fallback-xyz';
  const isAdminPage = location.pathname === adminPath;
  const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/oauth-callback'].includes(location.pathname);
  const isPolicyPage = ['/terms-and-conditions', '/privacy-policy', '/refund-policy', '/contact-us'].includes(location.pathname);
  const is404Page = !['/', '/store', '/checkout', '/orders', adminPath, '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/profile', '/oauth-callback', '/wishlist', ...['/terms-and-conditions', '/privacy-policy', '/refund-policy', '/contact-us']].includes(location.pathname);

  // Enable gesture navigation for native app-like experience
  useGestureNavigation({
    enabled: !isAdminPage && !isAuthPage,
    excludePaths: ['/']
  });

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

      {/* PWA Install Prompt */}
      {!isAdminPage && <PWAInstallPrompt />}

      {/* Cookie Consent Banner */}
      <CookieConsent />

      {/* FOMO Notifications */}
      {!isAdminPage && !isAuthPage && <RecentPurchaseNotification />}
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
              <WishlistProvider>
                <Router>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/store" element={<Store />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/orders" element={<OrderHistory />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path={import.meta.env.VITE_ADMIN_PATH || '/admin-fallback-xyz'} element={<Admin />} />

                      {/* Auth Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/oauth-callback" element={<OAuthCallback />} />

                      {/* Policy Routes */}
                      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/refund-policy" element={<RefundPolicy />} />
                      <Route path="/contact-us" element={<ContactUs />} />

                      {/* 404 Not Found - Catch all route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </Router>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

