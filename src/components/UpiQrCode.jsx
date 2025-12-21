import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone } from 'lucide-react';
import './UpiQrCode.css';

const UPI_ID = 'princeprajapti2589-2@okicici';
const MERCHANT_NAME = 'Army SMP';

const UpiQrCode = ({ amount, orderId, onCopy }) => {
    const [copied, setCopied] = React.useState(false);

    // Generate UPI deep link with locked amount
    const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=Order${orderId || 'ARMY'}`;

    const handleCopyUpi = () => {
        navigator.clipboard.writeText(UPI_ID);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onCopy) onCopy();
    };

    return (
        <div className="upi-qr-container">
            <div className="upi-qr-header">
                <Smartphone size={24} />
                <h3>Scan QR to Pay via UPI</h3>
            </div>

            <div className="upi-qr-card">
                <div className="qr-wrapper">
                    <QRCodeSVG
                        value={upiLink}
                        size={200}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                    />
                </div>

                <div className="upi-amount">
                    <span className="amount-label">Amount</span>
                    <span className="amount-value">₹{amount.toFixed(2)}</span>
                    <span className="amount-locked">🔒 Amount is locked</span>
                </div>

                <div className="upi-id-section">
                    <span className="upi-label">UPI ID</span>
                    <div className="upi-id-row">
                        <code className="upi-id">{UPI_ID}</code>
                        <button
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                            onClick={handleCopyUpi}
                            title="Copy UPI ID"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="upi-apps">
                    <span>Pay using any UPI app:</span>
                    <div className="app-icons">
                        <span className="app-icon">📱 GPay</span>
                        <span className="app-icon">📱 PhonePe</span>
                        <span className="app-icon">📱 Paytm</span>
                    </div>
                </div>
            </div>

            <p className="upi-note">
                ✓ Amount cannot be changed by user<br />
                ✓ Payment will be received in seller's account
            </p>
        </div>
    );
};

export default UpiQrCode;
