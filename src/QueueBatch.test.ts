import { nanoid } from 'nanoid';
import { QueueBatch } from './QueueBatch';
import { sqs, testQueue, newTestBatch } from './testQueue.dev';
import { ReceiveMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs';

afterEach(async () => {
	await testQueue.purge();
});

it('deletes a message batch', async () => {
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

	const results = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results.Messages!.length).toBe(3);

	const queueBatch = new QueueBatch(results.Messages!, testQueue);

	await queueBatch.delete();

	const results2 = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results2.Messages).toBeUndefined();
});

it('resends same message batch', async () => {
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

	const results = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results.Messages!.length).toBe(3);

	const queueBatch = new QueueBatch(results.Messages!, testQueue);

	await queueBatch.send();

	const results2 = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results2.Messages!.length).toBe(6);
});
