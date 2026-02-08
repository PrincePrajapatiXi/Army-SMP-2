import { Shield, Zap, Server, Users } from 'lucide-react';
import './Features.css';

const features = [
    {
        icon: <Zap className="text-accent" />,
        title: "Instant Delivery",
        description: "All purchases are processed automatically and delivered within seconds."
    },
    {
        icon: <Shield className="text-accent" />,
        title: "DDoS Protection",
        description: "Our high-performance servers are protected by advanced anti-DDoS systems."
    },
    {
        icon: <Server className="text-accent" />,
        title: "99.9% Uptime",
        description: "We guarantee that our servers will be online whenever you want to play."
    },
    {
        icon: <Users className="text-accent" />,
        title: "Friendly Community",
        description: "Join thousands of players in our welcoming and active community."
    }
];

const Features = () => {
    return (
        <section className="features-section">
            <div className="container">
                <h2 className="features-title">Why Choose <span className="text-accent">Army SMP</span>?</h2>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon-wrapper">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;

