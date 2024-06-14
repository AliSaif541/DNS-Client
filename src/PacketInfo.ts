import { Client } from "./StartingPoint";

class DNSHeader {
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

    static decodeHeader(buffer: Buffer): {ID: number, flags: string, QDCOUNT: number, ANCOUNT: number, NSCOUNT: number, ARCOUNT: number} {
        const ID = buffer.readUInt16BE(0);
        const flags = buffer.readUInt16BE(2).toString(16);
        const QDCOUNT = buffer.readUInt16BE(4);
        const ANCOUNT = buffer.readUInt16BE(6);
        const NSCOUNT = buffer.readUInt16BE(8);
        const ARCOUNT = buffer.readUInt16BE(10);
        
        return { ID, flags, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT };
    }
}

class DNSQuestion {
    Name: string;
    Type: number;
    Class: number;

    constructor(Name: string, Type: string) {
        this.Name = Name;
        this.Type = this.getType(Type);
        this.Class = 0x0001;
    }

    getType (Type: string): number {
        if (Type === "A") {
            return 0x0001;
        } 
        else if (Type === "AAAA") {
            return 0x001c;
        } 
        else if (Type === "CNAME") {
            return 0x0005;
        } 
        else {
            throw new Error(`Unsupported query type: ${Type}`);
        }
    }

    toBuffer(): Buffer {
        const labels = this.Name.split('.');
        const parts = labels.map(label => {
            const len = Buffer.alloc(1);
            len.writeUInt8(label.length, 0);
            return Buffer.concat([len, Buffer.from(label)]);
        });
        const nullLabel = Buffer.alloc(1, 0);

        const typeBuffer = Buffer.alloc(2);
        typeBuffer.writeUInt16BE(this.Type, 0);
        const classBuffer = Buffer.alloc(2);
        classBuffer.writeUInt16BE(this.Class, 0);

        return Buffer.concat([...parts, nullLabel, typeBuffer, classBuffer]);
    }

    static ParseQuestion(buffer: Buffer, startPosition: number): { question: DNSQuestion, size: number } {
        let currentPosition = startPosition;
        let labels: string[] = [];
        
        while (buffer[currentPosition] !== 0) {
            const labelLength = buffer[currentPosition++];
            labels.push(buffer.toString('ascii', currentPosition, currentPosition + labelLength));
            currentPosition += labelLength;
        }
        
        const name = labels.join('.');
        currentPosition++; // Skip the null byte
        const type = buffer.readUInt16BE(currentPosition);
        currentPosition += 2;
        const rClass = buffer.readUInt16BE(currentPosition);
        currentPosition += 2;

        const question = new DNSQuestion(name, type === 0x0001 ? 'A' : type === 0x001c ? 'AAAA' : 'CNAME');
        question.Class = rClass;

        return { question, size: currentPosition - startPosition };
    }
}

class DNSAnswer {
    Name: string;
    Type: number;
    Class: number;
    TTL: number;
    Len: number;
    RData: Buffer;

    constructor(name: string, type: number, rClass: number, ttl: number, len: number, rData: Buffer) {
        this.Name = name;
        this.Type = type;
        this.Class = rClass;
        this.TTL = ttl;
        this.Len = len;
        this.RData = rData;
    }

    static addAnswer(name: string, type: number, rClass: number, ttl: number, len: number, rData: Buffer): DNSAnswer {
        return new DNSAnswer(name, type, rClass, ttl, len, rData);
    }

    static ParseAnswer(buffer: Buffer, ANCOUNT: number, startPosition: number): { answers: DNSAnswer[], newPosition: number } {
        let currentPosition = startPosition;
        let answers: DNSAnswer[] = [];
        
        for (let i = 0; i < ANCOUNT; i++) {
            let name = DNSAnswer.decodeName(buffer, currentPosition);
            currentPosition = name.size;
            const type = buffer.readUInt16BE(currentPosition);
            currentPosition += 2;
            const rClass = buffer.readUInt16BE(currentPosition);
            currentPosition += 2;
            const ttl = buffer.readUInt32BE(currentPosition);
            currentPosition += 4;
            const length = buffer.readUInt16BE(currentPosition);
            currentPosition += 2;
            const rData = buffer.subarray(currentPosition, currentPosition + length);
            currentPosition += length;
            
            answers.push(new DNSAnswer(name.value, type, rClass, ttl, length, rData));
        }
        
        return { answers, newPosition: currentPosition };
    }
    
