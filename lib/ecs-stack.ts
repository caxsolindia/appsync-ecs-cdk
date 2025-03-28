import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ECSStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class ECSStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ECSStackProps) {
        super(scope, id, props);

        const { vpc } = props;

        // Create ECS Cluster
        const cluster = new ecs.Cluster(this, 'ECSCluster', { vpc });

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

        // ECS Services
        new ecs.FargateService(this, 'ECSService1', { cluster, taskDefinition });
        new ecs.FargateService(this, 'ECSService2', { cluster, taskDefinition });

        // Bastion Host Security Group
        const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
            vpc,
            description: 'Allow SSH access to Bastion Host',
            allowAllOutbound: true,
        });
        bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH from anywhere');

        // Export Security Group ID so RDSStack can import it
        new cdk.CfnOutput(this, 'BastionSGId', {
            value: bastionSecurityGroup.securityGroupId,
            exportName: 'BastionSGId',
        });

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
    }
}
