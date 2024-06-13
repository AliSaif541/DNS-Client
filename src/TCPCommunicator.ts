import * as net from 'net';
import { ICommunicator } from './CommunicationInterface';

export class TcpCommunicator implements ICommunicator {
    private tcpClient: net.Socket;
    private DNS_SERVER = '1.1.1.1';
    private DNS_PORT = 53;

    constructor() {
        this.tcpClient = new net.Socket();
        this.tcpClient.connect(this.DNS_PORT, this.DNS_SERVER);
    }

    send(queryBuffer: Buffer): void {
        const lengthBuffer = Buffer.alloc(2);
        lengthBuffer.writeUInt16BE(queryBuffer.length, 0);
        const tcpBuffer = Buffer.concat([lengthBuffer, queryBuffer]);

        this.tcpClient.write(tcpBuffer);
    }

    onResponse(onReceiveHandler: (msg: Buffer) => void, onErrorHandler: (err: Error) => void): void {
        this.tcpClient.on('data', (data) => onReceiveHandler(data.subarray(2)));
        this.tcpClient.on('error', onErrorHandler);
    }

    close(): void {
        if (this.tcpClient) {
            this.tcpClient.end();
            this.tcpClient.destroy();
        }
    }
}
