import { Queue } from '../Queue';
import { SqsxPurgeQueueCommand, SqsxPurgeQueueCommandOutput } from '../command/PurgeQueue';

export const purgeQueue = async <Attributes extends object = object>(
	Queue: Queue<Attributes>
): Promise<SqsxPurgeQueueCommandOutput> =>
	Queue.sqsxClient.send(
		new SqsxPurgeQueueCommand({
			queueUrl: Queue.url
		})
	);
