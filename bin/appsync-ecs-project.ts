#!/usr/bin/env node
// import * as cdk from 'aws-cdk-lib';
// import { AppsyncEcsProjectStack } from '../lib/appsync-ecs-project-stack';

// const app = new cdk.App();
// new AppsyncEcsProjectStack(app, 'AppsyncEcsProjectStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });


import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { AppSyncStack } from '../lib/appsync-stack';
import { ECSStack } from '../lib/ecs-stack';

const app = new cdk.App();

// Create Stacks in Proper Order
const cognitoStack = new CognitoStack(app, 'CognitoStack');
const appsyncStack = new AppSyncStack(app, 'AppSyncStack', cognitoStack);
const ecsStack = new ECSStack(app, 'ECSStack');






