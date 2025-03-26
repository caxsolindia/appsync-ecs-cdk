import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CognitoStack } from './cognito-stack';
import { AppSyncStack } from './appsync-stack';

export class IAMStack extends cdk.Stack {
    public readonly adminRole: iam.Role;
    public readonly userRole: iam.Role;

    constructor(scope: Construct, id: string, cognitoStack: CognitoStack, appsyncStack: AppSyncStack, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create IAM Role for Admin Group (Full DB Access)
        this.adminRole = new iam.Role(this, 'AppSyncAdminRole', {
            assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
        });

        this.adminRole.addToPolicy(new iam.PolicyStatement({
            actions: ['rds:*'], // Full access to RDS
            resources: ['*'], // Ideally, restrict this to the DB ARN
        }));

        // Create IAM Role for User Group (Read-Only DB Access)
        this.userRole = new iam.Role(this, 'AppSyncUserRole', {
            assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
        });

        this.userRole.addToPolicy(new iam.PolicyStatement({
            actions: ['rds:Select'], // Read-only access to DB
            resources: ['*'], // Ideally, restrict this to the DB ARN
        }));

        // Outputs
        new cdk.CfnOutput(this, 'AdminRoleArn', { value: this.adminRole.roleArn });
        new cdk.CfnOutput(this, 'UserRoleArn', { value: this.userRole.roleArn });
    }
}
