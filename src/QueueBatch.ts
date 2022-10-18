import { SQS } from 'aws-sdk';
import { BatchParamFunction } from './Batch';
import { Queue } from './Queue';
import { QueueMessage } from './QueueMessage';

export class QueueBatch<QMA extends object> {
	messages: Array<QueueMessage<QMA>>;

	constructor(public rawMessages: SQS.MessageList, public queue: Queue<QMA>) {
		this.messages = rawMessages.map(message => new QueueMessage(message, queue));
	}

	send = async (paramFunction?: BatchParamFunction<SQS.Message>) => {
		const fallbackParamFunction = paramFunction || (() => {});

		this.queue.sqs
			.sendMessageBatch({
				QueueUrl: this.queue.config.url,
				Entries: this.rawMessages.map((rawMessage, index) => ({
					Id: rawMessage.MessageId!,
					MessageBody: rawMessage.Body!,
					...fallbackParamFunction(this.messages[index].message, index)
				}))
			})
			.promise();
	};

	delete = async () =>
		this.queue.sqs
			.deleteMessageBatch({
				QueueUrl: this.queue.config.url,
				Entries: this.rawMessages.map(rawMessage => ({
					Id: rawMessage.MessageId!,
					ReceiptHandle: rawMessage.ReceiptHandle!
				}))
			})
			.promise();
}
