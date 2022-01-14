import { Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, Peer, Port, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { AlbControllerVersion, Cluster, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { AccountRootPrincipal, ManagedPolicy, Role, User } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "sample-vpc-dev", {
      cidr: "10.100.0.0/16",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: SubnetType.PRIVATE_WITH_NAT,
        },
        {
          cidrMask: 28,
          name: 'rds',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        }
      ],
      natGateways: 1,
      vpcName: "SampleK8S-DEV",
    })

    const rootRole = new Role(this, "root-role", {
      assumedBy: new AccountRootPrincipal()
    })

    
    new Repository(this, "sample-app-repository", {
      repositoryName: "sample-app"
    })

    const cluster = new Cluster(this, "sample-eks", {
      version: KubernetesVersion.V1_21,
      albController: {
        version: AlbControllerVersion.V2_3_1,
      },
      defaultCapacity: 2,
      defaultCapacityInstance: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
      clusterName: 'sample-eks',
      vpc: vpc,
      vpcSubnets: [
        {
         subnetGroupName: 'application',
        }
      ],
    })


    for (const subnet of vpc.selectSubnets({subnetGroupName: 'ingress'}).subnets) {
      cluster.clusterSecurityGroup.addIngressRule(Peer.ipv4(subnet.ipv4CidrBlock), Port.tcpRange(30000, 32768))
    }    
  }
}
