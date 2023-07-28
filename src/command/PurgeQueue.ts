import { SqsxCommand } from './Command';
import { LowerCaseObjectKeys, upperCaseKeys } from '../util/keyCapitalize';
import { SqsxClientConfig } from '../Client';
import { PurgeQueueCommandInput, PurgeQueueCommandOutput, PurgeQueueCommand } from '@aws-sdk/client-sqs';

export interface SqsxPurgeQueueCommandInput extends LowerCaseObjectKeys<PurgeQueueCommandInput> {}

export interface SqsxPurgeQueueCommandOutput extends PurgeQueueCommandOutput {}

export class SqsxPurgeQueueCommand extends SqsxCommand<
	SqsxPurgeQueueCommandInput,
	PurgeQueueCommandInput,
	SqsxPurgeQueueCommandOutput,
	PurgeQueueCommandOutput
> {
	constructor(input: SqsxPurgeQueueCommandInput) {
		super(input);
	}

	handleInput = async ({}: SqsxClientConfig): Promise<PurgeQueueCommandInput> => upperCaseKeys(this.input);

	handleOutput = async (output: PurgeQueueCommandOutput, {}: SqsxClientConfig): Promise<SqsxPurgeQueueCommandOutput> =>
		output;

	send = async (clientConfig: SqsxClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new PurgeQueueCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
