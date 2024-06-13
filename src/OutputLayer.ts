// OutputLayer.ts
import { IOutput } from './OutputInterface';
import { DNSPacket } from "./PacketInfo";
import { pendingQueries, queriesArray } from "./StartingPoint";

export class Output implements IOutput {
    ID: number;

    constructor(ID: number) {
        this.ID = ID;
    }

    findingIPAddress(): string[] {
        const storedValue = queriesArray.find(query => query.headerID === this.ID);
        const packet = storedValue?.packet;
        const addresses: string[] = [];

        if (packet) {
            for (let i = 0; i < packet.Answers.length; i++) {
                if (packet.Answers[i].Type === 1) { // A
                    addresses.push(`${packet.Answers[i].RData[0]}.${packet.Answers[i].RData[1]}.${packet.Answers[i].RData[2]}.${packet.Answers[i].RData[3]}`);
                } 
                else if (packet.Answers[i].Type === 28) { // AAAA
                    let addressString = '';
                    for (let j = 0; j < packet.Answers[i].RData.length; j += 2) {
                        addressString += packet.Answers[i].RData.readUInt16BE(j).toString(16) + ':';
                    }
                    addresses.push(addressString.slice(0, -1));
                } 
                else if (packet.Answers[i].Type === 5) { // CNAME
                    const cname = this.decodeCNAME(packet.Answers[i].RData);
                    addresses.push(cname);
                }
            }
        }
        return addresses;
    }

    outputAnswer(results: string[], updatedPacket: DNSPacket, queryIndex: number, ID: number): void {
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
    
    private decodeCNAME(rData: Buffer): string {
        let cname = '';
        let i = 0;
        while (i < rData.length) {
            const length = rData[i];
            if (length === 0) break;
            if (cname.length > 0) cname += '.';
            cname += rData.slice(i + 1, i + 1 + length).toString('ascii');
            i += length + 1;
        }
        return cname;
    }
}
