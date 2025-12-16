import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const location = useLocation();

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    Army<span className="text-accent">SMP</span>
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
                    <button className="cart-btn">
                        <ShoppingCart size={24} />
                        <span className="cart-count">0</span>
                    </button>

                    <div className="mobile-toggle" onClick={toggleMenu}>
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
