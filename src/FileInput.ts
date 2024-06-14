import * as fs from 'fs';
import * as readline from 'readline';
import { DNSInputInterface } from './DNSInputInterface';
import { Client } from './StartingPoint';

interface DNSRecord {
  name: string;
  type: string;
}

export class FileInput implements DNSInputInterface {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async startInput(): Promise<void> {
        const fileStream = fs.createReadStream(this.filePath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            const [domainName, recordType] = line.split(',').map(part => part.trim());
            await Client.queryFlow([{ name: domainName, type: recordType }]);
        }
    }
}
