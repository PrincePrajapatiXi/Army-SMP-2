import React from 'react';
import './PolicyPage.css';

const TermsAndConditions = () => {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <div className="policy-header">
                    <h1 className="policy-title">Terms & Conditions</h1>
                    <p className="policy-updated">Last Updated: March 24, 2026</p>
                </div>

                <div className="policy-content">
                    <div className="policy-section">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using the Army SMP S-2 website and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>2. Description of Service</h2>
                        <p>
                            Army SMP S-2 provides a Minecraft multiplayer server experience and a digital store for in-game items, ranks, and enhancements. All items sold are digital goods for use exclusively within the Army SMP S-2 server.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>3. User Responsibilities</h2>
                        <ul>
                            <li>You must be at least 13 years old or have parental consent to use our services.</li>
                            <li>You are responsible for maintaining the security of your Minecraft account.</li>
                            <li>You agree not to use our services for any illegal or unauthorized purpose.</li>
                            <li>You must comply with all server rules as documented on our Discord community.</li>
                        </ul>
                    </div>

                    <div className="policy-section">
                        <h2>4. Purchases and Payments</h2>
                        <p>
                            All payments are processed through secure third-party payment gateways (including Razorpay). By making a purchase, you agree to provide current, complete, and accurate purchase and account information.
                        </p>
                        <p>
                            We reserve the right to refuse any order you place with us. Prices for our products are subject to change without notice.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>5. Intellectual Property</h2>
                        <p>
                            All content on this website, including text, graphics, logos, and software, is the property of Army SMP S-2 or its content suppliers and is protected by international copyright laws.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>6. Limitation of Liability</h2>
                        <p>
                            Army SMP S-2 shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services or for the cost of procurement of substitute goods and services.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>7. Governing Law</h2>
                        <p>
                            These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                        </p>
                    </div>

                    <div className="contact-card">
                        <p>If you have any questions about our Terms & Conditions, please contact us at:</p>
                        <a href="mailto:princeprajapti2589@gmail.com" className="contact-email">princeprajapti2589@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
