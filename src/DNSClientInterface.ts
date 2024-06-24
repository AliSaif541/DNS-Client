import { Communicator } from "./CommunicationLayer";
import { UserInterfaceData } from "./DNSClient";
import { DNSPacket } from "./DNSPacket";

export interface DNSInterface {
    queriesArray: Array<{
        index: number,
        headerID: number,
        domainName: string,
        type: string,
        packet: DNSPacket | null
    }>;
    pendingQueries: Map<number, { promise: Promise<void>, resolve: () => void }>;

    start(sockets: Communicator): void;
    queryFlow(data: UserInterfaceData[]): void;
    waitForPendingQueries(): void;
}
