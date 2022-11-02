import { nanoid } from 'nanoid';
import { sqs, testQueue, newTestBatch } from './testQueue.dev';

afterEach(async () => {
	await testQueue.purge();
});

it('receives messages', async () => {
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

	const results = await testQueue.receive(10);

	expect(results.messages.length).toBe(3);
});

it('purges all messages', async () => {
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

	await testQueue.purge();

	const results = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results.Messages).toBeUndefined();
});
