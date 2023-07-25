import { ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { Batch } from './Batch';
import { sqs, testQueue, newTestBatch } from './testQueue.dev';

afterEach(async () => {
	await testQueue.purge();
});

it('sends message batch', async () => {
	const testBatch = newTestBatch();

	await new Batch(testBatch, testQueue).send();

	const results = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results.Messages!.length).toBe(3);
});
