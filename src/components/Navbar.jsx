import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogIn, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartDrawer from './CartDrawer';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { getCartCount } = useCart();
    const { user, isAuthenticated, logout } = useAuth();
    const userMenuRef = useRef(null);

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const cartCount = getCartCount();

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        await logout();
        navigate('/');
    };

    return (
        <>
            <nav className="navbar">
                <div className="container nav-container">
                    <Link to="/" className="nav-logo">
                        <img src="/images/Army logo.jpg" alt="Army SMP 2" className="nav-logo-img" />
                    </Link>

                    {/* Desktop Menu */}
                    <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
                        <li>
                            <Link to="/" className={`nav-item ${isActive('/')}`} onClick={() => setIsOpen(false)}>
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/store" className={`nav-item ${isActive('/store')}`} onClick={() => setIsOpen(false)}>
                                Store
                            </Link>
                        </li>
                        <li>
                            <Link to="/orders" className={`nav-item ${isActive('/orders')}`} onClick={() => setIsOpen(false)}>
                                My Orders
                            </Link>
                        </li>
                        <li>
                            <a href="https://discord.gg/EBmGM2jsdt" className="nav-item">Discord</a>
                        </li>

                        {/* Mobile Auth Links */}
                        {isOpen && (
                            <>
                                {isAuthenticated ? (
                                    <>
                                        <li className="mobile-only">
                                            <Link to="/profile" className={`nav-item ${isActive('/profile')}`} onClick={() => setIsOpen(false)}>
                                                <User size={16} style={{ marginRight: '0.5rem' }} />
                                                Profile
                                            </Link>
                                        </li>
                                        <li className="mobile-only">
                                            <button className="nav-item logout-mobile" onClick={() => { setIsOpen(false); handleLogout(); }}>
                                                <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                                                Logout
                                            </button>
                                        </li>
                                    </>
                                ) : (
                                    <li className="mobile-only">
                                        <Link to="/login" className="nav-item login-mobile" onClick={() => setIsOpen(false)}>
                                            <LogIn size={16} style={{ marginRight: '0.5rem' }} />
                                            Login
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>

                    <div className="nav-actions">
                        {/* User Account Button/Menu */}
                        {isAuthenticated ? (
                            <div className="user-menu-container" ref={userMenuRef}>
                                <button
                                    className="user-btn"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                >
                                    <div className="user-avatar">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} />
                                        ) : (
                                            <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <span className="user-name">{user?.name?.split(' ')[0]}</span>
                                    <ChevronDown size={16} className={`chevron ${isUserMenuOpen ? 'open' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-header">
                                            <p className="dropdown-name">{user?.name}</p>
                                            <p className="dropdown-email">{user?.email}</p>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/profile" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                                            <User size={16} />
                                            Profile
                                        </Link>
                                        <Link to="/orders" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                                            <Settings size={16} />
                                            My Orders
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item logout" onClick={handleLogout}>
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="login-btn desktop-only">
                                <LogIn size={18} />
                                <span>Login</span>
                            </Link>
                        )}

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        <button
                            className="cart-btn"
                            style={{ position: 'relative' }}
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart size={24} />
                            <span className="cart-count" style={{
                                display: cartCount > 0 ? 'flex' : 'none',
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: cartCount > 0 ? 'pulse 0.3s ease' : 'none'
                            }}>{cartCount}</span>
                        </button>

                        <div className="mobile-toggle" onClick={toggleMenu}>
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </div>
                    </div>
                </div>
            </nav>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default Navbar;
