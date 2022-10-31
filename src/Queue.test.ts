import { SQS } from 'aws-sdk';
import { SQSX } from './';
import { SQSMock } from 'sqs-mock';
import { nanoid } from 'nanoid';

const sqs =
	process.env.INTEGRATION === 'true'
		? new SQS({
				region: 'us-east-1',
				apiVersion: '2012-11-05'
		  })
		: (new SQSMock() as any as SQS);

interface ITestMessage {
	test: string;
}

const queue = new SQSX.Queue<ITestMessage>({
	url: process.env.QUEUE_URL || `test`,
	client: sqs
});

const message = { test: nanoid() };

const batch = [
	{ message, params: { Id: '1' } },
	{ message, params: { Id: '2' } },
	{ message, params: { Id: '3' } }
];

const newBatch = [message, message, message];

afterEach(async () => {
	await queue.purge();
});

it('sends message', async () => {
	await new queue.Message(message).send();

	const results = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url
		})
		.promise();

	expect(results.Messages!.length).toBe(1);

	await sqs
		.deleteMessage({
			QueueUrl: queue.config.url,
			ReceiptHandle: results.Messages![0].ReceiptHandle!
		})
		.promise();
});

it('sends message batch', async () => {
	await new queue.Batch(newBatch).send();

	const results = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results.Messages!.length).toBe(3);

	await sqs
		.deleteMessageBatch({
			QueueUrl: queue.config.url,
			Entries: results.Messages!.map(message => ({
				Id: message.MessageId!,
				ReceiptHandle: message.ReceiptHandle!
			}))
		})
		.promise();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url
		})
		.promise();

	expect(results2.Messages).toBeUndefined();
});

it('receives messages', async () => {
	await sqs
		.sendMessageBatch({
			QueueUrl: queue.config.url,
			Entries: batch.map(entry => ({
				MessageBody: JSON.stringify(entry.message),
				...entry.params
			}))
		})
		.promise();

	const results = await queue.receive(10);

	expect(results.messages.length).toBe(3);

	await sqs
		.deleteMessageBatch({
			QueueUrl: queue.config.url,
			Entries: results.messages.map(message => ({
				Id: message.id,
				ReceiptHandle: message.receiptHandle
			}))
		})
		.promise();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url
		})
		.promise();

	expect(results2.Messages).toBeUndefined();
});

it('deletes a message', async () => {
	await sqs
		.sendMessage({
			QueueUrl: queue.config.url,
			MessageBody: JSON.stringify(message)
		})
		.promise();

	const results = await queue.receive(10);

	expect(results.messages.length).toBe(1);

	await results.messages[0].delete();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url
		})
		.promise();

	expect(results2.Messages).toBeUndefined();
});

it('deletes a message batch', async () => {
	await sqs
		.sendMessageBatch({
			QueueUrl: queue.config.url,
			Entries: batch.map(entry => ({
				MessageBody: JSON.stringify(entry.message),
				...entry.params
			}))
		})
		.promise();

	const results = await queue.receive(10);

	expect(results.messages.length).toBe(3);

	await results.delete();

	const results2 = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results2.Messages).toBeUndefined();
});

it('purges all messages', async () => {
	await sqs
		.sendMessageBatch({
			QueueUrl: queue.config.url,
			Entries: batch.map(entry => ({
				MessageBody: JSON.stringify(entry.message),
				...entry.params
			}))
		})
		.promise();

	await queue.purge();

	const results = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(results.Messages).toBeUndefined();
});
