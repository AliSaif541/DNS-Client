import { ICommunicator } from './CommunicationInterface';
import { UdpCommunicator } from './UDPCommunicator';
import { TcpCommunicator } from './TCPCommunicator';

type ResponseHandler = (responseBuffer: Buffer) => void;

export class Communicator {
    private udpCommunicator: ICommunicator;
    private tcpCommunicator: ICommunicator;
    private responseHandler: ResponseHandler;

    constructor(responseHandler: ResponseHandler, udpCommunicator?: ICommunicator, tcpCommunicator?: ICommunicator) {
        this.responseHandler = responseHandler;
        this.udpCommunicator = udpCommunicator || new UdpCommunicator();
        this.tcpCommunicator = tcpCommunicator || new TcpCommunicator();

        this.udpCommunicator.onResponse(
            (msg) => this.responseHandler(msg),
            (err) => console.error('UDP Communicator error:', err)
        );

        this.tcpCommunicator.onResponse(
            (data) => this.responseHandler(data.subarray(2)),
            (err) => console.error('TCP Communicator error:', err)
        );
    }

    async performDnsQuery(queryBuffer: Buffer): Promise<void> {
        try {
            if (queryBuffer.length <= 512) {
                this.udpCommunicator.send(queryBuffer);
            } else {
                this.tcpCommunicator.send(queryBuffer);
            }
        } catch (error) {
            console.error('Error during DNS query:', error);
            throw error;
        }
    }

    closeSockets(): void {
        this.udpCommunicator.close();
        this.tcpCommunicator.close();
    }
}
