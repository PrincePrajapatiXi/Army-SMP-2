import { Link } from 'react-router-dom';

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
        <section className="featured-section" style={{ padding: '4rem 0' }}>
            <div className="container">
                <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: 'clamp(2rem, 5vw, 2.5rem)' }}>Featured <span className="text-accent">Ranks</span></h2>

                <div className="ranks-grid">
                    {ranks.map((rank, index) => (
                        <div key={index} className="rank-card" style={{
                            background: `linear-gradient(180deg, var(--bg-card) 0%, rgba(0,0,0,0) 100%)`,
                            padding: 'clamp(1.5rem, 4vw, 2rem)', /* Responsive padding */
                            borderRadius: '16px',
                            border: `1px solid ${rank.color}`,
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: rank.color,
                                boxShadow: `0 0 20px ${rank.color}`
                            }}></div>

                            <img src={rank.image} alt={rank.name} style={{ width: '100px', marginBottom: '1rem', borderRadius: '50%' }} />

                            <h3 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: rank.color, textShadow: `0 0 10px ${rank.color}` }}>{rank.name}</h3>
                            <p style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', margin: '1rem 0', fontWeight: 'bold' }}>{rank.price}</p>

                            <ul style={{ textAlign: 'left', marginBottom: '2rem', color: 'var(--text-secondary)', listStyle: 'none', padding: 0 }}>
                                {rank.features.map((feature, i) => (
                                    <li key={i} style={{ marginBottom: '0.5rem' }}>{feature}</li>
                                ))}
                            </ul>

                            <Link to="/store" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
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
