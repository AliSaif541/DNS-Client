import * as fs from 'fs';
import * as readline from 'readline';
import { Client } from './StartingPoint';

interface DNSRecord {
  name: string;
  type: string;
}

async function readDNSRecords(filePath: string): Promise<DNSRecord[]> {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const records: DNSRecord[] = [];

  for await (const line of rl) {
    const [domainName, recordType] = line.split(',').map(part => part.trim());
  
    await Client.queryFlow([{ name: domainName, type: recordType }]);
  }

  return records;
}

export default async function startFileInterface(): Promise<void> {
    await readDNSRecords("data.txt");
}