import { useState, useEffect, useRef } from 'react';
import { X, Filter, Check, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../hooks/useHaptics';
import './FilterDrawer.css';

/**
 * FilterDrawer - Mobile slide-up filter drawer
 * Categories, sorting, and filter options
 */
const FilterDrawer = ({
    isOpen,
    onClose,
    categories = [],
    activeCategory,
    onCategoryChange,
    onApply,
    onReset
}) => {
    const [selectedCategory, setSelectedCategory] = useState(activeCategory);
    const drawerRef = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Update selected when prop changes
    useEffect(() => {
        setSelectedCategory(activeCategory);
    }, [activeCategory]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Swipe down to close
    const minSwipeDistance = 80;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchEnd - touchStart;
        if (distance > minSwipeDistance) {
            triggerHaptic('light');
            onClose();
        }
        setTouchStart(null);
        setTouchEnd(null);
    };

    const handleCategorySelect = (catId) => {
        triggerHaptic('selection');
        setSelectedCategory(catId);
    };

    const handleApply = () => {
        triggerHaptic('medium');
        onCategoryChange(selectedCategory);
        if (onApply) onApply();
        onClose();
    };

    const handleReset = () => {
        triggerHaptic('light');
        setSelectedCategory('all');
        onCategoryChange('all');
        if (onReset) onReset();
    };

    if (!isOpen) return null;

    return (
        <div className="filter-drawer-overlay" onClick={onClose}>
            <div
                ref={drawerRef}
                className="filter-drawer"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Handle bar for visual swipe hint */}
                <div className="drawer-handle" />

                {/* Header */}
                <div className="drawer-header">
                    <div className="drawer-title">
                        <Filter size={20} />
                        <h3>Filter Products</h3>
                    </div>
                    <button className="drawer-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Categories */}
                <div className="drawer-section">
                    <h4 className="section-label">Categories</h4>
                    <div className="category-chips">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => handleCategorySelect(cat.id)}
                            >
                                {selectedCategory === cat.id && <Check size={14} />}
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="drawer-actions">
                    <button className="drawer-btn reset-btn" onClick={handleReset}>
                        <RotateCcw size={18} />
                        Reset
                    </button>
                    <button className="drawer-btn apply-btn" onClick={handleApply}>
                        <Check size={18} />
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterDrawer;

