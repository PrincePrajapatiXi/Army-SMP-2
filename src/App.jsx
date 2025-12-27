import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import PageLoader from './components/PageLoader';
import { ToastProvider } from './components/Toast';

// Lazy load pages for code splitting
// This reduces initial bundle size by loading pages only when needed
const Home = lazy(() => import('./pages/Home'));
const Store = lazy(() => import('./pages/Store'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Admin = lazy(() => import('./pages/Admin/index'));

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

  return (
    <div className="app-container">
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
    </div>
  );
}

function App() {
  return (
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
              </Routes>
            </Layout>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
