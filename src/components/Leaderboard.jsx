import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
    const [topBuyers, setTopBuyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activePeriod, setActivePeriod] = useState('all');

    const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : 'https://army-smp-2.onrender.com/api';

    const periods = [
        { id: 'all', label: 'All Time' },
        { id: 'month', label: 'This Month' },
        { id: 'week', label: 'This Week' }
    ];

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `${API_BASE_URL}/leaderboard/top-buyers?period=${activePeriod}`
                );

                if (!response.ok) {
                    console.error('Leaderboard API error:', response.status, response.statusText);
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    setTopBuyers(data.data);
                } else {
                    setError('Failed to load leaderboard');
                }
            } catch (err) {
                console.error('Leaderboard fetch error:', err);
                // Don't show error if no data - show empty state instead
                setTopBuyers([]);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [activePeriod, API_BASE_URL]);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getRankDisplay = (index) => {
        const medals = ['🥇', '🥈', '🥉'];
        if (index < 3) {
            return <span className="rank-badge medal">{medals[index]}</span>;
        }
        return <span className="rank-badge">{index + 1}</span>;
    };

    const getRankClass = (index) => {
        if (index === 0) return 'rank-1';
        if (index === 1) return 'rank-2';
        if (index === 2) return 'rank-3';
        return '';
    };

    return (
        <section className="leaderboard-section">
            <div className="leaderboard-container">
                <div className="leaderboard-header">
                    <h2 className="leaderboard-title">
                        <span className="trophy-icon">🏆</span>
                        <span>Top <span className="gradient-text">Supporters</span></span>
                    </h2>
                    <p className="leaderboard-subtitle">
                        Our amazing community members who support the server
                    </p>
                </div>

                <div className="leaderboard-tabs">
                    {periods.map((period) => (
                        <button
                            key={period.id}
                            className={`leaderboard-tab ${activePeriod === period.id ? 'active' : ''}`}
                            onClick={() => setActivePeriod(period.id)}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>

                <div className="leaderboard-card">
                    {loading ? (
                        <div className="leaderboard-loading">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="leaderboard-skeleton"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="leaderboard-error">
                            <p>⚠️ {error}</p>
                        </div>
                    ) : topBuyers.length === 0 ? (
                        <div className="leaderboard-empty">
                            <div className="leaderboard-empty-icon">🎮</div>
                            <p className="leaderboard-empty-text">
                                No supporters yet for this period.<br />
                                Be the first to support the server!
                            </p>
                        </div>
                    ) : (
                        <div className="leaderboard-list">
                            {topBuyers.map((buyer, index) => (
                                <div
                                    key={buyer.username}
                                    className={`leaderboard-entry ${getRankClass(index)}`}
                                >
                                    {getRankDisplay(index)}

                                    <img
                                        src={buyer.avatar}
                                        alt={buyer.username}
                                        className="player-avatar"
                                        onError={(e) => {
                                            e.target.src = 'https://mc-heads.net/avatar/Steve/64';
                                        }}
                                    />

                                    <div className="player-info">
                                        <div className="player-name">{buyer.username}</div>
                                        <div className="player-orders">
                                            {buyer.orderCount} order{buyer.orderCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    <div className="player-amount">
                                        <div className="amount-value">
                                            {formatAmount(buyer.totalSpent)}
                                        </div>
                                        <div className="amount-label">Total</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Leaderboard;
