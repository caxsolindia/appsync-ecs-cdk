import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface RDSStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    instanceType: string;
    dbUsername: string;
}

export class RDSStack extends cdk.Stack {
    public readonly dbInstance: rds.DatabaseInstance;
    public readonly dbCredentials: secretsmanager.Secret;
    public readonly dbSecurityGroup: ec2.ISecurityGroup;

    constructor(scope: Construct, id: string, props: RDSStackProps) {
        super(scope, id, props);

        const { vpc, instanceType, dbUsername } = props;
        const formattedInstanceType = new ec2.InstanceType(instanceType);

        console.log(`ℹ️ Using RDS Instance Type: ${instanceType}`);
        console.log(`ℹ️ Using DB Username: ${dbUsername}`);

        // Import Security Group ID
        const dbSecurityGroupId = cdk.Fn.importValue('BastionSGId');
        this.dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'ImportedDBSG', dbSecurityGroupId);

        // Database Credentials
        this.dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: dbUsername }),
                generateStringKey: 'password',
                excludePunctuation: true,
            },
        });

        // Create PostgreSQL RDS Database
        this.dbInstance = new rds.DatabaseInstance(this, 'PostgresDB', {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_13_19 }),
            vpc,
            credentials: rds.Credentials.fromSecret(this.dbCredentials),
            allocatedStorage: 20,
            instanceType: formattedInstanceType,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [this.dbSecurityGroup],
        });

        new cdk.CfnOutput(this, 'RDSInstanceEndpoint', { value: this.dbInstance.dbInstanceEndpointAddress });
    }
}
