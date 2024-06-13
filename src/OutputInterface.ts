import { DNSPacket } from "./PacketInfo";

export interface IOutput {
    ID: number;
    handleResponse(queryIndex: number): void;
}
