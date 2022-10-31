import { AWSError, SQS } from 'aws-sdk';
import { BatchParamFunction } from './Batch';
import { Queue } from './Queue';
import { QueueMessage } from './QueueMessage';
import chunk from 'chunk';
import { PromiseResult } from 'aws-sdk/lib/request';

export class QueueBatch<Body extends object> {
	messages: Array<QueueMessage<Body>>;

	constructor(public sqsMessages: SQS.MessageList, public queue: Queue<Body>) {
		this.messages = sqsMessages.map(sqsMessage => new QueueMessage(sqsMessage, queue));
	}

	send = async (paramFunction?: BatchParamFunction<Body>) => {
		const fallbackParamFunction = paramFunction || (() => {});

		const batches = chunk(this.messages, 10);

		const results: Array<PromiseResult<SQS.SendMessageBatchResult, AWSError>> = [];

		for (const batch of batches) {
			const result = await this.queue.sqs
				.sendMessageBatch({
					QueueUrl: this.queue.config.url,
					Entries: batch.map((message, index) => ({
						Id: message.id,
						MessageBody: message.serializedBody,
						...fallbackParamFunction(message.body, index)
					}))
				})
				.promise();

			results.push(result);
		}

		return results;
	};

	delete = async () => {
		const batches = chunk(this.messages, 10);

		const results: Array<PromiseResult<SQS.DeleteMessageBatchResult, AWSError>> = [];

		for (const batch of batches) {
			const result = await this.queue.sqs
				.deleteMessageBatch({
					QueueUrl: this.queue.config.url,
					Entries: batch.map(message => ({
						Id: message.id,
						ReceiptHandle: message.receiptHandle
					}))
				})
				.promise();

			results.push(result);
		}

		return results;
	};
}
