import { Communicator } from "./CommunicationLayer";
import { DnsClient } from "./DNSClient";
import { DNSInterface } from "./DNSClientInterface";
import { DNSInputInterface } from "./DNSInputInterface";
import { FileInput } from "./FileInput";
import { ResponseHandler } from './ResponseLayer';
import { CLIInput } from "./UserInterface";

export const pendingQueries = new Map<number, { promise: Promise<void>, resolve: () => void }>();
export const sockets = new Communicator(ResponseHandler.handleResponse);
export const Client: DNSInterface = new DnsClient();

const mainFunction = async (inputHandler: DNSInputInterface) => {
    try {
        await Client.start();
        await inputHandler.startInput();
        await Promise.all(Array.from(pendingQueries.values()).map(entry => entry.promise));
    } finally {
        sockets.closeSockets();
    }
};

const inputHandler: DNSInputInterface = new FileInput('data.txt');
mainFunction(inputHandler);