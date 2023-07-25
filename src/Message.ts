import { SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { NoQueueUrl, Queue } from './Queue';

export class Message<Body extends object> {
	constructor(public body: Body, public queue: Queue<Body>) {}

	send = async (params?: NoQueueUrl<Omit<SendMessageCommandInput, 'MessageBody'>>) => {
		const fallbackParams = params || {};

		const sendParams = {
			QueueUrl: this.queue.config.url,
			MessageBody: JSON.stringify(this.body),
			...fallbackParams
		};

		if (this.queue.config.logger) this.queue.config.logger.info({ sendParams });

		return this.queue.client.send(new SendMessageCommand(sendParams));
	};
}
