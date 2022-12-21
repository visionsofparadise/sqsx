import { SQSEvent } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { SQSMock } from 'sqs-mock';
import { Batch, BatchParamFunction } from './Batch';
import { LambdaQueueBatch } from './LambdaQueueBatch';
import { Message } from './Message';
import { QueueBatch } from './QueueBatch';
import { ILogger } from './util';

export type NoQueueUrl<P extends { QueueUrl: string }> = Omit<P, 'QueueUrl'>;

export interface QCfg {
	url: string;
	client: SQS | SQSMock;
	logger?: ILogger;
}

export class Queue<Body extends object> {
	constructor(public config: QCfg) {
		this.sqs = config.client;
	}

	sqs: SQS | SQSMock;

	get Message() {
		const parentQueue = this;

		return class QMessage extends Message<Body> {
			constructor(message: Body) {
				super(message, parentQueue);
			}
		};
	}

	get Batch() {
		const parentQueue = this;

		return class QBatch extends Batch<Body> {
			constructor(messages: Array<Body>, paramFunction?: BatchParamFunction<Body>) {
				super(messages, parentQueue, paramFunction);
			}
		};
	}

	get LambdaQueueBatch() {
		const parentQueue = this;

		return class QLambdaQueueBatch extends LambdaQueueBatch<Body> {
			constructor(records: SQSEvent['Records']) {
				super(records, parentQueue);
			}
		};
	}

	receive = async (
		quantity: number = 1,
		params?: NoQueueUrl<Omit<SQS.ReceiveMessageRequest, 'MaxNumberOfMessages'>>
	): Promise<QueueBatch<Body>> => {
		const fallbackParams = params || {};

		const result = await this.sqs
			.receiveMessage({
				QueueUrl: this.config.url,
				...fallbackParams,
				MaxNumberOfMessages: Math.min(quantity, 10)
			})
			.promise();

		if (this.config.logger) this.config.logger.info({ result });

		const queueBatch = new QueueBatch<Body>(result.Messages || [], this);

		return queueBatch;
	};

	purge = async () =>
		this.sqs
			.purgeQueue({
				QueueUrl: this.config.url
			})
			.promise();
}
