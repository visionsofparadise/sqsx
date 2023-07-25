import { SQSEvent } from 'aws-lambda';
import { Batch, BatchParamFunction } from './Batch';
import { LambdaQueueBatch } from './LambdaQueueBatch';
import { Message } from './Message';
import { QueueBatch } from './QueueBatch';
import { ILogger } from './util';
import { PurgeQueueCommand, ReceiveMessageCommand, ReceiveMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';

export type NoQueueUrl<P extends { QueueUrl: string | undefined }> = Omit<P, 'QueueUrl'>;

export interface QCfg {
	url: string;
	client: SQSClient;
	logger?: ILogger;
}

export class Queue<Body extends object> {
	constructor(public config: QCfg) {
		this.client = config.client;
	}

	client: SQSClient;

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
		params?: NoQueueUrl<Omit<ReceiveMessageCommandInput, 'MaxNumberOfMessages'>>
	): Promise<QueueBatch<Body>> => {
		const fallbackParams = params || {};

		const result = await this.client.send(
			new ReceiveMessageCommand({
				QueueUrl: this.config.url,
				...fallbackParams,
				MaxNumberOfMessages: Math.min(quantity, 10)
			})
		);

		if (this.config.logger) this.config.logger.info({ result });

		const queueBatch = new QueueBatch<Body>(result.Messages || [], this);

		return queueBatch;
	};

	purge = async () =>
		this.client.send(
			new PurgeQueueCommand({
				QueueUrl: this.config.url
			})
		);
}
