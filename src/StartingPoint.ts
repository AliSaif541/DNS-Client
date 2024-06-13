import { Communicator } from "./CommunicationLayer";
import { DnsClient } from "./DNSClient";
import startFileInterface from "./FileInput";
import { DNSPacket } from "./PacketInfo";
import { ResponseHandler } from './ResponseLayer';
import startUserInterface from "./UserInterface";

export const queriesArray: Array<{ index: number, headerID: number, domainName: string, type: string, packet: DNSPacket | null }> = [];
export const pendingQueries = new Map<number, { promise: Promise<void>, resolve: () => void }>();
export const sockets = new Communicator(ResponseHandler.handleResponse);
export const Client = new DnsClient();

const mainFunction = async () => {
   try {
        await startFileInterface();
        await Promise.all(Array.from(pendingQueries.values()).map(entry => entry.promise));
    } finally {
        sockets.closeSockets();
    }
};

mainFunction();
