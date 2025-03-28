#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { AppSyncStack } from '../lib/appsync-stack';
import { ECSStack } from '../lib/ecs-stack';
import { IAMStack } from '../lib/iam-stack';
import { VPCStack } from '../lib/vpc-stack';
import { RDSStack } from '../lib/rds-stack';

const app = new cdk.App();

// Get environment name from CDK CLI (default to "dev" if not provided)
const envName = process.env.ENV || "dev";
const envConfig = app.node.tryGetContext(envName);

if (!envConfig) {
  throw new Error(`❌ Environment configuration for '${envName}' not found in cdk.context.json`);
}

// Define AWS account and region
const env = { account: envConfig.account, region: envConfig.region };

// Ensure RDS instance type is correctly formatted
const rdsInstanceType = envConfig.rdsInstanceType;
console.log(`ℹ️ Using RDS instance type: ${rdsInstanceType}`);

// Create VPC Stack (first, since other stacks depend on it)
const vpcStack = new VPCStack(app, `VPCStack-${envName}`, { env });

// Create ECS Stack (depends on VPC)
const ecsStack = new ECSStack(app, `ECSStack-${envName}`, { 
  vpc: vpcStack.vpc,
  env,
});

// Create RDS Stack (depends on VPC and ECS)
const rdsStack = new RDSStack(app, `RDSStack-${envName}`, { 
  vpc: vpcStack.vpc,
  instanceType: rdsInstanceType,  // Correctly formatted instance type
  env,
});
rdsStack.addDependency(vpcStack);
rdsStack.addDependency(ecsStack);

// Create Cognito Stack
const cognitoStack = new CognitoStack(app, `CognitoStack-${envName}`, {
  adminRole: {} as any,  
  userRole: {} as any,
  env,
});

// Create AppSync Stack (depends on Cognito)
const appsyncStack = new AppSyncStack(app, `AppSyncStack-${envName}`, cognitoStack, { env });
appsyncStack.addDependency(cognitoStack);

// Create IAM Stack (depends on Cognito & AppSync)
const iamStack = new IAMStack(app, `IAMStack-${envName}`, cognitoStack, appsyncStack, { env });
iamStack.addDependency(cognitoStack);
iamStack.addDependency(appsyncStack);

// Assign IAM roles back to Cognito Stack
(cognitoStack as any).adminRole = iamStack.adminRole;
(cognitoStack as any).userRole = iamStack.userRole;

app.synth();
