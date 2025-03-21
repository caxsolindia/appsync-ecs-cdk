import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class ECSStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'ECSVpc', {
            maxAzs: 2,
        });

        const cluster = new ecs.Cluster(this, 'ECSCluster', {
            vpc,
        });

        new cdk.CfnOutput(this, 'ClusterName', {
            value: cluster.clusterName,
        });
    }
}
