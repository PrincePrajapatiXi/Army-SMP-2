import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube, MessageCircle } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--card-border)',
            padding: '4rem 0 2rem',
            marginTop: 'auto'
        }}>
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '3rem',
                    marginBottom: '3rem'
                }}>
                    {/* Brand Section */}
                    <div>
                        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'block' }}>
                            Army<span style={{ color: 'var(--primary)' }}>SMP</span>
                        </Link>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            The ultimate Minecraft survival experience. Join our community and start your adventure today.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'white' }}>Quick Links</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <li><Link to="/" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }}>Home</Link></li>
                            <li><Link to="/store" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }}>Store</Link></li>
                            <li><a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }}>Vote</a></li>
                            <li><a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }}>Discord</a></li>
                        </ul>
                    </div>

                    {/* Legal & Social */}
                    <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'white' }}>Community</h4>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <a href="#" style={{ color: 'var(--text-secondary)', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <MessageCircle size={20} />
                            </a>
                            <a href="#" style={{ color: 'var(--text-secondary)', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <Twitter size={20} />
                            </a>
                            <a href="#" style={{ color: 'var(--text-secondary)', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <Instagram size={20} />
                            </a>
                            <a href="#" style={{ color: 'var(--text-secondary)', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <Youtube size={20} />
                            </a>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            support@armysmp.com
                        </p>
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <p>&copy; {new Date().getFullYear()} Army SMP. All rights reserved.</p>
                    <p style={{ opacity: 0.6 }}>Not affiliated with Mojang AB.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
