import './Partners.css';

/**
 * Partners/Sponsors Section
 * Displays official partners and sponsors above the footer
 */
const Partners = () => {
    // Partner data - replace with actual logos/links when available
    const partners = [
        {
            name: 'DragoHost',
            icon: '🐉',
            logo: '/images/dragohost-logo.png',
            url: 'https://discord.gg/D9pGnUM2tH'
        },
        {
            name: 'Tebex',
            icon: '💳',
            logo: null, // Will use icon as placeholder
            url: '#'
        },
        {
            name: 'PayPal',
            icon: '💰',
            logo: null,
            url: '#'
        },
        {
            name: 'Razorpay',
            icon: '⚡',
            logo: null,
            url: '#'
        }
    ];

    return (
        <section className="partners-section">
            <div className="partners-container">
                <p className="partners-title">Official Partners</p>

                <div className="partners-grid">
                    {partners.map((partner, index) => (
                        <a
                            key={index}
                            href={partner.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="partner-item"
                        >
                            <div className="partner-logo">
                                {partner.logo ? (
                                    <img
                                        src={partner.logo}
                                        alt={partner.name}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                <span style={{ display: partner.logo ? 'none' : 'block' }}>
                                    {partner.icon}
                                </span>
                            </div>
                            <span className="partner-name">{partner.name}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Partners;
