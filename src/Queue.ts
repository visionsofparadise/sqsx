import { SQS } from 'aws-sdk';

type NoQueueUrl<P extends { QueueUrl: string }> = Omit<P, 'QueueUrl'>;

export interface QCfg {
	url: string;
	client: SQS;
}

export class Queue<QMA extends object> {
	constructor(public config: QCfg) {
		this.SQS = config.client;
	}

	SQS: SQS;

	send = async (message: QMA, params?: NoQueueUrl<Omit<SQS.SendMessageRequest, 'MessageBody'>>) => {
		const fallbackParams = params || {};

		return this.SQS.sendMessage({
			QueueUrl: this.config.url,
			MessageBody: JSON.stringify(message),
			...fallbackParams
		}).promise();
	};

	sendBatch = async (entries: Array<{ message: QMA; params: Omit<SQS.SendMessageBatchRequestEntry, 'MessageBody'> }>) =>
		this.SQS.sendMessageBatch({
			QueueUrl: this.config.url,
			Entries: entries.map(({ message, params }) => ({
				MessageBody: JSON.stringify(message),
				...params
			}))
		}).promise();

	receive = async (
		params?: NoQueueUrl<SQS.ReceiveMessageRequest>
	): Promise<{ Messages: Array<Omit<SQS.Message, 'Body'> & { Body: QMA }> }> => {
		const fallbackParams = params || {};

		const result = await this.SQS.receiveMessage({
			QueueUrl: this.config.url,
			...fallbackParams
		}).promise();

		return {
			Messages:
				(result.Messages || []).map(message => {
					const Body: QMA = message.Body ? JSON.parse(message.Body) : {};

					return {
						...message,
						Body
					};
				}) || []
		};
	};

	delete = async (receiptHandle: SQS.DeleteMessageRequest['ReceiptHandle']) =>
		this.SQS.deleteMessage({
			QueueUrl: this.config.url,
			ReceiptHandle: receiptHandle
		}).promise();

	deleteBatch = async (entries: Array<SQS.DeleteMessageBatchRequestEntry>) =>
		this.SQS.deleteMessageBatch({
			QueueUrl: this.config.url,
			Entries: entries
		}).promise();
}
