import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { IntOrString, KubeDeployment, KubeIngress, KubeService } from 'cdk8s-plus-22/lib/imports/k8s';

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);
    const label = {
      app: "sample-app"
    }

    const podPort = 8080;
    new KubeDeployment(this, "deployment", {
      spec: {
        replicas: 2,
        selector: {
          matchLabels: label
        },
        template: {
          metadata: { labels: label },
          spec: {
            containers: [
              {
                name: 'sample-app',
                image: '100767592238.dkr.ecr.ap-northeast-2.amazonaws.com/sample-app:1.0.1',
                ports: [{ containerPort: podPort }]
              }
            ]
          }
        }
      }
    })

    const servicePort = 30010;
    const service = new KubeService(this, 'service', {
      metadata: {
        name: 'sample-service'
      },
      spec: {
        type: 'NodePort',
        ports: [
          {
            port: 80,
            nodePort: servicePort,
            targetPort: IntOrString.fromNumber(podPort)
          }
        ],
        selector: label
      }
    })

    const annotations = {
      "kubernetes.io/ingress.class": "alb",
      "alb.ingress.kubernetes.io/scheme": "internet-facing"
    }

    new KubeIngress(this, "ingress-alb", {
      metadata: {
        name: 'sample-ingress',
        annotations
      },
      spec: {
        rules: [
          {
            http: {
              paths: [
                {
                  path: "/",
                  pathType: "Prefix",
                  backend: {
                    service: {
                      name: 'sample-service',
                      port: {
                        number: servicePort
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    })
  }
}

const app = new App();
new MyChart(app, 'sample');
app.synth();
