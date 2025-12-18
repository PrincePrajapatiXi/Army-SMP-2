import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isCartOpen, setIsCartOpen] = React.useState(false);
    const location = useLocation();
    const { getCartCount } = useCart();

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const cartCount = getCartCount();

    return (
        <>
            <nav className="navbar">
                <div className="container nav-container">
                    <Link to="/" className="nav-logo">
                        <img src="/images/logo.png" alt="Army SMP 2" className="nav-logo-img" />
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
                            <a href="https://discord.gg/EBmGM2jsdt" className="nav-item">Discord</a>
                        </li>
                    </ul>

                    <div className="nav-actions">
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


