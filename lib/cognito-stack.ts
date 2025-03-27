import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CognitoStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;
    public readonly adminGroup: cognito.CfnUserPoolGroup;
    public readonly userGroup: cognito.CfnUserPoolGroup;

    constructor(scope: Construct, id: string, props: cdk.StackProps & { adminRole: iam.Role; userRole: iam.Role }) {
        super(scope, id, props);

        const { adminRole, userRole } = props;

        // Create Cognito User Pool
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            userPoolName: 'AppSyncECSUserPool',
        });

        // Create Cognito User Pool Groups
        this.adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
            userPoolId: this.userPool.userPoolId,
            groupName: 'Administrator',
            roleArn: adminRole.roleArn,  // Attach admin IAM role
        });

        this.userGroup = new cognito.CfnUserPoolGroup(this, 'UserGroup', {
            userPoolId: this.userPool.userPoolId,
            groupName: 'User',
            roleArn: userRole.roleArn,  // Attach user IAM role
        });

        // Output User Pool ID
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
        });
    }
}