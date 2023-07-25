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

export class QueueBatch<Body extends object> {
	messages: Array<QueueMessage<Body>>;

	constructor(public sqsMessages: Array<SQSMessage>, public queue: Queue<Body>) {
		this.messages = sqsMessages.map(sqsMessage => new QueueMessage(sqsMessage, queue));
	}

	send = async (paramFunction?: BatchParamFunction<Body>) => {
		const fallbackParamFunction = paramFunction || (() => {});

		const recurse = async (
			remainingMessages: Array<QueueMessage<Body>>
		): Promise<Array<SendMessageBatchCommandOutput>> => {
			const currentMessages = remainingMessages.slice(0, 10);
			const nextMessages = remainingMessages.slice(10);

			const result = await this.queue.client.send(
				new SendMessageBatchCommand({
					QueueUrl: this.queue.config.url,
					Entries: currentMessages.map((message, index) => ({
						Id: message.id,
						MessageBody: message.serializedBody,
						...fallbackParamFunction(message.body, index)
					}))
				})
			);

			if (nextMessages.length === 0) return [result];

			return [result, ...(await recurse(nextMessages))];
		};

		const results = await recurse(this.messages);

		if (this.queue.config.logger) this.queue.config.logger.info({ results });

		return results;
	};

	delete = async () => {
		const recurse = async (
			remainingMessages: Array<QueueMessage<Body>>
		): Promise<Array<DeleteMessageBatchCommandOutput>> => {
			const currentMessages = remainingMessages.slice(0, 10);
			const nextMessages = remainingMessages.slice(10);

			const result = await this.queue.client.send(
				new DeleteMessageBatchCommand({
					QueueUrl: this.queue.config.url,
					Entries: currentMessages.map(message => ({
						Id: message.id,
						ReceiptHandle: message.receiptHandle
					}))
				})
			);

			if (nextMessages.length === 0) return [result];

			return [result, ...(await recurse(nextMessages))];
		};

		const results = await recurse(this.messages);

		if (this.queue.config.logger) this.queue.config.logger.info({ results });

		return results;
	};
}
