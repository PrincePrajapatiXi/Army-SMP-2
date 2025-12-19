import { useState, useEffect } from 'react';
import Features from '../components/Features';
import FeaturedRanks from '../components/FeaturedRanks';
import Sponsor from '../components/Sponsor';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy IP');
    const [displayText, setDisplayText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [serverStatus, setServerStatus] = useState({
        online: true,
        players: 0,
        max: 20,
        loading: true
    });

    const ip = "army.hostzy.xyz";
    const port = "25565";
    const fullAddress = `${ip}:${port}`;
    const fullText = "Army SMP";

    // Fetch live server status
    useEffect(() => {
        const fetchServerStatus = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/server-status/quick');
                const data = await response.json();
                setServerStatus({
                    online: data.online,
                    players: data.players || 0,
                    max: data.max || 20,
                    loading: false
                });
            } catch (error) {
                console.log('Server status unavailable, using default');
                setServerStatus({
                    online: true,
                    players: 0,
                    max: 20,
                    loading: false
                });
            }
        };

        fetchServerStatus();
        // Refresh every 60 seconds
        const interval = setInterval(fetchServerStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    // Typing animation effect
    useEffect(() => {
        let index = 0;
        const typingInterval = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(typingInterval);
            }
        }, 53);

        // Cursor blink
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 500);

        return () => {
            clearInterval(typingInterval);
            clearInterval(cursorInterval);
        };
    }, []);

    const handleJoin = () => {
        setIsModalOpen(true);
        setCopyStatus('Copy IP');
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
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                background: `
                    radial-gradient(ellipse at 50% 0%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 50%, rgba(255, 193, 7, 0.08) 0%, transparent 40%),
                    radial-gradient(ellipse at 20% 80%, rgba(255, 107, 53, 0.1) 0%, transparent 40%),
                    linear-gradient(rgba(10, 10, 15, 0.85), rgba(10, 10, 15, 0.95)),
                    url("/images/hero-bg.jpg")
                `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                marginTop: '-80px',
                paddingTop: '80px',
                paddingBottom: '4rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Animated particles effect */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'1\' fill=\'%23ff6b35\' opacity=\'0.3\'/%3E%3C/svg%3E")',
                    backgroundSize: '50px 50px',
                    animation: 'float 6s ease-in-out infinite',
                    pointerEvents: 'none',
                    opacity: 0.5
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                        marginBottom: '1.5rem',
                        fontWeight: '800',
                        letterSpacing: '-1px',
                        lineHeight: 1.1
                    }}>
                        Welcome to{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #ff6b35, #ff8555, #ffc107)',
                            backgroundSize: '200% 200%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            animation: 'gradientFlow 3s ease infinite',
                            textShadow: 'none',
                            filter: 'drop-shadow(0 0 30px rgba(255, 107, 53, 0.5))'
                        }}>
                            {displayText}
                            <span style={{
                                borderRight: showCursor ? '3px solid #ff6b35' : '3px solid transparent',
                                marginLeft: '2px',
                                animation: 'none'
                            }}></span>
                        </span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                        color: 'var(--text-secondary)',
                        marginBottom: '2.5rem',
                        maxWidth: '650px',
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.7,
                        opacity: 0,
                        animation: 'fadeInUp 0.4s ease forwards',
                        animationDelay: '0.3s'
                    }}>
                        Join the ultimate Minecraft adventure. Survival, PvP, and an amazing community await you.
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        opacity: 0,
                        animation: 'fadeInUp 0.4s ease forwards',
                        animationDelay: '0.5s'
                    }}>
                        <button
                            className="btn btn-primary"
                            style={{
                                padding: '16px 40px',
                                fontSize: '1.2rem',
                                minWidth: '180px',
                                animation: 'glowPulse 2s ease-in-out infinite'
                            }}
                            onClick={handleJoin}
                        >
                            🎮 Join Server
                        </button>
                        <Link to="/store" className="btn btn-outline" style={{
                            padding: '16px 40px',
                            fontSize: '1.2rem',
                            minWidth: '180px'
                        }}>
                            🛒 Visit Store
                        </Link>
                    </div>

                    {/* Online players indicator */}
                    <div style={{
                        marginTop: '3rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '50px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        opacity: 0,
                        animation: 'fadeInUp 0.4s ease forwards',
                        animationDelay: '0.7s'
                    }}>
                        <span style={{
                            width: '10px',
                            height: '10px',
                            background: serverStatus.online ? '#4ade80' : '#ef4444',
                            borderRadius: '50%',
                            boxShadow: serverStatus.online ? '0 0 10px #4ade80' : '0 0 10px #ef4444',
                            animation: 'pulse 2s infinite'
                        }}></span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            {serverStatus.loading ? (
                                'Checking server...'
                            ) : serverStatus.online ? (
                                <>
                                    <span style={{ color: '#4ade80', fontWeight: '600' }}>
                                        {serverStatus.players}
                                    </span>
                                    /{serverStatus.max} Players • Java & Bedrock
                                </>
                            ) : (
                                'Server Offline'
                            )}
                        </span>
                    </div>
                </div>
            </section>

            <FeaturedRanks />
            <Sponsor />
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
