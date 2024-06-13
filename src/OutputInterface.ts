import { DNSPacket } from "./PacketInfo";

export interface IOutput {
    ID: number;
    findingIPAddress(): string[];
    outputAnswer(results: string[], updatedPacket: DNSPacket, queryIndex: number, ID: number): void;
}
