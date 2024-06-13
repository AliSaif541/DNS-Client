import * as dgram from 'dgram';
import { ICommunicator } from './CommunicationInterface';

export class UdpCommunicator implements ICommunicator {
    private udpSocket: dgram.Socket;
    private DNS_SERVER = '1.1.1.1';
    private DNS_PORT = 53;

    constructor() {
        this.udpSocket = dgram.createSocket('udp4');
    }

    send(queryBuffer: Buffer): void {
        this.udpSocket.send(queryBuffer, 0, queryBuffer.length, this.DNS_PORT, this.DNS_SERVER, (err) => {
            if (err) {
                console.error('Error sending UDP query:', err);
            }
        });
    }

    onReceive(handler: (msg: Buffer) => void): void {
        this.udpSocket.on('message', handler);
    }

    onError(handler: (err: Error) => void): void {
        this.udpSocket.on('error', handler);
    }

    close(): void {
        if (this.udpSocket) {
            this.udpSocket.close();
        }
    }
}
