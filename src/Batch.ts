import { AWSError, SQS } from 'aws-sdk';
import { Queue } from './Queue';
import { nanoid } from 'nanoid';
import chunk from 'chunk';
import { PromiseResult } from 'aws-sdk/lib/request';

export type BatchParamFunction<QMA extends object> = (
	message: QMA,
	index: number
) => Omit<SQS.SendMessageBatchRequestEntry, 'MessageBody'>;

export class Batch<QMA extends object> {
	queue: Queue<QMA>;
	paramFunction: BatchParamFunction<QMA>;

	constructor(public messages: Array<QMA>, queue: Queue<QMA>, paramFunction?: BatchParamFunction<QMA>) {
		this.queue = queue;

		this.paramFunction = paramFunction || (() => ({ Id: nanoid() }));
	}

	send = async () => {
		const batches = chunk(this.messages, 10);

		const results: Array<PromiseResult<SQS.SendMessageBatchResult, AWSError>> = [];

		for (const batch of batches) {
			const result = await this.queue.sqs
				.sendMessageBatch({
					QueueUrl: this.queue.config.url,
					Entries: batch.map((message, index) => ({
						MessageBody: JSON.stringify(message),
						...this.paramFunction(message, index)
					}))
				})
				.promise();

			results.push(result);
		}

		return results;
	};
}
