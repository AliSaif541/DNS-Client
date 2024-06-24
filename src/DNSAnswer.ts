interface AnswerData {
    name: string;
    type: number;
    rClass: number;
    ttl: number,
    len: number;
    rData: Buffer

}

export class DNSAnswer {
    Name: string;
    Type: number;
    Class: number;
    TTL: number;
    Len: number;
    RData: Buffer;

    constructor(answerData: AnswerData) {
        const {name, type, rClass, ttl, len, rData} = answerData
        this.Name = name;
        this.Type = type;
        this.Class = rClass;
        this.TTL = ttl;
        this.Len = len;
        this.RData = rData;
    }

    static addAnswer(answerData: AnswerData): DNSAnswer {
        return new DNSAnswer(answerData);
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
            
            answers.push(new DNSAnswer({name: name.value, type, rClass, ttl, len: length, rData}));
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