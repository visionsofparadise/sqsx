import {
	DeleteMessageBatchCommand,
	DeleteMessageBatchCommandOutput,
	Message as SQSMessage,
	SendMessageBatchCommand,
	SendMessageBatchCommandOutput
} from '@aws-sdk/client-sqs';
import { BatchParamFunction } from './Batch';
import { Queue } from './Queue';
import { QueueMessage } from './QueueMessage';
import chunk from 'chunk';

export class QueueBatch<Body extends object> {
	messages: Array<QueueMessage<Body>>;

	constructor(public sqsMessages: Array<SQSMessage>, public queue: Queue<Body>) {
		this.messages = sqsMessages.map(sqsMessage => new QueueMessage(sqsMessage, queue));
	}

	send = async (paramFunction?: BatchParamFunction<Body>) => {
		const fallbackParamFunction = paramFunction || (() => {});

		const batches = chunk(this.messages, 10);

		if (this.queue.config.logger) this.queue.config.logger.info({ batches });

		const results: Array<SendMessageBatchCommandOutput> = [];

		for (const batch of batches) {
			const result = await this.queue.client.send(
				new SendMessageBatchCommand({
					QueueUrl: this.queue.config.url,
					Entries: batch.map((message, index) => ({
						Id: message.id,
						MessageBody: message.serializedBody,
						...fallbackParamFunction(message.body, index)
					}))
				})
			);

			results.push(result);
		}

		return results;
	};

	delete = async () => {
		const batches = chunk(this.messages, 10);

		if (this.queue.config.logger) this.queue.config.logger.info({ batches });

		const results: Array<DeleteMessageBatchCommandOutput> = [];

		for (const batch of batches) {
			const result = await this.queue.client.send(
				new DeleteMessageBatchCommand({
					QueueUrl: this.queue.config.url,
					Entries: batch.map(message => ({
						Id: message.id,
						ReceiptHandle: message.receiptHandle
					}))
				})
			);

			results.push(result);
		}

		return results;
	};
}
