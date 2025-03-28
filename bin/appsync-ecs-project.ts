#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { AppSyncStack } from '../lib/appsync-stack';
import { ECSStack } from '../lib/ecs-stack';
import { IAMStack } from '../lib/iam-stack';
import { VPCStack } from '../lib/vpc-stack';
import { RDSStack } from '../lib/rds-stack';

const app = new cdk.App();

// Get environment name (default to "dev" if not specified)
const envName = process.env.ENV || "dev";
const envConfig = app.node.tryGetContext(envName);

if (!envConfig) {
  throw new Error(`Environment configuration for '${envName}' not found in cdk.context.json`);
}

// Define environment properties
const env = { account: envConfig.account, region: envConfig.region };

// Create VPC Stack first (needed by RDS and ECS)
const vpcStack = new VPCStack(app, `VPCStack-${envName}`, { env });

// Create ECS Stack first (so it exports Security Group for RDS)
const ecsStack = new ECSStack(app, `ECSStack-${envName}`, { 
  vpc: vpcStack.vpc,
  env,
});

// Create RDS Stack (imports Security Group from ECSStack)
const rdsStack = new RDSStack(app, `RDSStack-${envName}`, { 
  vpc: vpcStack.vpc,
  env,
});

// Create Cognito Stack first (needed by IAMStack)
const cognitoStack = new CognitoStack(app, `CognitoStack-${envName}`, {
  adminRole: {} as any,  
  userRole: {} as any,
  env,
});

// Create AppSync Stack (depends on Cognito)
const appsyncStack = new AppSyncStack(app, `AppSyncStack-${envName}`, cognitoStack, { env });

// Create IAM Stack (depends on Cognito and AppSync)
const iamStack = new IAMStack(app, `IAMStack-${envName}`, cognitoStack, appsyncStack, { env });

// Patch Cognito Stack with correct roles
(cognitoStack as any).adminRole = iamStack.adminRole;
(cognitoStack as any).userRole = iamStack.userRole;

app.synth();
