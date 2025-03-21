import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class ECSStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create VPC
        const vpc = new ec2.Vpc(this, 'ECSVPC', { maxAzs: 2 });

        // Create ECS Cluster
        const cluster = new ecs.Cluster(this, 'ECSCluster', { vpc });

        // Create PostgreSQL RDS Database
        const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials');

        const dbInstance = new rds.DatabaseInstance(this, 'PostgresDB', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_13,
            }),
            vpc,
            credentials: rds.Credentials.fromSecret(dbCredentials),
            allocatedStorage: 20,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        });

        // Define ECS Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');

        // Add Container
        taskDefinition.addContainer('AppContainer', {
            image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
            memoryLimitMiB: 512,
            cpu: 256,
        });

        // Create ECS Service
        new ecs.FargateService(this, 'ECSService', {
            cluster,
            taskDefinition,
        });
    }
}
