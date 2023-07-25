import { ReceiveMessageCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { QueueMessage } from './QueueMessage';
import { sqs, testQueue, newTestMessage } from './testQueue.dev';

afterEach(async () => {
	await testQueue.purge();
});

it('deletes a queue message', async () => {
	const testMessage = newTestMessage();

	await sqs.send(
		new SendMessageCommand({
			QueueUrl: testQueue.config.url,
			MessageBody: JSON.stringify(testMessage)
		})
	);

	const results = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url
		})
	);

	expect(results.Messages).toBeDefined();

	const sqsMessage = results.Messages![0];

	expect(sqsMessage).toBeDefined();

	const queueMessage = new QueueMessage(sqsMessage, testQueue);

	await queueMessage.delete();

	const results2 = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url
		})
	);

	expect(results2.Messages).not.toBeDefined();
});

it('sends same message again', async () => {
	const testMessage = newTestMessage();

	await sqs.send(
		new SendMessageCommand({
			QueueUrl: testQueue.config.url,
			MessageBody: JSON.stringify(testMessage)
		})
	);

	const results = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results.Messages).toBeDefined();

	const sqsMessage = results.Messages![0];

	expect(sqsMessage).toBeDefined();

	const queueMessage = new QueueMessage(sqsMessage, testQueue);

	await queueMessage.send();

	const results2 = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url,
			MaxNumberOfMessages: 10
		})
	);

	expect(results2.Messages!.length).toBe(2);
});
