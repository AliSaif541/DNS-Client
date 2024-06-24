import { Client, output } from './StartingPoint';
import { DNSPacket } from './DNSPacket';

export class ResponseHandler {
    static handleResponse(responseBuffer: Buffer) {
        const updatedPacket = DNSPacket.parse(responseBuffer);
        const { ID } = updatedPacket.Header;

        const queryIndex = Client.queriesArray.findIndex(query => query.headerID === ID);

        if (queryIndex !== -1) {
            const queryInfo = Client.queriesArray[queryIndex];
            if (queryInfo) {
                Client.queriesArray[queryIndex] = { ...queryInfo, packet: updatedPacket };
                output.handleResponse(queryIndex, ID);
            } else {
                console.error(`Query info for ID ${ID} is undefined.`);
            }
        } else {
            console.error(`No query found for ID: ${ID}`);
        }
    }
}
