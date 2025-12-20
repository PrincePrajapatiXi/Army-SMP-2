import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { products as staticProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import './Store.css';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'ranks', label: 'Ranks' },
    { id: 'keys', label: 'Keys' },
    { id: 'crates', label: 'Crates' },
    { id: 'coins', label: 'Coins' }
];

const sortOptions = [
    { id: 'default', label: 'Default' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'name-az', label: 'Name: A to Z' },
    { id: 'name-za', label: 'Name: Z to A' }
];

const Store = () => {
    const [products, setProducts] = useState(staticProducts);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('default');

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/products`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setProducts(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                // Fallback to static products is already initial state
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Category filter
        if (activeCategory !== 'all') {
            filtered = filtered.filter(p => p.category === activeCategory);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query)
            );
        }

        // Sorting
        const sorted = [...filtered];
        switch (sortBy) {
            case 'price-low':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'name-az':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-za':
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                break;
        }

        return sorted;
    }, [products, activeCategory, searchQuery, sortBy]);

    return (
        <div className="page-content" style={{ marginTop: '80px', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="container">

                {/* Header */}
                <div className="store-header">
                    <h1 className="store-title">Store</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Enhance your experience with exclusive items.</p>
                </div>

                {/* Search & Sort Bar */}
                <div className="search-sort-bar">
                    <div className="search-box">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="sort-box">
                        <SlidersHorizontal size={18} className="sort-icon" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
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

                {/* Results Count */}
                {searchQuery && (
                    <div className="search-results-info">
                        Found <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
                        {searchQuery && <span> for "<strong>{searchQuery}</strong>"</span>}
                    </div>
                )}

                {/* Product Grid */}
                {loading ? (
                    <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                        <Loader2 className="spinning" size={48} color="var(--primary)" />
                    </div>
                ) : (
                    <>
                        <div className="store-grid">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onBuy={setSelectedProduct}
                                />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="no-products">
                                <div className="no-products-icon">🔍</div>
                                <h3>No products found</h3>
                                <p>Try adjusting your search or filter criteria</p>
                                {searchQuery && (
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        )}
                    </>
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

