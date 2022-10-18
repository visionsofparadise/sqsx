import { Queue } from './Queue';
import { QueueBatch } from './QueueBatch';
import { SQSEvent } from 'aws-lambda';

export class LambdaQueueBatch<QMA extends object> extends QueueBatch<QMA> {
	constructor(public sqsEvent: SQSEvent, public queue: Queue<QMA>) {
		super(
			sqsEvent.Records.map(event => ({
				MessageId: event.messageId,
				Body: event.body,
				MD5OfBody: event.md5OfBody,
				ReceiptHandle: event.receiptHandle
			})),
			queue
		);
	}
}
