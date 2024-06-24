export class DNSQuestion {
    Name: string;
    Type: number;
    Class: number;

    constructor(Name: string, Type: string) {
        this.Name = Name;
        this.Type = this.getType(Type);
        this.Class = 0x0001;
    }

    getType(Type: string): number {
        switch (Type) {
            case "A":
                return 0x0001;
            case "AAAA":
                return 0x001c;
            case "CNAME":
                return 0x0005;
            default:
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