import { IOutput } from './OutputInterface';
import { DNSPacket } from "./DNSPacket";
import { Client, pendingQueries } from "./StartingPoint";


export class Output implements IOutput {
    private findingIPAddress(ID: number): string[] {
        const storedValue = Client.queriesArray.find(query => query.headerID === ID);
        const packet = storedValue?.packet;

        if (packet) {
            const addresses = DNSPacket.findIPAddresses(packet);
            return addresses;
        }

        return [];
    }

    private outputAnswer(results: string[], queryIndex: number, ID: number): void {
        const storedValue = Client.queriesArray.find(query => query.headerID === ID);
        const updatedPacket = storedValue?.packet;
        if (updatedPacket) {
            console.log(`Index ${queryIndex}: ${updatedPacket.Questions[0].Name}, ${updatedPacket.Questions[0].Type}: `);
            if (results.length !== 0) {
                console.log(results);
            } 
            else {
                console.log("No IP Adresses found");
            }
    
            const pendingQuery = pendingQueries.get(ID);
            if (pendingQuery) {
                pendingQuery.resolve();
                pendingQueries.delete(ID);
            }
        }
    }

    handleResponse(queryIndex: number, ID: number) {
        const result = this.findingIPAddress(ID);
        this.outputAnswer(result, queryIndex, ID);
    }
}
