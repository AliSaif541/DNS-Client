import * as readline from 'readline';
import { Client } from './StartingPoint';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function getUserInput(): Promise<void> {
    try {
        while (true) {
            const domainName = await askQuestion("Enter the domain name: ");
            const recordType = await askQuestion("Enter the record type (A, AAAA, CNAME): ");
    
            await Client.queryFlow([{ name: domainName, type: recordType }]);
        }
    } catch (error) {
        console.error("Error getting user input:", error);
    } finally {
        rl.close();
    }
}

export default async function startUserInterface(): Promise<void> {
    await getUserInput();
}
