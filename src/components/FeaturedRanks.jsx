import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FeaturedRanks.css';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

// Fallback ranks if API fails
const fallbackRanks = [
    {
        name: "Stone",
        price: 30,
        priceDisplay: "₹30",
        color: "#ffffff",
        image: "/images/stone.png",
        features: ["Priority Queue", "Green Name Color", "1x Kit Key"]
    },
    {
        name: "Beacon",
        price: 60,
        priceDisplay: "₹60",
        color: "#55ffff",
        image: "/images/Beacon.png",
        features: ["Priority Queue", "Aqua Name Color", "3x Kit Keys", "/fly in Lobby"]
    },
    {
        name: "Bedrock",
        price: 120,
        priceDisplay: "₹120",
        color: "#ffffff",
        image: "/images/bedrock.png",
        features: ["Top Priority Queue", "Red Name Color", "5x Kit Keys", "/fly in Lobby", "Exclusive Pet"]
    },
];

const FeaturedRanks = () => {
    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedRanks();
    }, []);

    const fetchFeaturedRanks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/featured`);
            const data = await response.json();

            if (data && data.length > 0) {
                // Sort by displayOrder and map to expected format
                const sortedRanks = data
                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                    .map(product => ({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        priceDisplay: product.priceDisplay || `₹${product.price}`,
                        color: product.color || '#ffffff',
                        image: product.image,
                        features: product.features || []
                    }));
                setRanks(sortedRanks);
            } else {
                // Use fallback if no featured products
                setRanks(fallbackRanks);
            }
        } catch (error) {
            console.error('Error fetching featured ranks:', error);
            setRanks(fallbackRanks);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="featured-section">
                <div className="container">
                    <h2 className="ranks-title">Featured <span className="text-accent">Ranks</span></h2>
                    <div className="ranks-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rank-card skeleton-card">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-text"></div>
                                <div className="skeleton-price"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="featured-section">
            <div className="container">
                <h2 className="ranks-title">Featured <span className="text-accent">Ranks</span></h2>

                <div className="ranks-grid">
                    {ranks.map((rank, index) => (
                        <div key={rank.id || index} className="rank-card" style={{
                            border: `1px solid ${rank.color}`
                        }}>
                            <div className="rank-glow-bar" style={{
                                background: rank.color,
                                boxShadow: `0 0 20px ${rank.color}`
                            }}></div>

                            <img src={rank.image} alt={rank.name} className="rank-image" />

                            <h3 className="rank-name" style={{ color: rank.color, textShadow: `0 0 10px ${rank.color}` }}>{rank.name}</h3>
                            <p className="rank-price">{rank.priceDisplay}</p>

                            <ul className="rank-features">
                                {rank.features.map((feature, i) => (
                                    <li key={i}>✓ {feature}</li>
                                ))}
                            </ul>

                            <Link to="/store" className="btn btn-primary rank-btn">
                                Buy Now
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedRanks;

