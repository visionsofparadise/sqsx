import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class SQSXStack extends Stack {
	public readonly queueUrl: CfnOutput;

	constructor(scope: Construct, id: string, props: StackProps & { stage: string; deploymentName: string }) {
		super(scope, id, props);

		const queue = new Queue(this, 'queue', {
			queueName: `${props.deploymentName}-queue`
		});

		this.queueUrl = new CfnOutput(this, `${props.deploymentName}-queueUrl`, {
			value: queue.queueUrl,
			exportName: `${props.deploymentName}-queueUrl`
		});
	}
}
