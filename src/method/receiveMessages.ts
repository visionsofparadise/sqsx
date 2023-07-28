import { Queue } from '../Queue';
import {
	SqsxReceiveMessagesCommand,
	SqsxReceiveMessagesCommandInput,
	SqsxReceiveMessagesCommandOutput
} from '../command/ReceiveMessages';

export const receiveMessages = async <Attributes extends object = object>(
	Queue: Queue<Attributes>,
	count: number,
	input?: Omit<SqsxReceiveMessagesCommandInput, 'maxNumberOfMessages'>
): Promise<SqsxReceiveMessagesCommandOutput<Attributes>> =>
	Queue.sqsxClient.send(
		new SqsxReceiveMessagesCommand<Attributes>({
			queueUrl: Queue.url,
			maxNumberOfMessages: count,
			...input
		})
	);
