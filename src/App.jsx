import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import PageLoader from './components/PageLoader';

// Lazy load pages for code splitting
// This reduces initial bundle size by loading pages only when needed
const Home = lazy(() => import('./pages/Home'));
const Store = lazy(() => import('./pages/Store'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Admin = lazy(() => import('./pages/Admin/index'));

// Layout wrapper to hide navbar/footer on admin page
function Layout({ children }) {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="app-container">
      {!isAdminPage && <Navbar />}
      <PageTransition>
        <main>
          {/* Suspense provides fallback UI while lazy components load */}
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </PageTransition>
      {!isAdminPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </CartProvider>
  );
}

export default App;
