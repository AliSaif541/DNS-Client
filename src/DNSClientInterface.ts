import { UserInterfaceData } from "./DNSClient";

export interface DNSInterface {
    start(): void;
    queryFlow(data: UserInterfaceData[]): void;
}
