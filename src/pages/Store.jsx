import React, { useState, useMemo, useEffect, useRef, useCallback, useContext } from 'react';
import { Search, TrendingUp, Clock, Tag, Menu, X } from 'lucide-react';
import { products as staticProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { SkeletonGrid } from '../components/SkeletonCard';
import { AuthContext } from '../context/AuthContext';
import SEO from '../components/SEO';
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

// Popular search suggestions
const popularSearches = ['Beacon', 'Bedrock', 'Keys', 'Coins', 'Stone'];

const Store = () => {
    const [products, setProducts] = useState(staticProducts);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Auto-suggestions state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState([]);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Get user for personalized recommendations
    const { user } = useContext(AuthContext) || {};

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Save search to recent searches
    const saveRecentSearch = useCallback((query) => {
        if (!query.trim()) return;
        const updated = [query, ...recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase())].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    }, [recentSearches]);

    // Generate suggestions based on query
    const suggestions = useMemo(() => {
        if (!searchQuery.trim()) {
            // Show recent searches and popular when empty
            return {
                recent: recentSearches.slice(0, 3),
                popular: popularSearches.slice(0, 4),
                products: []
            };
        }

        const query = searchQuery.toLowerCase().trim();

        // Find matching products
        const matchingProducts = products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query)
        ).slice(0, 5);

        // Find matching categories
        const matchingCategories = categories.filter(c =>
            c.label.toLowerCase().includes(query) && c.id !== 'all'
        );

        return {
            recent: [],
            popular: [],
            products: matchingProducts,
            categories: matchingCategories
        };
    }, [searchQuery, products, recentSearches]);

    // Get all suggestion items for keyboard navigation
    const allSuggestionItems = useMemo(() => {
        const items = [];

        if (!searchQuery.trim()) {
            suggestions.recent.forEach(s => items.push({ type: 'recent', value: s }));
            suggestions.popular.forEach(s => items.push({ type: 'popular', value: s }));
        } else {
            suggestions.categories?.forEach(c => items.push({ type: 'category', value: c.label, id: c.id }));
            suggestions.products.forEach(p => items.push({ type: 'product', value: p.name, product: p }));
        }

        return items;
    }, [suggestions, searchQuery]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < allSuggestionItems.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : allSuggestionItems.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && allSuggestionItems[highlightedIndex]) {
                    handleSuggestionClick(allSuggestionItems[highlightedIndex]);
                } else if (searchQuery.trim()) {
                    saveRecentSearch(searchQuery);
                    setShowSuggestions(false);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                inputRef.current?.blur();
                break;
            default:
                break;
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (item) => {
        if (item.type === 'category') {
            setActiveCategory(item.id);
            setSearchQuery('');
        } else if (item.type === 'product') {
            setSelectedProduct(item.product);
            setSearchQuery('');
        } else {
            setSearchQuery(item.value);
            saveRecentSearch(item.value);
        }
        setShowSuggestions(false);
        setHighlightedIndex(-1);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setHighlightedIndex(-1);
        setShowSuggestions(true);
    };

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

    // Filter products
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

        return filtered;
    }, [products, activeCategory, searchQuery]);

    // Highlight matching text
    const highlightMatch = (text, query) => {
        if (!query.trim()) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className="suggestion-highlight">{part}</mark>
                : part
        );
    };

    return (
        <>
            <SEO
                title="Store"
                description="Shop premium Minecraft ranks, kits, keys, crates and coins at Army SMP 2. Secure UPI payments with instant delivery."
                keywords="Minecraft store, ranks, kits, keys, crates, coins, Army SMP 2"
                url="/store"
            />
            <div className="page-content" style={{ marginTop: '80px', minHeight: '100vh', paddingBottom: '4rem' }}>
                <div className="container">

                    {/* Header */}
                    <div className="store-header">
                        <h1 className="store-title">Store</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Enhance your experience with exclusive items.</p>
                    </div>

                    {/* Search & Sort Bar */}
                    <div className="search-sort-bar">
                        <div className="search-box" ref={searchRef}>
                            <Search size={20} className="search-icon" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={handleKeyDown}
                                className="search-input"
                                autoComplete="off"
                            />
                            {searchQuery && (
                                <button
                                    className="search-clear"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                    }}
                                >
                                    ✕
                                </button>
                            )}

                            {/* Auto-suggestions Dropdown */}
                            {showSuggestions && (
                                <div className="search-suggestions">
                                    {/* Recent Searches */}
                                    {!searchQuery.trim() && suggestions.recent.length > 0 && (
                                        <div className="suggestion-group">
                                            <div className="suggestion-group-header">
                                                <Clock size={14} />
                                                <span>Recent Searches</span>
                                            </div>
                                            {suggestions.recent.map((item, index) => (
                                                <div
                                                    key={`recent-${index}`}
                                                    className={`suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
                                                    onClick={() => handleSuggestionClick({ type: 'recent', value: item })}
                                                >
                                                    <Clock size={14} className="suggestion-item-icon" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Popular Searches */}
                                    {!searchQuery.trim() && suggestions.popular.length > 0 && (
                                        <div className="suggestion-group">
                                            <div className="suggestion-group-header">
                                                <TrendingUp size={14} />
                                                <span>Popular Searches</span>
                                            </div>
                                            {suggestions.popular.map((item, index) => {
                                                const actualIndex = suggestions.recent.length + index;
                                                return (
                                                    <div
                                                        key={`popular-${index}`}
                                                        className={`suggestion-item ${highlightedIndex === actualIndex ? 'highlighted' : ''}`}
                                                        onClick={() => handleSuggestionClick({ type: 'popular', value: item })}
                                                    >
                                                        <TrendingUp size={14} className="suggestion-item-icon" />
                                                        <span>{item}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Category Suggestions */}
                                    {searchQuery.trim() && suggestions.categories?.length > 0 && (
                                        <div className="suggestion-group">
                                            <div className="suggestion-group-header">
                                                <Tag size={14} />
                                                <span>Categories</span>
                                            </div>
                                            {suggestions.categories.map((cat, index) => (
                                                <div
                                                    key={`cat-${cat.id}`}
                                                    className={`suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
                                                    onClick={() => handleSuggestionClick({ type: 'category', value: cat.label, id: cat.id })}
                                                >
                                                    <Tag size={14} className="suggestion-item-icon" />
                                                    <span>{highlightMatch(cat.label, searchQuery)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Product Suggestions */}
                                    {searchQuery.trim() && suggestions.products.length > 0 && (
                                        <div className="suggestion-group">
                                            <div className="suggestion-group-header">
                                                <Search size={14} />
                                                <span>Products</span>
                                            </div>
                                            {suggestions.products.map((product, index) => {
                                                const actualIndex = (suggestions.categories?.length || 0) + index;
                                                return (
                                                    <div
                                                        key={`product-${product.id}`}
                                                        className={`suggestion-item product-suggestion ${highlightedIndex === actualIndex ? 'highlighted' : ''}`}
                                                        onClick={() => handleSuggestionClick({ type: 'product', value: product.name, product })}
                                                    >
                                                        <div
                                                            className="suggestion-product-image"
                                                            style={{
                                                                background: product.color ? `linear-gradient(135deg, ${product.color}40, ${product.color}20)` : 'rgba(255,255,255,0.1)',
                                                                borderColor: product.color || 'rgba(255,255,255,0.2)'
                                                            }}
                                                        >
                                                            {product.name.charAt(0)}
                                                        </div>
                                                        <div className="suggestion-product-info">
                                                            <span className="suggestion-product-name">
                                                                {highlightMatch(product.name, searchQuery)}
                                                            </span>
                                                            <span className="suggestion-product-price">
                                                                ₹{product.price}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* No Results */}
                                    {searchQuery.trim() && suggestions.products.length === 0 && suggestions.categories?.length === 0 && (
                                        <div className="suggestion-no-results">
                                            <span>No products found for "{searchQuery}"</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Hamburger Menu Button */}
                    <div className="mobile-category-menu">
                        <button
                            className="hamburger-btn"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            <span>Categories</span>
                        </button>

                        {/* Mobile Dropdown */}
                        {mobileMenuOpen && (
                            <div className="mobile-category-dropdown">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveCategory(cat.id);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`mobile-category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Categories */}
                    <div className="category-tabs desktop-only">
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
                        <SkeletonGrid count={8} />
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
        </>
    );
};

export default Store;

