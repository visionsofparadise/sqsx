import { Queue } from './Queue';
import { nanoid } from 'nanoid';
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
		const recurse = async (remainingMessages: Array<Body>): Promise<Array<SendMessageBatchCommandOutput>> => {
			const currentMessages = remainingMessages.slice(0, 10);
			const nextMessages = remainingMessages.slice(10);

			const result = await this.queue.client.send(
				new SendMessageBatchCommand({
					QueueUrl: this.queue.config.url,
					Entries: currentMessages.map((message, index) => ({
						MessageBody: JSON.stringify(message),
						...this.paramFunction(message, index)
					}))
				})
			);

			if (nextMessages.length === 0) return [result];

			return [result, ...(await recurse(nextMessages))];
		};

		const results = await recurse(this.messages);

		if (this.queue.config.logger) this.queue.config.logger.info({ results });

		return results;
	};
}
