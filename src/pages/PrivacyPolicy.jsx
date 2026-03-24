import React from 'react';
import './PolicyPage.css';

const PrivacyPolicy = () => {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <div className="policy-header">
                    <h1 className="policy-title">Privacy Policy</h1>
                    <p className="policy-updated">Last Updated: March 24, 2026</p>
                </div>

                <div className="policy-content">
                    <div className="policy-section">
                        <h2>1. Introduction</h2>
                        <p>
                            At Army SMP S-2, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our website and Minecraft server.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>2. Information Collection</h2>
                        <p>We may collect information when you:</p>
                        <ul>
                            <li>Register an account on our website.</li>
                            <li>Join our Minecraft server.</li>
                            <li>Make a purchase in our store.</li>
                            <li>Interact with our support team or community on Discord.</li>
                        </ul>
                        <p>This information includes your Minecraft username, email address, IP address, and transaction details.</p>
                    </div>

                    <div className="policy-section">
                        <h2>3. Use of Information</h2>
                        <p>We use the collected information to:</p>
                        <ul>
                            <li>Provide and maintain our services.</li>
                            <li>Process transactions and send purchase confirmations.</li>
                            <li>Enhance server security and prevent cheating.</li>
                            <li>Communicate with you regarding updates or support issues.</li>
                        </ul>
                    </div>

                    <div className="policy-section">
                        <h2>4. Data Sharing</h2>
                        <p>
                            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except for trusted third parties who assist us in operating our website, conducting our business, or servicing you (such as payment processors).
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>5. Data Security</h2>
                        <p>
                            We implement a variety of security measures to maintain the safety of your personal information. Your sensitive information (like payment details) is processed by secure third-party processors and is never stored on our servers.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>6. Your Rights</h2>
                        <p>
                            You have the right to access, update, or delete your personal information. If you wish to exercise these rights, please contact our support team.
                        </p>
                    </div>

                    <div className="contact-card">
                        <p>If you have any questions about our Privacy Policy, please contact us at:</p>
                        <a href="mailto:princeprajapti2589@gmail.com" className="contact-email">princeprajapti2589@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
