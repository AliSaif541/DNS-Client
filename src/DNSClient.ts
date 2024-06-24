import { Communicator } from "./CommunicationLayer";
import { DNSInterface } from "./DNSClientInterface";
import { DNSPacket } from "./DNSPacket";

export type UserInterfaceData = { name: string, type: string };

interface arrayData {
    index: number;
    headerID: number;
    domainName: string;
    type: string;
    packet: DNSPacket | null
}

export class DnsClient implements DNSInterface {
    queriesArray !: Array<arrayData>;
    sockets !: Communicator;
    pendingQueries !: Map<number, { promise: Promise<void>, resolve: () => void }>;

    async start(sockets: Communicator) {
        this.queriesArray = [];
        this.sockets = sockets;
        this.pendingQueries = new Map<number, { promise: Promise<void>, resolve: () => void }>();
    }

    async waitForPendingQueries() {
        await Promise.all(Array.from(this.pendingQueries.values()).map(entry => entry.promise));
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

                this.pendingQueries.set(randomNumber, { promise, resolve: resolvePromise! });

                let packet: DNSPacket;
                switch (type) {
                    case "A":
                        packet = DNSPacket.makeAQuery(randomNumber, name);
                        break;
                    case "AAAA":
                        packet = DNSPacket.makeAAAAQuery(randomNumber, name);
                        break;
                    case "CNAME":
                        packet = DNSPacket.makeCNAMEQuery(randomNumber, name);
                        break;
                    default:
                        continue;
                }
                this.sockets.performDnsQuery(packet.toBuffer());
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    }
}
