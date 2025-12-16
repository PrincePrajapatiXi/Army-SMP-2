import { Link } from 'react-router-dom';
import './FeaturedRanks.css';

const ranks = [
    {
        name: "Stone",
        price: "₹30",
        color: "#55ff55",
        image: "./images/stone.png",
        features: ["✓ Priority Queue", "✓ Green Name Color", "✓ 1x Kit Key"]
    },
    {
        name: "Beacon",
        price: "₹60",
        color: "#55ffff",
        image: "./images/beacon.png",
        features: ["✓ Priority Queue", "✓ Aqua Name Color", "✓ 3x Kit Keys", "✓ /fly in Lobby"]
    },
    {
        name: "Bedrock",
        price: "₹120",
        color: "#ff5555",
        image: "./images/bedrock.png",
        features: ["✓ Top Priority Queue", "✓ Red Name Color", "✓ 5x Kit Keys", "✓ /fly in Lobby", "✓ Exclusive Pet"]
    },
];

const FeaturedRanks = () => {
    return (
        <section className="featured-section">
            <div className="container">
                <h2 className="ranks-title">Featured <span className="text-accent">Ranks</span></h2>

                <div className="ranks-grid">
                    {ranks.map((rank, index) => (
                        <div key={index} className="rank-card" style={{
                            border: `1px solid ${rank.color}`
                        }}>
                            <div className="rank-glow-bar" style={{
                                background: rank.color,
                                boxShadow: `0 0 20px ${rank.color}`
                            }}></div>

                            <img src={rank.image} alt={rank.name} className="rank-image" />

                            <h3 className="rank-name" style={{ color: rank.color, textShadow: `0 0 10px ${rank.color}` }}>{rank.name}</h3>
                            <p className="rank-price">{rank.price}</p>

                            <ul className="rank-features">
                                {rank.features.map((feature, i) => (
                                    <li key={i}>{feature}</li>
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
