import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class CognitoStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'AppSyncUserPool',
            selfSignUpEnabled: true,
            signInAliases: { email: true },
        });
    }
}
