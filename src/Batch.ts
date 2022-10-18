import { SQS } from 'aws-sdk';
import { Queue } from './Queue';
import { nanoid } from 'nanoid';

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
		this.queue.sqs
			.sendMessageBatch({
				QueueUrl: this.queue.config.url,
				Entries: this.messages.map((message, index) => ({
					MessageBody: JSON.stringify(message),
					...this.paramFunction(message, index)
				}))
			})
			.promise();
	};
}
