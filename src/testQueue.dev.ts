import { SQS } from 'aws-sdk';
import { SQSX } from './';
import { SQSMock } from 'sqs-mock';
import { nanoid } from 'nanoid';

export const sqs =
	process.env.INTEGRATION === 'true'
		? new SQS({
				region: 'us-east-1',
				apiVersion: '2012-11-05'
		  })
		: new SQSMock();

export interface ITestMessage {
	test: string;
}

export const testQueue = new SQSX.Queue<ITestMessage>({
	url: process.env.QUEUE_URL || `test`,
	client: sqs
});

export const newTestMessage = () => ({ test: nanoid() });

export const newTestBatch = () => [newTestMessage(), newTestMessage(), newTestMessage()];
