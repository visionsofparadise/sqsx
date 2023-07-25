import { nanoid } from 'nanoid';
import { sqs, testQueue, newTestBatch } from './testQueue.dev';
import { ReceiveMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs';

afterEach(async () => {
	await testQueue.purge();
});

it('receives messages', async () => {
	const testBatch = newTestBatch();

	await sqs.send(
		new SendMessageBatchCommand({
			QueueUrl: testQueue.config.url,
			Entries: testBatch.map(entry => ({
				Id: nanoid(),
				MessageBody: JSON.stringify(entry)
			}))
		})
	);

	const results = await testQueue.receive(10);

	expect(results.messages.length).toBe(3);
});

it('purges all messages', async () => {
	const testBatch = newTestBatch();

	await sqs.send(
		new SendMessageBatchCommand({
			QueueUrl: testQueue.config.url,
			Entries: testBatch.map(entry => ({
				Id: nanoid(),
				MessageBody: JSON.stringify(entry)
			}))
		})
	);

	await testQueue.purge();

	const results = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results.Messages).toBeUndefined();
});
