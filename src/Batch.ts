import { Queue } from './Queue';
import { nanoid } from 'nanoid';
import chunk from 'chunk';
import {
	SendMessageBatchCommand,
	SendMessageBatchCommandInput,
	SendMessageBatchCommandOutput
} from '@aws-sdk/client-sqs';

export type BatchParamFunction<Body extends object> = (
	message: Body,
	index: number
) => Omit<NonNullable<SendMessageBatchCommandInput['Entries']>[number], 'MessageBody'>;

export class Batch<Body extends object> {
	queue: Queue<Body>;
	paramFunction: BatchParamFunction<Body>;

	constructor(public messages: Array<Body>, queue: Queue<Body>, paramFunction?: BatchParamFunction<Body>) {
		this.queue = queue;

		this.paramFunction = paramFunction || (() => ({ Id: nanoid() }));
	}

	send = async () => {
		const batches = chunk(this.messages, 10);

		if (this.queue.config.logger) this.queue.config.logger.info({ batches });

		const results: Array<SendMessageBatchCommandOutput> = [];

		for (const batch of batches) {
			const result = await this.queue.client.send(
				new SendMessageBatchCommand({
					QueueUrl: this.queue.config.url,
					Entries: batch.map((message, index) => ({
						MessageBody: JSON.stringify(message),
						...this.paramFunction(message, index)
					}))
				})
			);

			results.push(result);
		}

		return results;
	};
}
