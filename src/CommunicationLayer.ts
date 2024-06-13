import * as dgram from 'dgram';
import * as net from 'net';

const DNS_SERVER = '1.1.1.1';
const DNS_PORT = 53;

type ResponseHandler = (responseBuffer: Buffer) => void;

export class Communicator {
    private udpSocket: dgram.Socket;
    private tcpClient: net.Socket;
    private responseHandler: ResponseHandler;

    constructor(responseHandler: ResponseHandler) {
        this.udpSocket = dgram.createSocket('udp4');
        this.tcpClient = new net.Socket();
        this.responseHandler = responseHandler;

        this.tcpClient.connect(DNS_PORT, DNS_SERVER);
        
        this.udpSocket.on('message', (msg) => this.responseHandler(msg));
        this.udpSocket.on('error', (err) => console.error('UDP Socket error:', err));
        
        this.tcpClient.on('data', (data) => this.responseHandler(data.subarray(2)));
        this.tcpClient.on('error', (err) => console.error('TCP Client error:', err));
    }

    private sendDnsQueryUdp(queryBuffer: Buffer): void {
        this.udpSocket.send(queryBuffer, 0, queryBuffer.length, DNS_PORT, DNS_SERVER, (err) => {
            if (err) {
                console.error('Error sending UDP query:', err);
            }
        });
    }

    private sendDnsQueryTcp(queryBuffer: Buffer): void {
        const lengthBuffer = Buffer.alloc(2);
        lengthBuffer.writeUInt16BE(queryBuffer.length, 0);
        const tcpBuffer = Buffer.concat([lengthBuffer, queryBuffer]);

        this.tcpClient.write(tcpBuffer);
    }

    async performDnsQuery(queryBuffer: Buffer): Promise<void> {
        try {
            if (queryBuffer.length <= 512) {
                this.sendDnsQueryUdp(queryBuffer);
            } else {
                this.sendDnsQueryTcp(queryBuffer);
            }
        } catch (error) {
            console.error('Error during DNS query:', error);
            throw error;
        }
    }

    closeSockets(): void {
        if (this.udpSocket) {
            this.udpSocket.close();
        }

        if (this.tcpClient) {
            this.tcpClient.end();
            this.tcpClient.destroy();
        }
    }
}
