import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { CognitoStack } from './cognito-stack';

export class AppSyncStack extends cdk.Stack {
    public readonly api: appsync.GraphqlApi;

    constructor(scope: Construct, id: string, cognitoStack: CognitoStack, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create GraphQL API
        this.api = new appsync.GraphqlApi(this, 'GraphQLAPI', {
            name: 'AppSyncECSAPI',
            schema: appsync.SchemaFile.fromAsset('graphql/schema.graphql'), // Updated line
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: cognitoStack.userPool,
                    },
                },
            },
        });

        // Output API URL
        new cdk.CfnOutput(this, 'GraphQLAPIURL', {
            value: this.api.graphqlUrl,
        });
    }
}
