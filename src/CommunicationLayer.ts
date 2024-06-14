import { ICommunicator } from './CommunicationInterface';
import { UdpCommunicator } from './UDPCommunicator';
import { TcpCommunicator } from './TCPCommunicator';

type ResponseHandler = (responseBuffer: Buffer) => void;

export class Communicator {
    private primaryCommunicator: ICommunicator;
    private secondaryCommunicator: ICommunicator;
    private responseHandler: ResponseHandler;

    constructor(responseHandler: ResponseHandler, primaryCommunicator?: ICommunicator, secondaryCommunicator?: ICommunicator) {
        this.responseHandler = responseHandler;
        this.primaryCommunicator = primaryCommunicator || new UdpCommunicator();
        this.secondaryCommunicator = secondaryCommunicator || new TcpCommunicator();

        this.primaryCommunicator.onResponse(
            (msg) => this.responseHandler(msg),
            (err) => console.error('Primary Communicator error:', err)
        );

        this.secondaryCommunicator.onResponse(
            (data) => this.responseHandler(data.subarray(2)),
            (err) => console.error('Secondary Communicator error:', err)
        );
    }

    async performDnsQuery(queryBuffer: Buffer): Promise<void> {
        try {
            if (queryBuffer.length <= 512) {
                this.primaryCommunicator.send(queryBuffer);
            } else {
                this.secondaryCommunicator.send(queryBuffer);
            }
        } catch (error) {
            console.error('Error during DNS query:', error);
            throw error;
        }
    }

    closeSockets(): void {
        this.primaryCommunicator.close();
        this.secondaryCommunicator.close();
    }
}
