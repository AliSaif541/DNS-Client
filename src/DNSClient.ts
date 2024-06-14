import { DNSInterface } from "./DNSClientInterface";
import { DNSPacket } from "./PacketInfo";
import { sockets, pendingQueries } from "./StartingPoint";

export type UserInterfaceData = { name: string, type: string };

export class DnsClient implements DNSInterface {
    queriesArray !: Array<{ index: number, headerID: number, domainName: string, type: string, packet: DNSPacket | null }>;

    async start() {
        // User can initialize their own objects in start through interface
        this.queriesArray = [];
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
                const index = this.queriesArray.length;
                this.queriesArray.push({ index, headerID: randomNumber, domainName: realName, type, packet: null });
        
                let resolvePromise: () => void;
                const promise = new Promise<void>((resolve) => {
                    resolvePromise = resolve;
                });
        
                pendingQueries.set(randomNumber, { promise, resolve: resolvePromise! });
        
                let packet: DNSPacket;
                if (type === "A") {
                    packet = DNSPacket.makeAQuery(randomNumber, name);
                } else if (type === "AAAA") {
                    packet = DNSPacket.makeAAAAQuery(randomNumber, name);
                } else if (type === "CNAME") {
                    packet = DNSPacket.makeCNAMEQuery(randomNumber, name);
                } else {
                    continue; // This line is technically unreachable due to earlier validation
                }
                sockets.performDnsQuery(packet.toBuffer());
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    }
}
