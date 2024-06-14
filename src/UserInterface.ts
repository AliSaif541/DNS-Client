import * as readline from 'readline';
import { DNSInputInterface } from './DNSInputInterface';
import { Client } from './StartingPoint';

export class CLIInput implements DNSInputInterface {
    private rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    private askQuestion(query: string): Promise<string> {
        return new Promise(resolve => this.rl.question(query, resolve));
    }

    async startInput(): Promise<void> {
        try {
            while (true) {
                const domainName = await this.askQuestion("Enter the domain name(Type 'exit' to end the program): ");
                if (domainName == "exit") {
                    return;
                }
                const recordType = await this.askQuestion("Enter the record type (A, AAAA, CNAME): ");
        
                await Client.queryFlow([{ name: domainName, type: recordType }]);
            }
        } catch (error) {
            console.error("Error getting user input:", error);
        } finally {
            this.rl.close();
        }
    }
}
