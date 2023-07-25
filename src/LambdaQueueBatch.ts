import { Message } from '@aws-sdk/client-sqs';
import { Queue } from './Queue';
import { QueueBatch } from './QueueBatch';
import { SQSEvent } from 'aws-lambda';

export class LambdaQueueBatch<Body extends object> extends QueueBatch<Body> {
	constructor(public records: SQSEvent['Records'], public queue: Queue<Body>) {
		super(
			records.map(
				event =>
					({
						MessageId: event.messageId,
						ReceiptHandle: event.receiptHandle,
						Body: event.body,
						MD5OfBody: event.md5OfBody,
						Attributes: event.attributes,
						MessageAttributes: event.messageAttributes
					} as any as Message)
			),
			queue
		);
	}
}
