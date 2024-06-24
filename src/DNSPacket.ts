import { DNSAnswer } from "./DNSAnswer";
import { DNSHeader } from "./DNSHeader";
import { DNSQuestion } from "./DNSQuestion";
import { Client } from "./StartingPoint";

export class DNSPacket {
    Header: DNSHeader;
    Questions: DNSQuestion[];
    Answers: DNSAnswer[];
    static readonly TWO_BYTES = 16
    static readonly TYPE_A = 1;
    static readonly TYPE_AAAA = 28;
    static readonly TYPE_CNAME = 5;

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
        packet.Header = new DNSHeader(header.ID, parseInt(header.flags, DNSPacket.TWO_BYTES));
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
            switch (packet.Answers[i].Type) {
                case this.TYPE_A:
                    addresses.push(`${packet.Answers[i].RData[0]}.${packet.Answers[i].RData[1]}.${packet.Answers[i].RData[2]}.${packet.Answers[i].RData[3]}`);
                    break;
                case this.TYPE_AAAA:
                    let addressString = '';
                    for (let j = 0; j < packet.Answers[i].RData.length; j += 2) {
                        addressString += packet.Answers[i].RData.readUInt16BE(j).toString(16) + ':';
                    }
                    addresses.push(addressString.slice(0, -1));
                    break;
                case this.TYPE_CNAME: 
                    const cname = this.decodeCNAME(packet.Answers[i].RData);
                    addresses.push(cname);
                    break;
                default:
                    throw new Error(`Unsupported answer type: ${packet.Answers[i].Type}`);
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
