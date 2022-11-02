import { QueueMessage } from './QueueMessage';
import { sqs, testQueue, newTestMessage } from './testQueue.dev';

afterEach(async () => {
	await testQueue.purge();
});

it('deletes a queue message', async () => {
	const testMessage = newTestMessage();

	await sqs
		.sendMessage({
			QueueUrl: testQueue.config.url,
			MessageBody: JSON.stringify(testMessage)
		})
		.promise();

	const results = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url
		})
		.promise();

	expect(results.Messages).toBeDefined();

	const sqsMessage = results.Messages![0];

	expect(sqsMessage).toBeDefined();

	const queueMessage = new QueueMessage(sqsMessage, testQueue);

	await queueMessage.delete();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url
		})
		.promise();

	expect(results2.Messages).not.toBeDefined();
});

it('sends same message again', async () => {
	const testMessage = newTestMessage();

	await sqs
		.sendMessage({
			QueueUrl: testQueue.config.url,
			MessageBody: JSON.stringify(testMessage)
		})
		.promise();

	const results = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results.Messages).toBeDefined();

	const sqsMessage = results.Messages![0];

	expect(sqsMessage).toBeDefined();

	const queueMessage = new QueueMessage(sqsMessage, testQueue);

	await queueMessage.send();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results2.Messages!.length).toBe(2);
});
