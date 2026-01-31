import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import SEO from '../components/SEO';
import './Wishlist.css';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const handleAddToCart = async (item) => {
        const success = await addToCart(item, 1);
        if (success) {
            showToast(`${item.name} added to cart!`, 'success');
            removeFromWishlist(item.id);
        }
    };

    const handleRemove = (item) => {
        removeFromWishlist(item.id);
        showToast(`${item.name} removed from wishlist`, 'info');
    };

    const handleMoveAllToCart = async () => {
        for (const item of wishlistItems) {
            await addToCart(item, 1);
        }
        clearWishlist();
        showToast('All items moved to cart!', 'success');
    };

    return (
        <>
            <SEO
                title="My Wishlist - Army SMP 2"
                description="Your saved items from Army SMP 2 store"
            />

            <div className="wishlist-page">
                <div className="container">
                    {/* Header */}
                    <div className="wishlist-header">
                        <Link to="/store" className="back-link">
                            <ArrowLeft size={20} />
                            <span>Back to Store</span>
                        </Link>

                        <div className="header-content">
                            <div className="header-icon">
                                <Heart size={32} fill="#ff4757" stroke="#ff4757" />
                            </div>
                            <h1>My Wishlist</h1>
                            <p>{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved</p>
                        </div>

                        {wishlistItems.length > 0 && (
                            <div className="header-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleMoveAllToCart}
                                >
                                    <ShoppingCart size={18} />
                                    Move All to Cart
                                </button>
                                <button
                                    className="btn btn-outline clear-btn"
                                    onClick={clearWishlist}
                                >
                                    <Trash2 size={18} />
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Wishlist Items */}
                    {wishlistItems.length > 0 ? (
                        <div className="wishlist-grid">
                            {wishlistItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="wishlist-card"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="card-image">
                                        <img src={item.image} alt={item.name} />
                                    </div>

                                    <div className="card-info">
                                        <h3 className="card-name">{item.name}</h3>
                                        <span className="card-category">{item.category}</span>
                                        <span className="card-price">
                                            {item.priceDisplay || `₹${item.price}`}
                                        </span>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="btn btn-primary add-cart-btn"
                                            onClick={() => handleAddToCart(item)}
                                        >
                                            <ShoppingCart size={16} />
                                            Add to Cart
                                        </button>
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemove(item)}
                                            aria-label="Remove from wishlist"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-wishlist">
                            <div className="empty-icon">
                                <Heart size={80} />
                            </div>
                            <h2>Your wishlist is empty</h2>
                            <p>Save items you like by clicking the heart icon on products</p>
                            <Link to="/store" className="btn btn-primary">
                                Browse Store
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Wishlist;
