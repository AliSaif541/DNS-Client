import { queriesArray, pendingQueries } from './StartingPoint';
import { DNSPacket } from './PacketInfo';
import { Output } from './OutputLayer';

export class ResponseHandler {
    static handleResponse(responseBuffer: Buffer) {
        const updatedPacket = DNSPacket.parse(responseBuffer);
        const { ID } = updatedPacket.Header;

        const queryIndex = queriesArray.findIndex(query => query.headerID === ID);

        if (queryIndex !== -1) {
            const queryInfo = queriesArray[queryIndex];
            if (queryInfo) {
                queriesArray[queryIndex] = { ...queryInfo, packet: updatedPacket };

                const output = new Output(ID);
                console.log(`Index ${queryIndex}: ${updatedPacket.Questions[0].Name}, ${updatedPacket.Questions[0].Type}: `);
                const result = output.findingIPAddress();
                if (result.length !== 0) {
                    console.log(result);
                } 
                else {
                    console.log("No IP Adresses found");
                }

                const pendingQuery = pendingQueries.get(ID);
                if (pendingQuery) {
                    pendingQuery.resolve();
                    pendingQueries.delete(ID);
                }
            } else {
                console.error(`Query info for ID ${ID} is undefined.`);
            }
        } else {
            console.error(`No query found for ID: ${ID}`);
        }
    }
}
