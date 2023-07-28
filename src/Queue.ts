import { ILogger } from './util/utils';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SqsxClient } from './Client';
import { SqsxSendMessagesCommandInputMessage } from './command/SendMessages';

export type MessagesIterator<Attributes extends object = object> = (
	body: Attributes,
	index: number
) => Omit<SqsxSendMessagesCommandInputMessage<Attributes>, 'body'>;

export interface QueueConfig {
	url: string;
	client: SQSClient;
	logger?: ILogger;
}

export class Queue<Attributes extends object = object> {
	client: SQSClient;
	sqsxClient: SqsxClient;

	url: string;

	constructor(public config: QueueConfig, public messagesIterator?: MessagesIterator<Attributes>) {
		this.client = config.client;
		this.sqsxClient = new SqsxClient(this.client);

		this.url = config.url;
	}
}
