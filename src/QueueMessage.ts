import { SQS } from 'aws-sdk';
import { Message } from './Message';
import { Queue } from './Queue';
import { isNonNullable } from './util';

export class QueueMessage<Body extends object> extends Message<Body> {
	id: NonNullable<SQS.Message['MessageId']>;
	receiptHandle: NonNullable<SQS.Message['ReceiptHandle']>;
	serializedBody: NonNullable<SQS.Message['Body']>;
	md5OfBody: NonNullable<SQS.Message['MD5OfBody']>;

	attributes: SQS.Message['Attributes'];
	messageAttributes: SQS.Message['MessageAttributes'];
	md5OfMessageAttribtes: SQS.Message['MD5OfMessageAttributes'];

	constructor(sqsMessage: SQS.Message, queue: Queue<Body>) {
		const body: Body = sqsMessage.Body ? JSON.parse(sqsMessage.Body) : {};

		super(body, queue);

		isNonNullable(sqsMessage.MessageId, 'id');
		isNonNullable(sqsMessage.ReceiptHandle, 'receiptHandle');
		isNonNullable(sqsMessage.Body, 'body');
		isNonNullable(sqsMessage.MD5OfBody, 'md5OfBody');

		this.id = sqsMessage.MessageId;
		this.receiptHandle = sqsMessage.ReceiptHandle;
		this.serializedBody = sqsMessage.Body;
		this.md5OfBody = sqsMessage.MD5OfBody;

		this.attributes = sqsMessage.Attributes;
		this.messageAttributes = sqsMessage.MessageAttributes;
		this.md5OfMessageAttribtes = sqsMessage.MD5OfMessageAttributes;
	}

	delete = async () => {
		if (this.queue.config.logger) this.queue.config.logger.info(`Deleting ${this.receiptHandle}`);

		this.queue.sqs
			.deleteMessage({
				QueueUrl: this.queue.config.url,
				ReceiptHandle: this.receiptHandle
			})
			.promise();
	};
}
