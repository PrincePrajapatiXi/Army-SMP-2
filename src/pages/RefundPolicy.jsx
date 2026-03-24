import React from 'react';
import './PolicyPage.css';

const RefundPolicy = () => {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <div className="policy-header">
                    <h1 className="policy-title">Refund & Cancellation Policy</h1>
                    <p className="policy-updated">Last Updated: March 24, 2026</p>
                </div>

                <div className="policy-content">
                    <div className="policy-section">
                        <h2>1. Digital Goods Policy</h2>
                        <p>
                            All items sold on the Army SMP S-2 store are digital, non-tangible goods. Once an item is purchased and delivered to your Minecraft account, it cannot be "returned" in the traditional sense.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>2. Refund Eligibility</h2>
                        <p>
                            Due to the nature of digital goods, we generally do not offer refunds once the transaction is complete and the item has been delivered.
                        </p>
                        <p>Refunds may only be considered in the following exceptional circumstances:</p>
                        <ul>
                            <li>Duplicate payments for the same item.</li>
                            <li>Significant technical failure on our part that prevents delivery of the purchased item.</li>
                            <li>Unauthorized transactions that are reported to us within 24 hours.</li>
                        </ul>
                    </div>

                    <div className="policy-section">
                        <h2>3. Refund Request Process</h2>
                        <p>
                            To request a refund, please contact our support team at princeprajapti2589@gmail.com with your transaction ID, Minecraft username, and a detailed explanation of the issue.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>4. Chargebacks</h2>
                        <p>
                            Initiating a chargeback or dispute without contacting our support team first will result in a permanent ban from the Army SMP S-2 server and all associated services.
                        </p>
                    </div>

                    <div className="policy-section">
                        <h2>5. Cancellations</h2>
                        <p>
                            For one-time purchases, cancellations after the transaction is complete are not possible. Subscription-based services (if any) can be cancelled at any time through your account dashboard or by contacting support.
                        </p>
                    </div>

                    <div className="contact-card">
                        <p>If you have any questions about our Refund Policy, please contact us at:</p>
                        <a href="mailto:princeprajapti2589@gmail.com" className="contact-email">princeprajapti2589@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
