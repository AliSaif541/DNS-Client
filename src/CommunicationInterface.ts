export interface ICommunicator {
    send(queryBuffer: Buffer): void;
    onResponse(onReceiveHandler: (msg: Buffer) => void, onErrorHandler: (err: Error) => void): void;
    close(): void;
}
