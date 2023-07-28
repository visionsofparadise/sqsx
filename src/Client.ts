import { SQSClient } from '@aws-sdk/client-sqs';
import { SqsxCommand } from './command/Command';
import { ILogger } from './util/utils';

export interface SqsxClientConfig {
	client: SQSClient;
	logger?: ILogger;
}

export class SqsxClient implements SqsxClientConfig {
	logger?: ILogger;

	constructor(public client: SQSClient) {}

	setClient = (client?: SQSClient) => {
		if (client) this.client = client;
	};

	setLogger = (logger?: ILogger) => {
		if (logger) this.logger = logger;
	};

	send = async <Command extends SqsxCommand<any, any, any, any>>(
		command: Command
	): Promise<ReturnType<Command['send']>> => {
		return command.send({
			client: this.client
		});
	};
}
