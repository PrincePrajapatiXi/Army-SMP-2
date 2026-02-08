import { useLocation, Link } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../hooks/useHaptics';
import './MobileNav.css';

/**
 * Mobile Bottom Navigation Bar
 * Shows on mobile devices for easy navigation
 */
const MobileNav = () => {
    const location = useLocation();
    const { cartItems } = useCart();
    const { isAuthenticated } = useAuth();

    const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/store', icon: ShoppingBag, label: 'Store' },
        { path: '/checkout', icon: ShoppingCart, label: 'Cart', badge: cartCount },
        { path: isAuthenticated ? '/profile' : '/login', icon: User, label: isAuthenticated ? 'Profile' : 'Login' }
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="mobile-nav">
            <div className="mobile-nav-container">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`mobile-nav-item ${active ? 'active' : ''}`}
                            onClick={() => triggerHaptic('light')}
                        >
                            <div className="mobile-nav-icon-wrapper">
                                <Icon
                                    size={22}
                                    className="mobile-nav-icon"
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                {item.badge > 0 && (
                                    <span className="mobile-nav-badge">{item.badge}</span>
                                )}
                                {active && <div className="mobile-nav-active-bg" />}
                            </div>
                            <span className="mobile-nav-label">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;

