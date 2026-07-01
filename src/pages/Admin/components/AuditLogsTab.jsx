import React, { useState, useEffect } from 'react';
import { Search, History, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../../services/api';

const AuditLogsTab = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get(`${API_BASE_URL}/admin/audit-logs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLogs(response.data || []);
            } catch (error) {
                console.error('Failed to fetch audit logs', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => 
        log.adminUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-card">
            <div className="admin-card-header flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="text-primary" /> Audit Logs
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Track admin activity and system changes</p>
                </div>
                
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading logs...</div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-10">
                    <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-gray-400">No logs found matching your criteria</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="pb-3 px-4">Date & Time</th>
                                <th className="pb-3 px-4">Admin</th>
                                <th className="pb-3 px-4">Action</th>
                                <th className="pb-3 px-4">Details</th>
                                <th className="pb-3 px-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 text-sm transition-colors">
                                    <td className="py-3 px-4 text-gray-300">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-medium">
                                            {log.adminUsername}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-gray-300">
                                        {log.action}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400">
                                        {log.details}
                                    </td>
                                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                                        {log.ipAddress}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLogsTab;
