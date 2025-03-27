#!/usr/bin/env node
// // import * as cdk from 'aws-cdk-lib';
// // import { AppsyncEcsProjectStack } from '../lib/appsync-ecs-project-stack';

// // const app = new cdk.App();
// // new AppsyncEcsProjectStack(app, 'AppsyncEcsProjectStack', {
// //   /* If you don't specify 'env', this stack will be environment-agnostic.
// //    * Account/Region-dependent features and context lookups will not work,
// //    * but a single synthesized template can be deployed anywhere. */

// //   /* Uncomment the next line to specialize this stack for the AWS Account
// //    * and Region that are implied by the current CLI configuration. */
// //   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

// //   /* Uncomment the next line if you know exactly what Account and Region you
// //    * want to deploy the stack to. */
// //   // env: { account: '123456789012', region: 'us-east-1' },

// //   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// // });


// import * as cdk from 'aws-cdk-lib';
// import { CognitoStack } from '../lib/cognito-stack';
// import { AppSyncStack } from '../lib/appsync-stack';
// import { ECSStack } from '../lib/ecs-stack';
// import { IAMStack } from '../lib/iam-stack'; // Import the IAM stack


// const app = new cdk.App();

// const iamStack = new IAMStack(app, 'IAMStack');

// // Create Stacks in Proper Order
// // const cognitoStack = new CognitoStack(app, 'CognitoStack');
// const cognitoStack = new CognitoStack(app, 'CognitoStack', {
//     adminRole: iamStack.adminRole,
//     userRole: iamStack.userRole,
// });
// const appsyncStack = new AppSyncStack(app, 'AppSyncStack', cognitoStack);
// const ecsStack = new ECSStack(app, 'ECSStack');
// // const iamStack = new IAMStack(app, 'IAMStack', cognitoStack, appsyncStack); // Add IAM Stack

import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { AppSyncStack } from '../lib/appsync-stack';
import { ECSStack } from '../lib/ecs-stack';
import { IAMStack } from '../lib/iam-stack';

const app = new cdk.App();

// Create Cognito Stack first (needed by IAMStack)
const cognitoStack = new CognitoStack(app, 'CognitoStack', {
    adminRole: {} as any,  
    userRole: {} as any,
});

//  Create AppSync Stack (depends on Cognito)
const appsyncStack = new AppSyncStack(app, 'AppSyncStack', cognitoStack);

//  Create IAM Stack (depends on Cognito and AppSync)
const iamStack = new IAMStack(app, 'IAMStack', cognitoStack, appsyncStack);

//  Patch Cognito Stack with correct roles
(cognitoStack as any).adminRole = iamStack.adminRole;
(cognitoStack as any).userRole = iamStack.userRole;

// Step 5: Create ECS Stack (not dependent on Cognito/AppSync)
const ecsStack = new ECSStack(app, 'ECSStack');