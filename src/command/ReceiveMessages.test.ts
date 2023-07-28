import { TestMessage } from '../QueueTest.dev';
import { QUEUE_URL, TestSqsClient, TestSqsxClient } from '../ClientTest.dev';
import { SqsxReceiveMessagesCommand } from './ReceiveMessages';
import { arrayOfLength, randomString } from '../util/utils';
import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';

it('receives 20 messages', async () => {
	const messages: Array<TestMessage> = arrayOfLength(20).map(() => ({
		string: randomString()
	}));

	await TestSqsClient.send(
		new SendMessageBatchCommand({
			QueueUrl: QUEUE_URL,
			Entries: messages.slice(0, 10).map(message => ({ Id: message.string, MessageBody: JSON.stringify(message) }))
		})
	);

	await TestSqsClient.send(
		new SendMessageBatchCommand({
			QueueUrl: QUEUE_URL,
			Entries: messages.slice(10).map(message => ({ Id: message.string, MessageBody: JSON.stringify(message) }))
		})
	);

	const result = await TestSqsxClient.send(
		new SqsxReceiveMessagesCommand({
			queueUrl: QUEUE_URL,
			maxNumberOfMessages: 20
		})
	);

	expect(result.messages.length).toBe(20);
});
