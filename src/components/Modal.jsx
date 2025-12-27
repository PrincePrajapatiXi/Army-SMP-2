import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#12121a',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                transform: 'translateY(0)',
                animation: 'float 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{
                        color: 'white',
                        backgroundColor: '#ff4444', // Red background for X as per image vibe (or just red icon?) Image looks like red button background or just red icon. Let's make it look premium.
                        // Actually, looking at the image provided by user: It has a Red square button with a white X.
                        border: 'none',
                        borderRadius: '4px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#cc0000'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ff4444'}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '2rem', overflowY: 'auto' }}>
                    {children}
                </div>

            </div>
        </div>
    );
};

export default Modal;
