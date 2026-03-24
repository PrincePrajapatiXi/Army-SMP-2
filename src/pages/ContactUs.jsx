import React from 'react';
import { Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import './PolicyPage.css';

const ContactUs = () => {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <div className="policy-header">
                    <h1 className="policy-title">Contact Us</h1>
                    <p className="policy-updated">We're here to help you</p>
                </div>

                <div className="policy-content">
                    <div className="policy-section">
                        <p>
                            Have questions, feedback, or need support? Our team at Army SMP S-2 is dedicated to providing you with the best experience possible. Reach out to us through any of the channels below.
                        </p>
                    </div>

                    <div className="policy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '32px' }}>
                        <div className="contact-method" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)', border: 'var(--glass-border)', textAlign: 'center' }}>
                            <Mail size={32} color="var(--primary)" style={{ marginBottom: '16px' }} />
                            <h3>Email Support</h3>
                            <p style={{ margin: '8px 0' }}>For general inquiries and billing support.</p>
                            <a href="mailto:princeprajapti2589@gmail.com" className="contact-email">princeprajapti2589@gmail.com</a>
                        </div>

                        <div className="contact-method" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)', border: 'var(--glass-border)', textAlign: 'center' }}>
                            <MessageCircle size={32} color="var(--primary)" style={{ marginBottom: '16px' }} />
                            <h3>Discord Community</h3>
                            <p style={{ margin: '8px 0' }}>Join our Discord for instant support and community interaction.</p>
                            <a href="https://discord.gg/EBmGM2jsdt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>Join Discord Server</a>
                        </div>
                    </div>

                    <div className="policy-section" style={{ marginTop: '40px' }}>
                        <h2>Support Hours</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Clock size={20} color="var(--primary)" />
                            <p>Monday - Sunday: 10:00 AM - 10:00 PM IST</p>
                        </div>
                        <p>We aim to respond to all inquiries within 24-48 hours.</p>
                    </div>

                    <div className="policy-section">
                        <h2>Business Information</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <MapPin size={20} color="var(--primary)" />
                            <p>Based in India - Operates Planetwide</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
