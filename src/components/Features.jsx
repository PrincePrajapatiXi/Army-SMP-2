import { Shield, Zap, Server, Users } from 'lucide-react';

const features = [
    {
        icon: <Zap size={40} className="text-accent" />,
        title: "Instant Delivery",
        description: "All purchases are processed automatically and delivered within seconds."
    },
    {
        icon: <Shield size={40} className="text-accent" />,
        title: "DDoS Protection",
        description: "Our high-performance servers are protected by advanced anti-DDoS systems."
    },
    {
        icon: <Server size={40} className="text-accent" />,
        title: "99.9% Uptime",
        description: "We guarantee that our servers will be online whenever you want to play."
    },
    {
        icon: <Users size={40} className="text-accent" />,
        title: "Friendly Community",
        description: "Join thousands of players in our welcoming and active community."
    }
];

const Features = () => {
    return (
        <section className="features-section" style={{ padding: '4rem 0', backgroundColor: 'var(--bg-surface)' }}>
            <div className="container">
                <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: 'clamp(2rem, 5vw, 2.5rem)' }}>Why Choose <span className="text-accent">Army SMP</span>?</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '2rem'
                }}>
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card" style={{
                            backgroundColor: 'var(--bg-dark)',
                            padding: 'clamp(1.5rem, 4vw, 2rem)',
                            borderRadius: 'var(--border-radius)',
                            border: 'var(--card-border)',
                            textAlign: 'center',
                            transition: 'transform 0.3s ease'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>{feature.icon}</div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
