import { Queue } from '../Queue';
import { SqsxDeleteMessagesCommand, SqsxDeleteMessagesCommandOutput } from '../command/DeleteMessages';

export const deleteMessages = async <Attributes extends object = object>(
	Queue: Queue<Attributes>,
	receiptHandles: Array<string | { receiptHandle: string }>
): Promise<SqsxDeleteMessagesCommandOutput> =>
	Queue.sqsxClient.send(
		new SqsxDeleteMessagesCommand({
			queueUrl: Queue.url,
			messages: receiptHandles
		})
	);
