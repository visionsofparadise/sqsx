import { SQS } from 'aws-sdk';
import { NoQueueUrl, Queue } from './Queue';

export class Message<Body extends object> {
	constructor(public body: Body, public queue: Queue<Body>) {}

	send = async (params?: NoQueueUrl<Omit<SQS.SendMessageRequest, 'MessageBody'>>) => {
		const fallbackParams = params || {};

		return this.queue.sqs
			.sendMessage({
				QueueUrl: this.queue.config.url,
				MessageBody: JSON.stringify(this.body),
				...fallbackParams
			})
			.promise();
	};
}
