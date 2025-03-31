import { App } from "aws-cdk-lib";
import { readFileSync } from "fs";

export interface Environment {
    name: string;
    account: string;
    region: string;
    rdsInstanceType: string;
    dbUsername: string;
}

export class Config {
    private static environments: Environment[] = JSON.parse(
        readFileSync("environments.json", "utf-8")
    ).environments;

    public static getConfig(envName: string): Environment {
        console.log(`🔍 Looking for environment: ${envName}`);
        const env = this.environments.find(e => e.name === envName);
        if (!env) {
            throw new Error(`❌ No such environment: ${envName}`);
        }
        return env;
    }

    public static getCurrentEnvironment(app: App): Environment {
        const envName = app.node.tryGetContext("env") || "dev"; // Default to "dev"
        console.log(`🛠️ Detected environment from CDK context: ${envName}`);
        return this.getConfig(envName);
    }
}
