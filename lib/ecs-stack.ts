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

        // Create Security Group for RDS
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
            vpc,
            description: 'Allow inbound connections to PostgreSQL',
            allowAllOutbound: true,
        });

        // Allow ECS tasks to connect to RDS on port 5432
        dbSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(), // Open to all ECS services
            ec2.Port.tcp(5432),
            'Allow PostgreSQL access'
        );

        // Create PostgreSQL RDS Database Secret
        const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
                generateStringKey: 'password',
                excludePunctuation: true, // Avoid special characters
            },
        });

        // Create PostgreSQL RDS Database
        const dbInstance = new rds.DatabaseInstance(this, 'PostgresDB', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_13_19,
            }),
            vpc,
            credentials: rds.Credentials.fromSecret(dbCredentials),
            allocatedStorage: 20,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [dbSecurityGroup],
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

        // Create Security Group for Bastion Host
        const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
            vpc,
            description: 'Allow SSH access to Bastion Host',
            allowAllOutbound: true,
        });

        // Allow SSH from anywhere (0.0.0.0/0)
        bastionSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(), // Open SSH to all
            ec2.Port.tcp(22),
            'Allow SSH from anywhere'
        );

        // Allow Bastion to access RDS
        dbSecurityGroup.addIngressRule(
            bastionSecurityGroup,
            ec2.Port.tcp(5432),
            'Allow Bastion Host to connect to RDS'
        );

        // Create Bastion Host (Ubuntu)
        const bastion = new ec2.Instance(this, 'BastionHost', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.genericLinux({
                'eu-central-1': 'ami-03250b0e01c28d196', // Updated Ubuntu AMI
            }),
            securityGroup: bastionSecurityGroup,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            keyName: 'ronak', // Updated key pair
        });

        // Output Bastion Public IP
        new cdk.CfnOutput(this, 'BastionHostPublicIP', {
            value: bastion.instancePublicIp,
            description: 'Public IP of the Bastion Host',
        });

        // Output RDS Endpoint
        new cdk.CfnOutput(this, 'RDSInstanceEndpoint', {
            value: dbInstance.dbInstanceEndpointAddress,
            description: 'Endpoint of the RDS Instance',
        });
    }
}