    static decodeName(buffer: Buffer, currentPosition: number): { size: number, value: string } {
        let labels: string[] = [];
        let jumped = false;
        let initialPosition = currentPosition;
        let size = 0;
        let orgCurrent = currentPosition;
        
        while (buffer[currentPosition] !== 0) {
            if ((buffer[currentPosition] & 0xC0) === 0xC0) {
                if (!jumped) {
                    initialPosition += 2;
                }
                jumped = true;
                const offset = buffer.readUInt16BE(currentPosition) & 0x3FFF;
                currentPosition = offset;
            } 
            else {
                const labelLength = buffer[currentPosition++];
                labels.push(buffer.toString('ascii', currentPosition, currentPosition + labelLength));
                currentPosition += labelLength;
                if (!jumped) {
                    size += labelLength + 1;
                }
            }
        }

        if (!jumped) {
            size += 1;
        }
        
        return { size: jumped ? orgCurrent + 2 : size, value: labels.join('.') };
    }
}

export class DNSPacket {
    Header: DNSHeader;
    Questions: DNSQuestion[];
    Answers: DNSAnswer[];

    private constructor(headerID: number) {
        this.Header = new DNSHeader(headerID);
        this.Questions = [];
        this.Answers = [];
    }

    static makeAQuery(headerID: number, domain: string): DNSPacket {
        const packet = new DNSPacket(headerID);
        packet.addQuery(domain, 'A');
        return packet;
    }

    static makeAAAAQuery(headerID: number, domain: string): DNSPacket {
        const packet = new DNSPacket(headerID);
        packet.addQuery(domain, 'AAAA');
        return packet;
    }

    static makeCNAMEQuery(headerID: number, domain : string): DNSPacket {
        const packet = new DNSPacket(headerID);
        packet.addQuery(domain, 'CNAME');
        return packet;
    }

    addQuery(domain: string, type: string): void {
        const question = new DNSQuestion(domain, type);
        this.Questions.push(question);
        this.Header.QDCOUNT++;
    }

    toBuffer(): Buffer {
        const questionBuffers = this.Questions.map(question => question.toBuffer());
        return Buffer.concat([this.Header.toBuffer(), ...questionBuffers]);
    }

    static parse(response: Buffer): DNSPacket {
        const header = DNSHeader.decodeHeader(response);
    
        const entry = Client.queriesArray.find(query => query.headerID === header.ID);
        if (!entry) {
            throw new Error("Response Incorrect. Packet could not be identified.");
        }
    
        let currentPosition = 12;
        let questions: DNSQuestion[] = [];
    
        for (let i = 0; i < header.QDCOUNT; i++) {
            const decodedQuestion = DNSQuestion.ParseQuestion(response, currentPosition);
            questions.push(decodedQuestion.question);
            currentPosition += decodedQuestion.size;
        }
    
        const answersDecoded = DNSAnswer.ParseAnswer(response, header.ANCOUNT, currentPosition);
        const answers = answersDecoded.answers;
        currentPosition = answersDecoded.newPosition;
    
        const packet = new DNSPacket(header.ID);
        packet.Header = new DNSHeader(header.ID, parseInt(header.flags, 16));
        packet.Header.QDCOUNT = header.QDCOUNT;
        packet.Header.ANCOUNT = header.ANCOUNT;
        packet.Header.NSCOUNT = header.NSCOUNT;
        packet.Header.ARCOUNT = header.ARCOUNT;
        packet.Questions = questions;
        packet.Answers = answers;
    
        return packet;
    }    

    static findIPAddresses(packet: DNSPacket): string[] {
        const addresses = [];
        for (let i = 0; i < packet.Answers.length; i++) {
            if (packet.Answers[i].Type === 1) { // A
                addresses.push(`${packet.Answers[i].RData[0]}.${packet.Answers[i].RData[1]}.${packet.Answers[i].RData[2]}.${packet.Answers[i].RData[3]}`);
            } 
            else if (packet.Answers[i].Type === 28) { // AAAA
                let addressString = '';
                for (let j = 0; j < packet.Answers[i].RData.length; j += 2) {
                    addressString += packet.Answers[i].RData.readUInt16BE(j).toString(16) + ':';
                }
                addresses.push(addressString.slice(0, -1));
            } 
            else if (packet.Answers[i].Type === 5) { // CNAME
                const cname = this.decodeCNAME(packet.Answers[i].RData);
                addresses.push(cname);
            }
        }

        return addresses;
    }

    static decodeCNAME(rData: Buffer): string {
        let cname = '';
        let i = 0;
        while (i < rData.length) {
            const length = rData[i];
            if (length === 0) break;
            if (cname.length > 0) cname += '.';
            cname += rData.slice(i + 1, i + 1 + length).toString('ascii');
            i += length + 1;
        }
        return cname;
    }
}
