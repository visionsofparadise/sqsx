import { Queue } from './Queue';
import { QueueBatch } from './QueueBatch';
import { SQSEvent } from 'aws-lambda';
import { MessageSystemAttributeMap, MessageBodyAttributeMap } from 'aws-sdk/clients/sqs';

export class LambdaQueueBatch<Body extends object> extends QueueBatch<Body> {
	constructor(public records: SQSEvent['Records'], public queue: Queue<Body>) {
		super(
			records.map(event => ({
				MessageId: event.messageId,
				ReceiptHandle: event.receiptHandle,
				Body: event.body,
				MD5OfBody: event.md5OfBody,
				Attributes: event.attributes as unknown as MessageSystemAttributeMap,
				MessageAttributes: event.messageAttributes as unknown as MessageBodyAttributeMap
			})),
			queue
		);
	}
}
