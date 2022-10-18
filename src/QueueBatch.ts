import { AWSError, SQS } from 'aws-sdk';
import { BatchParamFunction } from './Batch';
import { Queue } from './Queue';
import { QueueMessage } from './QueueMessage';
import chunk from 'chunk';
import { PromiseResult } from 'aws-sdk/lib/request';

export class QueueBatch<QMA extends object> {
	messageData: Array<{ message: QueueMessage<QMA>; rawMessage: SQS.Message }>;
	messages: Array<QueueMessage<QMA>>;

	constructor(public rawMessages: SQS.MessageList, public queue: Queue<QMA>) {
		this.messageData = rawMessages.map(rawMessage => ({ message: new QueueMessage(rawMessage, queue), rawMessage }));
		this.messages = rawMessages.map(rawMessage => new QueueMessage(rawMessage, queue));
	}

	send = async (paramFunction?: BatchParamFunction<QMA>) => {
		const fallbackParamFunction = paramFunction || (() => {});

		const batches = chunk(this.messageData, 10);

		const results: Array<PromiseResult<SQS.SendMessageBatchResult, AWSError>> = [];

		for (const batch of batches) {
			const result = await this.queue.sqs
				.sendMessageBatch({
					QueueUrl: this.queue.config.url,
					Entries: batch.map((messageData, index) => ({
						Id: messageData.rawMessage.MessageId!,
						MessageBody: messageData.rawMessage.Body!,
						...fallbackParamFunction(messageData.message.message, index)
					}))
				})
				.promise();

			results.push(result);
		}

		return results;
	};

	delete = async () => {
		const batches = chunk(this.messageData, 10);

		const results: Array<PromiseResult<SQS.DeleteMessageBatchResult, AWSError>> = [];

		for (const batch of batches) {
			const result = await this.queue.sqs
				.deleteMessageBatch({
					QueueUrl: this.queue.config.url,
					Entries: batch.map(messageData => ({
						Id: messageData.rawMessage.MessageId!,
						ReceiptHandle: messageData.rawMessage.ReceiptHandle!
					}))
				})
				.promise();

			results.push(result);
		}

		return results;
	};
}
