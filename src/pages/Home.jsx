import { useState, useEffect } from 'react';
import Features from '../components/Features';
import FeaturedRanks from '../components/FeaturedRanks';
import Leaderboard from '../components/Leaderboard';
import PromoSlider from '../components/PromoSlider';
import Modal from '../components/Modal';
import RippleButton from '../components/RippleButton';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy IP');
    const [serverStatus, setServerStatus] = useState({
        online: true,
        players: 0,
        max: 0,
        loading: true
    });

    const ip = "IP-premium.dragohost.cloud";
    const port = "19216";
    const fullAddress = `${ip}:${port}`;

    // Fetch live server status
    useEffect(() => {
        const API_BASE_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api'
            : 'https://army-smp-2.onrender.com/api';

        const fetchServerStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/server-status/quick`);
                const data = await response.json();
                setServerStatus({
                    online: data.online,
                    players: data.players || 0,
                    max: data.max || 0,
                    loading: false
                });
            } catch (error) {
                console.log('Server status unavailable, using default');
                setServerStatus({
                    online: true,
                    players: 0,
                    max: 0,
                    loading: false
                });
            }
        };

        fetchServerStatus();
        // Refresh every 60 seconds
        const interval = setInterval(fetchServerStatus, 60000);
        return () => clearInterval(interval);
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
        <>
            <SEO
                title="Home"
                description="Join Army SMP 2 - The ultimate Minecraft server experience. Shop premium ranks, kits, and accessories with secure UPI payments."
                keywords="Minecraft server, Army SMP 2, Minecraft ranks, gaming, survival server"
                url="/"
            />
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
                    paddingTop: '100px',
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
                            fontSize: 'clamp(1.8rem, 7vw, 4.5rem)',
                            marginBottom: '1.5rem',
                            fontWeight: '800',
                            letterSpacing: '-1px',
                            lineHeight: 1.2,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            padding: '0 10px'
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
                                filter: 'drop-shadow(0 0 30px rgba(255, 107, 53, 0.5))',
                                display: 'inline-block'
                            }}>
                                Army SMP
                            </span>
                        </h1>

                        <p style={{
                            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                            color: 'var(--text-secondary)',
                            marginBottom: '2.5rem',
                            maxWidth: '650px',
                            margin: '0 auto 2.5rem',
                            lineHeight: 1.7
                        }}>
                            Join the ultimate Minecraft adventure. Survival, PvP, and an amazing community await you.
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <RippleButton
                                variant="primary"
                                style={{
                                    padding: '16px 40px',
                                    fontSize: '1.2rem',
                                    minWidth: '180px',
                                    animation: 'glowPulse 2s ease-in-out infinite'
                                }}
                                onClick={handleJoin}
                            >
                                🎮 Join Server
                            </RippleButton>
                            <Link to="/store">
                                <RippleButton
                                    variant="outline"
                                    style={{
                                        padding: '16px 40px',
                                        fontSize: '1.2rem',
                                        minWidth: '180px'
                                    }}
                                >
                                    🛒 Visit Store
                                </RippleButton>
                            </Link>
                        </div>

                        <div style={{
                            marginTop: '3rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 24px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '50px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
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
                                    serverStatus.max > 0 ? (
                                        <>
                                            <span style={{ color: '#4ade80', fontWeight: '600' }}>
                                                {serverStatus.players}
                                            </span>
                                            /{serverStatus.max} Players • Java & Bedrock
                                        </>
                                    ) : (
                                        'Online • Java & Bedrock'
                                    )
                                ) : (
                                    'Server Offline'
                                )}
                            </span>
                        </div>
                    </div>
                </section>

                <AnimatedSection animation="fadeUp">
                    <FeaturedRanks />
                </AnimatedSection>

                <AnimatedSection animation="fadeUp" delay={0.1}>
                    <Leaderboard />
                </AnimatedSection>

                <AnimatedSection animation="fadeUp" delay={0.15}>
                    <PromoSlider />
                </AnimatedSection>

                <AnimatedSection animation="fadeUp" delay={0.2}>
                    <Features />
                </AnimatedSection>

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
                            Supports Java &amp; Bedrock Edition
                        </p>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default Home;
