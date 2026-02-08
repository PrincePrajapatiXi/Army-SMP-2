import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone } from 'lucide-react';
import './UpiQrCode.css';

const UPI_ID = 'princeprajapti2589-2@okicici';
const MERCHANT_NAME = 'ArmySMP';

const UpiQrCode = ({ amount, orderId, onCopy }) => {
    const [copied, setCopied] = React.useState(false);

    // Ensure amount is a valid number
    const validAmount = Math.max(0, parseFloat(amount) || 0);

    // Clean orderId - remove special characters and spaces
    const cleanOrderId = (orderId || 'ORDER').toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

    // Generate UPI deep link with proper encoding
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${MERCHANT_NAME}&am=${validAmount.toFixed(2)}&cu=INR&tn=${cleanOrderId}`;

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
            </div>

            <p className="upi-note">
                ✓ Amount cannot be changed by user<br />
                ✓ Payment will be received in seller's account
            </p>
        </div>
    );
};

export default UpiQrCode;

