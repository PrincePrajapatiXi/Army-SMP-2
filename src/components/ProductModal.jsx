import { X, ShoppingCart, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

const Modal = ({ isOpen, onClose, product }) => {
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setQuantity(1);
            setAddedToCart(false);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleIncrement = () => {
        setQuantity(prev => prev + 1);
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setAddedToCart(true);
        setTimeout(() => {
            setAddedToCart(false);
            onClose();
        }, 1000);
    };

    if (!isOpen || !product) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)',
            padding: '20px',
            boxSizing: 'border-box'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '420px',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'float 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{product.name}</h2>
                    <button onClick={onClose} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}><X /></button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'contain' }} />
                    </div>

                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5', fontSize: '0.9rem', textAlign: 'center' }}>
                        {product.description || "Unlock exclusive features with this package."}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{product.price}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-dark)', padding: '5px 10px', borderRadius: '8px' }}>
                            <button
                                onClick={handleDecrement}
                                style={{
                                    color: quantity > 1 ? 'white' : 'rgba(255,255,255,0.3)',
                                    fontSize: '1.2rem',
                                    padding: '5px 10px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: quantity > 1 ? 'pointer' : 'not-allowed'
                                }}
                            >-</button>
                            <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>{quantity}</span>
                            <button
                                onClick={handleIncrement}
                                style={{
                                    color: 'white',
                                    fontSize: '1.2rem',
                                    padding: '5px 10px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >+</button>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={handleAddToCart}
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            backgroundColor: addedToCart ? '#22c55e' : 'var(--primary)',
                            transition: 'all 0.3s ease',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        {addedToCart ? (
                            <>
                                <Check size={20} />
                                Added to Cart!
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={20} />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Modal;

