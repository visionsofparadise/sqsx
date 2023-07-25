import { Message } from './Message';
import { Queue } from './Queue';
import { isNonNullable } from './util';
import { DeleteMessageCommand, Message as SQSMessage } from '@aws-sdk/client-sqs';

export class QueueMessage<Body extends object> extends Message<Body> {
	id: NonNullable<SQSMessage['MessageId']>;
	receiptHandle: NonNullable<SQSMessage['ReceiptHandle']>;
	serializedBody: NonNullable<SQSMessage['Body']>;
	md5OfBody: NonNullable<SQSMessage['MD5OfBody']>;

	attributes: SQSMessage['Attributes'];
	messageAttributes: SQSMessage['MessageAttributes'];
	md5OfMessageAttribtes: SQSMessage['MD5OfMessageAttributes'];

	constructor(sqsMessage: SQSMessage, queue: Queue<Body>) {
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

		this.queue.client.send(
			new DeleteMessageCommand({
				QueueUrl: this.queue.config.url,
				ReceiptHandle: this.receiptHandle
			})
		);
	};
}
