import { MessagesIterator, Queue } from '../Queue';
import { SqsxSendMessagesCommand, SqsxSendMessagesCommandOutput } from '../command/SendMessages';

export const sendMessages = async <Attributes extends object = object>(
	Queue: Queue<Attributes>,
	messages: Array<Attributes>,
	messagesIterator?: MessagesIterator<Attributes>
): Promise<SqsxSendMessagesCommandOutput<Attributes>> => {
	const iterator = messagesIterator || Queue.messagesIterator;

	return Queue.sqsxClient.send(
		new SqsxSendMessagesCommand({
			queueUrl: Queue.url,
			messages: messages.map((body, index) => {
				return {
					body,
					...(iterator ? iterator(body, index) : {})
				};
			})
		})
	);
};
