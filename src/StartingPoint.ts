import { Communicator } from "./CommunicationLayer";
import { DnsClient } from "./DNSClient";
import { DNSInterface } from "./DNSClientInterface";
import { DNSInputInterface } from "./DNSInputInterface";
import { FileInput } from "./FileInput";
import { IOutput } from "./OutputInterface";
import { Output } from "./OutputLayer";
import { ResponseHandler } from './ResponseLayer';
import { CLIInput } from "./UserInterface";

export const sockets = new Communicator(ResponseHandler.handleResponse);
export const Client: DNSInterface = new DnsClient();
export const output: IOutput = new Output;
const inputHandler: DNSInputInterface = new CLIInput;

const mainFunction = async (inputHandler: DNSInputInterface) => {
    try {
        await Client.start(sockets);
        await inputHandler.startInput();
        await Client.waitForPendingQueries();
    } finally {
        sockets.closeSockets();
    }
};

mainFunction(inputHandler);
