import { SQSEvent } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { Batch, BatchParamFunction } from './Batch';
import { LambdaQueueBatch } from './LambdaQueueBatch';
import { Message } from './Message';
import { QueueBatch } from './QueueBatch';

export type NoQueueUrl<P extends { QueueUrl: string }> = Omit<P, 'QueueUrl'>;

export interface QCfg {
	url: string;
	client: SQS;
}

export class Queue<QMA extends object> {
	constructor(public config: QCfg) {
		this.sqs = config.client;
	}

	sqs: SQS;

	get Message() {
		const parentQueue = this;

		return class QMessage extends Message<QMA> {
			constructor(message: QMA) {
				super(message, parentQueue);
			}
		};
	}

	get Batch() {
		const parentQueue = this;

		return class QBatch extends Batch<QMA> {
			constructor(messages: Array<QMA>, paramFunction?: BatchParamFunction<QMA>) {
				super(messages, parentQueue, paramFunction);
			}
		};
	}

	get LambdaQueueBatch() {
		const parentQueue = this;

		return class QLambdaQueueBatch extends LambdaQueueBatch<QMA> {
			constructor(sqsEvent: SQSEvent) {
				super(sqsEvent, parentQueue);
			}
		};
	}

	receive = async (
		quantity: number = 1,
		params?: NoQueueUrl<Omit<SQS.ReceiveMessageRequest, 'MaxNumberOfMessages'>>
	): Promise<QueueBatch<QMA>> => {
		const fallbackParams = params || {};

		const result = await this.sqs
			.receiveMessage({
				QueueUrl: this.config.url,
				...fallbackParams,
				MaxNumberOfMessages: Math.min(quantity, 10)
			})
			.promise();

		const queueBatch = new QueueBatch<QMA>(result.Messages || [], this);

		return queueBatch;
	};

	purge = async () =>
		this.sqs
			.purgeQueue({
				QueueUrl: this.config.url
			})
			.promise();
}
