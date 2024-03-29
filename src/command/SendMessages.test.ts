import { TestMessage } from '../QueueTest.dev';
import { QUEUE_URL, TestSqsxClient } from '../ClientTest.dev';
import { SqsxSendMessagesCommand } from './SendMessages';
import { arrayOfLength } from '../util/utils';

it('sends a message', async () => {
	const message: TestMessage = {
		string: 'test'
	};

	const result = await TestSqsxClient.send(
		new SqsxSendMessagesCommand({
			queueUrl: QUEUE_URL,
			messages: [{ body: message }]
		})
	);

	expect(result.messages.length).toBe(1);
	expect(result.errors.length).toBe(0);
});

it('sends 20 messages', async () => {
	const messages: Array<TestMessage> = arrayOfLength(20).map(() => ({
		string: 'test'
	}));

	const result = await TestSqsxClient.send(
		new SqsxSendMessagesCommand({
			queueUrl: QUEUE_URL,
			messages: messages.map(message => ({ body: message }))
		})
	);

	expect(result.messages.length).toBe(20);
	expect(result.errors.length).toBe(0);
});
