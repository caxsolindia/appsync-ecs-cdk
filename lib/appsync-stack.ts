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


        // Create a "None" Data Source (does not connect to a backend)
        const noneDataSource = this.api.addNoneDataSource('NoneDataSource');

        // Attach Resolver to "hello" Query
        noneDataSource.createResolver('HelloResolver', {
            typeName: 'Query', // Matches schema
            fieldName: 'hello', // Matches the field in schema
            requestMappingTemplate: appsync.MappingTemplate.fromString(
                JSON.stringify({
                    version: "2017-02-28",
                    payload: {},
                })
            ),
            responseMappingTemplate: appsync.MappingTemplate.fromString('"Hello, world!"'),
        });

        // Output API URL
        new cdk.CfnOutput(this, 'GraphQLAPIURL', {
            value: this.api.graphqlUrl,
        });
    }
}