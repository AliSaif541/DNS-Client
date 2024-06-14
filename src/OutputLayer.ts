import { IOutput } from './OutputInterface';
import { DNSPacket } from "./PacketInfo";
import { Client, pendingQueries } from "./StartingPoint";


export class Output implements IOutput {
    ID: number;

    constructor(ID: number) {
        this.ID = ID;
    }

    private findingIPAddress(): string[] {
        const storedValue = Client.queriesArray.find(query => query.headerID === this.ID);
        const packet = storedValue?.packet;

        if (packet) {
            const addresses = DNSPacket.findIPAddresses(packet);
            return addresses;
        }

        return [];
    }

    private outputAnswer(results: string[], queryIndex: number): void {
        const storedValue = Client.queriesArray.find(query => query.headerID === this.ID);
        const updatedPacket = storedValue?.packet;
        if (updatedPacket) {
            console.log(`Index ${queryIndex}: ${updatedPacket.Questions[0].Name}, ${updatedPacket.Questions[0].Type}: `);
            if (results.length !== 0) {
                console.log(results);
            } 
            else {
                console.log("No IP Adresses found");
            }
    
            const pendingQuery = pendingQueries.get(this.ID);
            if (pendingQuery) {
                pendingQuery.resolve();
                pendingQueries.delete(this.ID);
            }
        }
    }

    handleResponse(queryIndex: number) {
        const result = this.findingIPAddress();
        this.outputAnswer(result, queryIndex);
    }
}
