import React, { useState, useEffect } from 'react';
import { Server, Users, Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';

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

    if (status.loading) return null;

    return (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${status.online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <Server size={20} />
                </div>
                <div>
                    <h3 className="text-white font-medium text-sm">Play.ArmySMP.fun</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {status.online ? 'Server Online' : 'Server Offline'}
                    </p>
                </div>
            </div>

            {status.online && (
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-gray-400 text-xs flex items-center gap-1"><Users size={12}/> Players</span>
                        <span className="text-white font-bold text-sm">{status.players} <span className="text-gray-500 text-xs">/ {status.max}</span></span>
                    </div>
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-gray-400 text-xs flex items-center gap-1"><Activity size={12}/> Ping</span>
                        <span className="text-green-400 font-bold text-sm">{status.ping}ms</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServerStatusWidget;
