import React, { useState, useEffect } from 'react';
import { products as staticProducts } from '../data/products';
import { productsApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import './Store.css';

const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'ranks', label: 'Ranks' },
    { id: 'keys', label: 'Keys' },
    { id: 'crates', label: 'Crates' },
    { id: 'coins', label: 'Coins' }
];

const Store = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);

    // Fetch products from API with fallback to static data
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await productsApi.getAll(activeCategory);
                setProducts(data);
                setUsingFallback(false);
            } catch (err) {
                console.log('API not available, using static products');
                // Fallback to static products
                let fallbackProducts = staticProducts;
                if (activeCategory && activeCategory !== 'all') {
                    fallbackProducts = staticProducts.filter(p => p.category === activeCategory);
                }
                setProducts(fallbackProducts);
                setUsingFallback(true);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [activeCategory]);

    return (
        <div className="page-content" style={{ marginTop: '80px', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="container">

                {/* Header */}
                <div className="store-header">
                    <h1 className="store-title">Store</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Enhance your experience with exclusive items.</p>
                </div>

                {/* Categories */}
                <div className="category-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={activeCategory === cat.id ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ minWidth: '100px', flexShrink: 0, justifyContent: 'center' }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <div className="loading-spinner"></div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading products...</p>
                    </div>
                )}

                {/* Product Grid */}
                {!loading && (
                    <div className="store-grid">
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onBuy={setSelectedProduct}
                            />
                        ))}
                    </div>
                )}

                {!loading && products.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        No products found in this category.
                    </div>
                )}

            </div>

            <ProductModal
                isOpen={!!selectedProduct}
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
};

export default Store;
