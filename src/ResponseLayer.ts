import { pendingQueries, Client } from './StartingPoint';
import { DNSPacket } from './PacketInfo';
import { IOutput } from './OutputInterface';
import { Output } from './OutputLayer';

export class ResponseHandler {
    static handleResponse(responseBuffer: Buffer) {
        const updatedPacket = DNSPacket.parse(responseBuffer);
        const { ID } = updatedPacket.Header;

        const queryIndex = Client.queriesArray.findIndex(query => query.headerID === ID);

        if (queryIndex !== -1) {
            const queryInfo = Client.queriesArray[queryIndex];
            if (queryInfo) {
                Client.queriesArray[queryIndex] = { ...queryInfo, packet: updatedPacket };

                const output: IOutput = new Output(ID);
                output.handleResponse(queryIndex);
            } else {
                console.error(`Query info for ID ${ID} is undefined.`);
            }
        } else {
            console.error(`No query found for ID: ${ID}`);
        }
    }
}
