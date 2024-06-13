import { DNSPacket } from "./PacketInfo";
import { sockets, queriesArray, pendingQueries } from "./StartingPoint";

type UserInterfaceData = { name: string, type: string };

export class DnsClient {
    async start(data: UserInterfaceData[]) {
        await this.processData(data);
    }

    private queryFlow(index: number, headerID: number, name: string, type: string) {
        if (type === "A") {
            const packet = DNSPacket.makeAQuery(headerID, name);
            sockets.performDnsQuery(packet.toBuffer());
        } 
        else if (type === "AAAA") {
            const packet = DNSPacket.makeAAAAQuery(headerID, name);
            sockets.performDnsQuery(packet.toBuffer());
        }
        else if (type === "CNAME") {
            const packet = DNSPacket.makeCNAMEQuery(headerID, name);
            sockets.performDnsQuery(packet.toBuffer());
        }
    }

    private async processData(data: { name: string, type: string }[]) {
        try {
            for (const { name, type } of data) {
                if (!name || !type) {
                    console.error("Invalid data received:", { name, type });
                    continue;
                }

                if (type !== "AAAA" && type !== "A" && type !== "CNAME") {
                    console.error("Invalid record type. Please enter 'A', 'AAAA', or 'CNAME'.");
                    return;
                }

                const randomNumber = Math.floor(Math.random() * 65536); 
                const index = queriesArray.length;
                queriesArray.push({ index, headerID: randomNumber, domainName: name, type, packet: null });

                let resolvePromise: () => void;
                const promise = new Promise<void>((resolve) => {
                    resolvePromise = resolve;
                });

                pendingQueries.set(randomNumber, { promise, resolve: resolvePromise! });

                this.queryFlow(index, randomNumber, name, type);
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    }
}
