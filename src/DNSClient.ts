import { DNSPacket } from "./PacketInfo";
import { sockets, queriesArray, pendingQueries } from "./StartingPoint";

type UserInterfaceData = { name: string, type: string };

export class DnsClient {
    async start() {
        // await this.processData(data);
    }

    async queryFlow(data: UserInterfaceData[]) {
        try {
            for (const { name, type } of data) {
                if (!name || !type) {
                    console.error("Invalid data received:", { name, type });
                    return;
                }

                if (type !== "AAAA" && type !== "A" && type !== "CNAME") {
                    console.error(`${name}, ${type}: Invalid record type. Please enter 'A', 'AAAA', or 'CNAME'.`);
                    return;
                }

                let realName = name;
                if (type === "A" || type === "AAAA") {
                    realName = name.replace(/^www\./, ''); 
                }
        
                const randomNumber = Math.floor(Math.random() * 65536); 
                const index = queriesArray.length;
                queriesArray.push({ index, headerID: randomNumber, domainName: realName, type, packet: null });
        
                let resolvePromise: () => void;
                const promise = new Promise<void>((resolve) => {
                    resolvePromise = resolve;
                });
        
                pendingQueries.set(randomNumber, { promise, resolve: resolvePromise! });
        
                if (type === "A") {
                    const packet = DNSPacket.makeAQuery(randomNumber, name);
                    sockets.performDnsQuery(packet.toBuffer());
                } 
                else if (type === "AAAA") {
                    const packet = DNSPacket.makeAAAAQuery(randomNumber, name);
                    sockets.performDnsQuery(packet.toBuffer());
                }
                else if (type === "CNAME") {
                    const packet = DNSPacket.makeCNAMEQuery(randomNumber, name);
                    sockets.performDnsQuery(packet.toBuffer());
                }
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    }
}
