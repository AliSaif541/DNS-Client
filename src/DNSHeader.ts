interface headerData {
    ID: number;
    flags: string;
    QDCOUNT: number;
    ANCOUNT: number;
    NSCOUNT: number;
    ARCOUNT: number;
}

export class DNSHeader {
    ID: number;
    flags: number;
    QDCOUNT: number;
    ANCOUNT: number;
    NSCOUNT: number;
    ARCOUNT: number;

    constructor(headerID: number, flags: number = 0x0100) {
        this.ID = headerID;
        this.flags = flags;
        this.QDCOUNT = 1;
        this.ANCOUNT = 0;
        this.NSCOUNT = 0;
        this.ARCOUNT = 0;
    }

    toBuffer(): Buffer {
        const buffer = Buffer.alloc(12);
        buffer.writeUInt16BE(this.ID, 0);
        buffer.writeUInt16BE(this.flags, 2);
        buffer.writeUInt16BE(this.QDCOUNT, 4);
        buffer.writeUInt16BE(this.ANCOUNT, 6);
        buffer.writeUInt16BE(this.NSCOUNT, 8);
        buffer.writeUInt16BE(this.ARCOUNT, 10);
        return buffer;
    }

    static decodeHeader(buffer: Buffer): headerData {
        const ID = buffer.readUInt16BE(0);
        const flags = buffer.readUInt16BE(2).toString(16);
        const QDCOUNT = buffer.readUInt16BE(4);
        const ANCOUNT = buffer.readUInt16BE(6);
        const NSCOUNT = buffer.readUInt16BE(8);
        const ARCOUNT = buffer.readUInt16BE(10);
        
        return { ID, flags, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT };
    }
}