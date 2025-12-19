const dgram = require('dgram');

/**
 * Minecraft Server Query Service
 * Queries Minecraft servers using the Query protocol
 */

const HANDSHAKE_TYPE = 0x09;
const STAT_TYPE = 0x00;

/**
 * Query Minecraft server status using UDP
 * @param {string} host - Server IP/hostname
 * @param {number} port - Server port (default 25565)
 * @param {number} timeout - Timeout in ms (default 3000)
 */
async function queryServer(host, port = 25565, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        let sessionId = Math.floor(Math.random() * 0x0F0F0F0F) & 0x0F0F0F0F;
        let challengeToken = null;
        let timeoutId = null;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            try { client.close(); } catch (e) { }
        };

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Query timeout'));
        }, timeout);

        client.on('error', (err) => {
            cleanup();
            reject(err);
        });

        client.on('message', (msg) => {
            const type = msg.readUInt8(0);

            if (type === HANDSHAKE_TYPE) {
                // Parse challenge token
                challengeToken = parseInt(msg.slice(5).toString('utf8').replace(/\0/g, ''));

                // Send stat request with full query
                const statBuffer = Buffer.alloc(15);
                statBuffer.writeUInt16BE(0xFEFD, 0);
                statBuffer.writeUInt8(STAT_TYPE, 2);
                statBuffer.writeInt32BE(sessionId, 3);
                statBuffer.writeInt32BE(challengeToken, 7);
                statBuffer.writeInt32BE(0, 11); // Full stat padding

                client.send(statBuffer, port, host);
            } else if (type === STAT_TYPE) {
                cleanup();

                try {
                    const data = parseFullStat(msg);
                    resolve(data);
                } catch (e) {
                    reject(new Error('Failed to parse response'));
                }
            }
        });

        // Send handshake
        const handshakeBuffer = Buffer.alloc(7);
        handshakeBuffer.writeUInt16BE(0xFEFD, 0);
        handshakeBuffer.writeUInt8(HANDSHAKE_TYPE, 2);
        handshakeBuffer.writeInt32BE(sessionId, 3);

        client.send(handshakeBuffer, port, host, (err) => {
            if (err) {
                cleanup();
                reject(err);
            }
        });
    });
}

/**
 * Parse full stat response
 */
function parseFullStat(buffer) {
    const str = buffer.toString('utf8', 16);
    const parts = str.split('\0');

    const data = {};
    for (let i = 0; i < parts.length - 1; i += 2) {
        if (parts[i]) {
            data[parts[i]] = parts[i + 1];
        }
    }

    return {
        online: true,
        hostname: data.hostname || 'Minecraft Server',
        gametype: data.gametype || 'SMP',
        version: data.version || 'Unknown',
        map: data.map || 'world',
        numplayers: parseInt(data.numplayers) || 0,
        maxplayers: parseInt(data.maxplayers) || 20,
        hostport: parseInt(data.hostport) || 25565
    };
}

/**
 * Simple ping using basic protocol (backup method)
 * Uses Minecraft Server List Ping
 */
async function pingServer(host, port = 25565, timeout = 3000) {
    const net = require('net');

    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let timeoutId = null;
        let dataBuffer = Buffer.alloc(0);

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            try { client.destroy(); } catch (e) { }
        };

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Ping timeout'));
        }, timeout);

        client.connect(port, host, () => {
            // Send handshake packet
            const hostBuf = Buffer.from(host, 'utf8');
            const packetData = Buffer.alloc(7 + hostBuf.length);
            let offset = 0;

            packetData.writeUInt8(0x00, offset++); // Packet ID
            packetData.writeUInt8(0x00, offset++); // Protocol version (varint)
            packetData.writeUInt8(hostBuf.length, offset++); // Host length
            hostBuf.copy(packetData, offset); offset += hostBuf.length;
            packetData.writeUInt16BE(port, offset); offset += 2;
            packetData.writeUInt8(0x01, offset++); // Next state: status

            const lengthBuf = Buffer.alloc(1);
            lengthBuf.writeUInt8(packetData.length, 0);

            client.write(Buffer.concat([lengthBuf, packetData]));

            // Send status request
            client.write(Buffer.from([0x01, 0x00]));
        });

        client.on('data', (data) => {
            dataBuffer = Buffer.concat([dataBuffer, data]);

            // Try to parse JSON response
            try {
                const str = dataBuffer.toString('utf8');
                const jsonMatch = str.match(/\{.*"players".*\}/s);
                if (jsonMatch) {
                    cleanup();
                    const json = JSON.parse(jsonMatch[0]);
                    resolve({
                        online: true,
                        hostname: json.description?.text || json.description || 'Minecraft Server',
                        version: json.version?.name || 'Unknown',
                        numplayers: json.players?.online || 0,
                        maxplayers: json.players?.max || 20
                    });
                }
            } catch (e) {
                // Keep waiting for more data
            }
        });

        client.on('error', (err) => {
            cleanup();
            reject(err);
        });
    });
}

/**
 * Get server status with fallback methods
 */
async function getServerStatus(host, port = 25565) {
    // Try ping first (more reliable)
    try {
        const status = await pingServer(host, port);
        return status;
    } catch (e) {
        console.log('Ping failed, trying query...');
    }

    // Try query protocol
    try {
        const status = await queryServer(host, port);
        return status;
    } catch (e) {
        console.log('Query failed:', e.message);
    }

    // Server appears offline
    return {
        online: false,
        hostname: 'Server',
        numplayers: 0,
        maxplayers: 0,
        error: 'Server unreachable'
    };
}

module.exports = {
    queryServer,
    pingServer,
    getServerStatus
};
