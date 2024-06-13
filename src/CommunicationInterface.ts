export interface ICommunicator {
    send(queryBuffer: Buffer): void;
    onReceive(handler: (msg: Buffer) => void): void;
    onError(handler: (err: Error) => void): void;
    close(): void;
}
