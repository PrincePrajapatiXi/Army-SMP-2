import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = ({ targetDate, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [expired, setExpired] = useState(false);

    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        return timeLeft;
    }

    useEffect(() => {
        const difference = +new Date(targetDate) - +new Date();
        if (difference <= 0) {
            setExpired(true);
            if (onExpire) onExpire();
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    if (expired) {
        return (
            <div className="flex items-center gap-2 text-red-500 font-bold bg-red-500/10 px-3 py-1.5 rounded-full text-sm">
                <Timer size={16} />
                Sale Ended!
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-600/20 to-orange-500/20 border border-red-500/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Timer size={16} className="text-red-400 animate-pulse" />
            <div className="flex items-center gap-1 font-mono text-sm font-bold">
                {timeLeft.days > 0 && <span className="text-white">{timeLeft.days}d</span>}
                <span className="text-red-300">{String(timeLeft.hours).padStart(2, '0')}:</span>
                <span className="text-red-300">{String(timeLeft.minutes).padStart(2, '0')}:</span>
                <span className="text-red-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
        </div>
    );
};

export default CountdownTimer;
