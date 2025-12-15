import { useState } from 'react';
import Features from '../components/Features';
import FeaturedRanks from '../components/FeaturedRanks';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy IP');

    const ip = "army.hostzy.xyz";
    const port = "25570";
    const fullAddress = `${ip}:${port}`;

    const handleJoin = () => {
        setIsModalOpen(true);
        setCopyStatus('Copy IP'); // Reset status on open
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(fullAddress).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy IP'), 2000);
        }).catch(() => {
            prompt("Copy the Server IP:", fullAddress);
        });
    };

    return (
        <div className="page-content">
            <section className="hero" style={{
                minHeight: '80vh', /* Changed to minHeight for safety */
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("/images/hero-bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                marginTop: '-80px',
                paddingTop: '80px',
                paddingBottom: '2rem' /* Extra padding for mobile */
            }}>
                <div className="container">
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4rem)', /* Reduced max size */
                        marginBottom: '1rem',
                        textShadow: '0 0 20px rgba(255, 85, 0, 0.5)',
                        lineHeight: 1.2
                    }}>
                        Welcome to <span style={{ color: 'var(--primary)' }}>Army SMP</span>
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                        maxWidth: '600px',
                        margin: '0 auto 2rem'
                    }}>
                        Join the ultimate Minecraft adventure. Survival, PvP, and an amazing community wait for you.
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            className="btn btn-primary"
                            style={{
                                padding: '12px 30px',
                                fontSize: '1rem',
                                minWidth: '160px'
                            }}
                            onClick={handleJoin}
                        >
                            Join Server
                        </button>
                        <Link to="/store" className="btn btn-outline" style={{
                            padding: '12px 30px',
                            fontSize: '1rem',
                            minWidth: '160px'
                        }}>
                            Visit Store
                        </Link>
                    </div>
                </div>
            </section>

            <FeaturedRanks />
            <Features />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Join Army SMP"
            >
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        Connect now and start your adventure!
                    </p>

                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid var(--card-border)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Server IP</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '1px' }}>
                            {ip}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Port: {port}</div>
                    </div>

                    <button
                        onClick={handleCopy}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '15px' }}
                    >
                        {copyStatus}
                    </button>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                        Supports Java & Bedrock Edition
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default Home;
