import React, { useState, useEffect } from 'react';
import { Copy, Share2, Users, TrendingUp, Gift, CheckCircle, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import './ReferralDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ReferralDashboard = () => {
    const { user, token } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [referralLink, setReferralLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [recentReferrals, setRecentReferrals] = useState([]);

    useEffect(() => {
        fetchReferralData();
    }, [token]);

    const fetchReferralData = async () => {
        if (!token) return;

        try {
            setLoading(true);

            // Get referral code
            const codeRes = await fetch(`${API_URL}/referrals/my-code`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const codeData = await codeRes.json();

            // Get stats
            const statsRes = await fetch(`${API_URL}/referrals/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsData = await statsRes.json();

            if (codeData.success) {
                setReferralLink(codeData.referralLink);
            }

            if (statsData.success) {
                setStats(statsData.stats);
                setRecentReferrals(statsData.recentReferrals || []);
            }
        } catch (error) {
            console.error('Error fetching referral data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            showToast('Referral link copied!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            showToast('Failed to copy', 'error');
        }
    };

    const shareOnSocial = (platform) => {
        const text = `Join Army SMP 2 using my referral link and we both earn rewards! 🎮`;
        const url = encodeURIComponent(referralLink);
        const encodedText = encodeURIComponent(text);

        let shareUrl;
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodedText}%20${url}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    if (loading) {
        return (
            <div className="referral-dashboard loading">
                <div className="loading-spinner"></div>
                <p>Loading referral data...</p>
            </div>
        );
    }

    return (
        <div className="referral-dashboard">
            <div className="referral-header">
                <div className="header-icon">
                    <Gift size={28} />
                </div>
                <div>
                    <h2>Referral Program</h2>
                    <p>Invite friends & earn 5% of their purchases!</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="referral-stats">
                <div className="stat-card">
                    <Users className="stat-icon" size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{stats?.referralCount || 0}</span>
                        <span className="stat-label">Friends Invited</span>
                    </div>
                </div>
                <div className="stat-card">
                    <TrendingUp className="stat-icon" size={24} />
                    <div className="stat-info">
                        <span className="stat-value">₹{stats?.totalEarnings || 0}</span>
                        <span className="stat-label">Total Earned</span>
                    </div>
                </div>
                <div className="stat-card highlight">
                    <Gift className="stat-icon" size={24} />
                    <div className="stat-info">
                        <span className="stat-value">₹{stats?.availableBalance || 0}</span>
                        <span className="stat-label">Available Balance</span>
                    </div>
                </div>
            </div>

            {/* Referral Link */}
            <div className="referral-link-section">
                <h3>Your Referral Link</h3>
                <div className="link-box">
                    <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="link-input"
                    />
                    <button
                        className={`copy-btn ${copied ? 'copied' : ''}`}
                        onClick={copyToClipboard}
                    >
                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                {/* Referral Code */}
                <div className="referral-code">
                    <span>Your Code:</span>
                    <strong>{stats?.referralCode || '...'}</strong>
                </div>
            </div>

            {/* Share Buttons */}
            <div className="share-section">
                <h3>Share via</h3>
                <div className="share-buttons">
                    <button
                        className="share-btn whatsapp"
                        onClick={() => shareOnSocial('whatsapp')}
                    >
                        <MessageCircle size={20} />
                        WhatsApp
                    </button>
                    <button
                        className="share-btn twitter"
                        onClick={() => shareOnSocial('twitter')}
                    >
                        <Twitter size={20} />
                        Twitter
                    </button>
                    <button
                        className="share-btn facebook"
                        onClick={() => shareOnSocial('facebook')}
                    >
                        <Facebook size={20} />
                        Facebook
                    </button>
                </div>
            </div>

            {/* Recent Referrals */}
            {recentReferrals.length > 0 && (
                <div className="recent-referrals">
                    <h3>Recent Referrals</h3>
                    <div className="referrals-list">
                        {recentReferrals.map((ref, index) => (
                            <div key={index} className="referral-item">
                                <div className="referral-avatar">
                                    {ref.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="referral-info">
                                    <span className="referral-name">{ref.username}</span>
                                    <span className="referral-date">
                                        Joined {new Date(ref.joinedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="referral-stats-mini">
                                    <span>{ref.orders} orders</span>
                                    <span>₹{ref.spent} spent</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* How it Works */}
            <div className="how-it-works">
                <h3>How it Works</h3>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <p>Share your unique referral link with friends</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <p>They sign up using your link</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <p>When they purchase, you earn 5% as store credit!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralDashboard;
