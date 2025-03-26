import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
 
export class ECSStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
 
        // Create VPC
        const vpc = new ec2.Vpc(this, 'ECSVPC', { maxAzs: 2 });
 
        // Create ECS Cluster
        const cluster = new ecs.Cluster(this, 'ECSCluster', { vpc });
 
        // Security Group for RDS
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
            vpc,
            description: 'Allow inbound connections to PostgreSQL',
            allowAllOutbound: true,
        });
        dbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432), 'Allow PostgreSQL access');
 
        // Create PostgreSQL RDS Database Secret
        const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
                generateStringKey: 'password',
                excludePunctuation: true,
            },
        });
 
        // Create PostgreSQL RDS Database
        const dbInstance = new rds.DatabaseInstance(this, 'PostgresDB', {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_13_19 }),
            vpc,
            credentials: rds.Credentials.fromSecret(dbCredentials),
            allocatedStorage: 20,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [dbSecurityGroup],
        });
 
        // IAM Role for ECS Tasks
        const ecsTaskRole = new iam.Role(this, 'ECSTaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        ecsTaskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSFullAccess'));
 
        // ECS Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', { taskRole: ecsTaskRole });
        taskDefinition.addContainer('AppContainer', {
            image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
            memoryLimitMiB: 512,
            cpu: 256,
        });
 
        // ECS Service 1
        new ecs.FargateService(this, 'ECSService1', { cluster, taskDefinition });
        // ECS Service 2
        new ecs.FargateService(this, 'ECSService2', { cluster, taskDefinition });
 
        // Bastion Host Security Group
        const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
            vpc,
            description: 'Allow SSH access to Bastion Host',
            allowAllOutbound: true,
        });
        bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH from anywhere');
        dbSecurityGroup.addIngressRule(bastionSecurityGroup, ec2.Port.tcp(5432), 'Allow Bastion to connect to RDS');
 
        // Create Bastion Host
        const bastion = new ec2.Instance(this, 'BastionHost', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.genericLinux({
                'eu-central-1': 'ami-03250b0e01c28d196',
            }),
            securityGroup: bastionSecurityGroup,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            keyName: 'ronak',
        });
 
        // Outputs
        new cdk.CfnOutput(this, 'BastionHostPublicIP', { value: bastion.instancePublicIp });
        new cdk.CfnOutput(this, 'RDSInstanceEndpoint', { value: dbInstance.dbInstanceEndpointAddress });
    }
}