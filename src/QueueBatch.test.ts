import { nanoid } from 'nanoid';
import { QueueBatch } from './QueueBatch';
import { sqs, testQueue, newTestBatch } from './testQueue.dev';

afterEach(async () => {
	await testQueue.purge();
});

it('deletes a message batch', async () => {
	const testBatch = newTestBatch();

	await sqs
		.sendMessageBatch({
			QueueUrl: testQueue.config.url,
			Entries: testBatch.map(entry => ({
				Id: nanoid(),
				MessageBody: JSON.stringify(entry)
			}))
		})
		.promise();

	const results = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results.Messages!.length).toBe(3);

	const queueBatch = new QueueBatch(results.Messages!, testQueue);

	await queueBatch.delete();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results2.Messages).toBeUndefined();
});

it('resends same message batch', async () => {
	const testBatch = newTestBatch();

	await sqs
		.sendMessageBatch({
			QueueUrl: testQueue.config.url,
			Entries: testBatch.map(entry => ({
				Id: nanoid(),
				MessageBody: JSON.stringify(entry)
			}))
		})
		.promise();

	const results = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results.Messages!.length).toBe(3);

	const queueBatch = new QueueBatch(results.Messages!, testQueue);

	await queueBatch.send();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results2.Messages!.length).toBe(6);
});
