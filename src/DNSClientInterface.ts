import { UserInterfaceData } from "./DNSClient";
import { DNSPacket } from "./PacketInfo";

export interface DNSInterface {
    queriesArray: Array<{ index: number, headerID: number, domainName: string, type: string, packet: DNSPacket | null }>;
    start(): void;
    queryFlow(data: UserInterfaceData[]): void;
}
