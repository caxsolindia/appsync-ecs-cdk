#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Config } from '../lib/config';
import { CognitoStack } from '../lib/cognito-stack';
import { AppSyncStack } from '../lib/appsync-stack';
import { ECSStack } from '../lib/ecs-stack';
import { IAMStack } from '../lib/iam-stack';
import { VPCStack } from '../lib/vpc-stack';
import { RDSStack } from '../lib/rds-stack';

const app = new cdk.App();

// ✅ Dynamically fetch the current environment from environments.json
const envConfig = Config.getCurrentEnvironment(app);

console.log(`🚀 Deploying for environment: ${envConfig.name}`);
console.log(`ℹ️ AWS Account: ${envConfig.account}`);
console.log(`ℹ️ AWS Region: ${envConfig.region}`);
console.log(`ℹ️ RDS Instance Type: ${envConfig.rdsInstanceType}`);
console.log(`ℹ️ DB Username: ${envConfig.dbUsername}`);

const env = { account: envConfig.account, region: envConfig.region };

// Create VPC Stack
const vpcStack = new VPCStack(app, `VPCStack-${envConfig.name}`, { env });

// Create ECS Stack
const ecsStack = new ECSStack(app, `ECSStack-${envConfig.name}`, { 
    vpc: vpcStack.vpc,
    env
});

// Create RDS Stack
const rdsStack = new RDSStack(app, `RDSStack-${envConfig.name}`, { 
    vpc: vpcStack.vpc,
    instanceType: envConfig.rdsInstanceType, // ✅ Dynamically set RDS instance type
    dbUsername: envConfig.dbUsername, // ✅ Dynamically set DB username
    env
});
rdsStack.addDependency(vpcStack);
rdsStack.addDependency(ecsStack);

// Create Cognito Stack
const cognitoStack = new CognitoStack(app, `CognitoStack-${envConfig.name}`, {
    adminRole: {} as any,
    userRole: {} as any,
    env
});

// Create AppSync Stack
const appsyncStack = new AppSyncStack(app, `AppSyncStack-${envConfig.name}`, cognitoStack, { env });
appsyncStack.addDependency(cognitoStack);

// Create IAM Stack
const iamStack = new IAMStack(app, `IAMStack-${envConfig.name}`, cognitoStack, appsyncStack, { env });
iamStack.addDependency(cognitoStack);
iamStack.addDependency(appsyncStack);

// Assign IAM roles to Cognito stack
(cognitoStack as any).adminRole = iamStack.adminRole;
(cognitoStack as any).userRole = iamStack.userRole;

app.synth();
