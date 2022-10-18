import { SQS } from 'aws-sdk';
import { NoQueueUrl, Queue } from './Queue';

export class Message<QMA extends object> {
	constructor(public message: QMA, public queue: Queue<QMA>) {}

	send = async (params?: NoQueueUrl<Omit<SQS.SendMessageRequest, 'MessageBody'>>) => {
		const fallbackParams = params || {};

		return this.queue.sqs
			.sendMessage({
				QueueUrl: this.queue.config.url,
				MessageBody: JSON.stringify(this.message),
				...fallbackParams
			})
			.promise();
	};
}
