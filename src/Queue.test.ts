import SimplyImitatedSQS from '@abetomo/simply-imitated-sqs';
import { SQS } from 'aws-sdk';
import { SQSx } from './';
import { nanoid } from 'nanoid';

const sqs =
	process.env.INTEGRATION === 'true'
		? new SQS({
				region: 'us-east-1',
				apiVersion: '2012-11-05'
		  })
		: (new SimplyImitatedSQS() as unknown as SQS);

interface ITestMessage {
	test: string;
}

const queue = new SQSx.Queue<ITestMessage>({
	url: process.env.QUEUE_URL || `test`,
	client: sqs
});

const message = { test: nanoid() };

const batch = [{ message, params: { Id: '1' } }];

it('sends message', async () => {
	await queue.send(message);

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
	await queue.sendBatch(batch);

	const results = await sqs
		.receiveMessage({
			QueueUrl: queue.config.url,
			MaxNumberOfMessages: 10
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

	const results = await queue.receive({
		MaxNumberOfMessages: 10
	});

	expect(results.Messages.length).toBe(1);

	await sqs
		.deleteMessage({
			QueueUrl: queue.config.url,
			ReceiptHandle: results.Messages![0].ReceiptHandle!
		})
		.promise();
});

// it('deletes a message', async () => {
// 	await sqs
// 		.sendMessage({
// 			QueueUrl: queue.config.url,
// 			MessageBody: JSON.stringify(message)
// 		})
// 		.promise();

// 	const results = await sqs
// 		.receiveMessage({
// 			QueueUrl: queue.config.url,
// 			MaxNumberOfMessages: 10
// 		})
// 		.promise();

// 	expect(results.Messages!.length).toBe(1);

// 	await queue.delete(results.Messages![0].ReceiptHandle!);

// 	const results2 = await sqs
// 		.receiveMessage({
// 			QueueUrl: queue.config.url,
// 			MaxNumberOfMessages: 10
// 		})
// 		.promise();

// 	expect(results2.Messages!.length).toBe(0);
// });

// it('deletes a message batch', async () => {
// 	await sqs
// 		.sendMessageBatch({
// 			QueueUrl: queue.config.url,
// 			Entries: batch.map(entry => ({
// 				MessageBody: JSON.stringify(entry.message),
// 				...entry.params
// 			}))
// 		})
// 		.promise();

// 	const results = await sqs
// 		.receiveMessage({
// 			QueueUrl: queue.config.url,
// 			MaxNumberOfMessages: 10
// 		})
// 		.promise();

// 	expect(results.Messages!.length).toBe(1);

// 	await queue.deleteBatch(
// 		results.Messages!.map(entry => ({
// 			Id: entry.MessageId!,
// 			ReceiptHandle: entry.ReceiptHandle!
// 		}))
// 	);

// 	const results2 = await sqs
// 		.receiveMessage({
// 			QueueUrl: queue.config.url,
// 			MaxNumberOfMessages: 10
// 		})
// 		.promise();

// 	expect(results2.Messages!.length).toBe(0);
// });
