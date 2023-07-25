import { ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { Message } from './Message';
import { sqs, testQueue, newTestMessage } from './testQueue.dev';

afterEach(async () => {
	await testQueue.purge();
});

it('sends message', async () => {
	const testMessage = newTestMessage();

	await new Message(testMessage, testQueue).send();

	const results = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: testQueue.config.url
		})
	);

	expect(results.Messages!.length).toBe(1);
});
