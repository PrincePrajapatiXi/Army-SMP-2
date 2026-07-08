import React, { useState, useEffect } from 'react';
import { Server, Users, Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
import './ServerStatusWidget.css';

const ServerStatusWidget = () => {
    const [status, setStatus] = useState({
        online: false,
        players: 0,
        max: 0,
        ping: 0,
        loading: true
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const startTime = Date.now();
                const res = await axios.get(`${API_BASE_URL}/server-status`);
                const pingTime = Date.now() - startTime;
                
                if (res.data && res.data.online) {
                    setStatus({
                        online: true,
                        players: res.data.numplayers || 0,
                        max: res.data.maxplayers || 20,
                        ping: pingTime,
                        loading: false
                    });
                } else {
                    setStatus({ online: false, players: 0, max: 0, ping: 0, loading: false });
                }
            } catch (err) {
                setStatus({ online: false, players: 0, max: 0, ping: 0, loading: false });
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Removed: if (status.loading) return null;
    return (
        <div className="server-status-widget">
            <div className="status-left">
                <div className={`status-icon-wrapper ${status.loading ? 'loading' : (status.online ? 'online' : 'offline')}`}>
                    <Server size={20} />
                </div>
                <div className="status-info">
                    <h3>Play.ArmySMP.fun</h3>
                    <p className="status-indicator">
                        <span className={`dot ${status.loading ? 'loading' : (status.online ? 'online' : 'offline')}`}></span>
                        {status.loading ? 'Checking Status...' : (status.online ? 'Server Online' : 'Server Offline')}
                    </p>
                </div>
            </div>

            <div className="status-right">
                <div className="stat-item">
                    <span className="stat-label"><Users size={12}/> Players</span>
                    <span className="stat-value">{status.loading ? '-' : status.players} <span className="stat-sub">/ {status.loading ? '-' : status.max}</span></span>
                </div>
                <div className="stat-item ping-stat">
                    <span className="stat-label"><Activity size={12}/> Ping</span>
                    <span className={`stat-value stat-ping ${status.loading ? 'loading' : (status.online ? 'online' : 'offline')}`}>
                        {status.loading ? '...' : (status.ping ? `${status.ping}ms` : '--')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ServerStatusWidget;
