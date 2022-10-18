import { SQS } from 'aws-sdk';
import { Message } from './Message';
import { Queue } from './Queue';

export class QueueMessage<QMA extends object> extends Message<QMA> {
	constructor(public rawMessages: SQS.Message, queue: Queue<QMA>) {
		const Body: QMA = rawMessages.Body ? JSON.parse(rawMessages.Body) : {};

		super(Body, queue);
	}

	delete = async () =>
		this.queue.sqs
			.deleteMessage({
				QueueUrl: this.queue.config.url,
				ReceiptHandle: this.rawMessages.ReceiptHandle!
			})
			.promise();
}
