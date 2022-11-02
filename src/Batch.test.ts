import { Batch } from './Batch';
import { sqs, testQueue, newTestBatch } from './testQueue.dev';

afterEach(async () => {
	await testQueue.purge();
});

it('sends message batch', async () => {
	const testBatch = newTestBatch();

	await new Batch(testBatch, testQueue).send();

	const results = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results.Messages!.length).toBe(3);
});
