import { SqsxCommand } from './Command';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { SqsxClientConfig } from '../Client';
import {
	DeleteMessageBatchCommandInput,
	DeleteMessageBatchCommandOutput,
	DeleteMessageBatchRequestEntry,
	BatchResultErrorEntry,
	DeleteMessageBatchCommand
} from '@aws-sdk/client-sqs';
import { isNotNullish, randomString } from '../util/utils';

export interface SqsxDeleteMessagesCommandInputMessage
	extends LowerCaseObjectKeys<Omit<DeleteMessageBatchRequestEntry, 'Id'>> {}

export interface SqsxDeleteMessagesCommandInput
	extends LowerCaseObjectKeys<Omit<DeleteMessageBatchCommandInput, 'Entries'>> {
	messages: Array<string | SqsxDeleteMessagesCommandInputMessage>;
}

export interface SqsxDeleteMessagesCommandOutput
	extends LowerCaseObjectKeys<Omit<DeleteMessageBatchCommandOutput, '$metadata' | 'Successful' | 'Failed'>> {
	$metadatas: Array<DeleteMessageBatchCommandOutput['$metadata']>;
	errors: Array<SqsxDeleteMessagesCommandInputMessage & LowerCaseObjectKeys<Omit<BatchResultErrorEntry, 'Id'>>>;
}

export class SqsxDeleteMessagesCommand extends SqsxCommand<
	SqsxDeleteMessagesCommandInput,
	DeleteMessageBatchCommandInput,
	SqsxDeleteMessagesCommandOutput,
	DeleteMessageBatchCommandOutput
> {
	receiptHandleMap: Map<string, SqsxDeleteMessagesCommandInputMessage>;

	constructor(input: SqsxDeleteMessagesCommandInput) {
		super(input);

		this.receiptHandleMap = new Map(
			this.input.messages.map(message => [
				randomString(10),
				typeof message === 'string' ? { receiptHandle: message } : message
			])
		);
	}

	handleInput = async ({}: SqsxClientConfig): Promise<DeleteMessageBatchCommandInput> => {
		const { messages, ...rest } = this.input;

		const entries = [...this.receiptHandleMap.entries()].map(([id, { receiptHandle }]) =>
			upperCaseKeys({
				id,
				receiptHandle
			})
		);

		const upperCaseInput = upperCaseKeys({ entries, ...rest });

		return upperCaseInput;
	};

	handleOutput = async (
		output: DeleteMessageBatchCommandOutput,
		{}: SqsxClientConfig
	): Promise<SqsxDeleteMessagesCommandOutput> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const { $metadata, successful, failed, ...rest } = lowerCaseOutput;

		const errors = (failed || [])
			.map(fail => {
				if (!fail.Id) return undefined;

				const message = this.receiptHandleMap.get(fail.Id);

				if (!message) return undefined;

				return {
					...message,
					...lowerCaseKeys(fail)
				};
			})
			.filter(isNotNullish);

		const formattedOutput: SqsxDeleteMessagesCommandOutput = {
			$metadatas: [$metadata],
			errors,
			...rest
		};

		return formattedOutput;
	};

	send = async (clientConfig: SqsxClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const recurse = async (
			remainingEntries: Array<DeleteMessageBatchRequestEntry>
		): Promise<SqsxDeleteMessagesCommandOutput> => {
			const currentEntries = remainingEntries.slice(0, 10);
			const nextEntries = remainingEntries.slice(10);

			const output = await clientConfig.client.send(
				new DeleteMessageBatchCommand({
					...input,
					Entries: currentEntries
				})
			);

			const result = await this.handleOutput(output, clientConfig);

			if (nextEntries.length === 0) return result;

			const nextResult = await recurse(nextEntries);

			return {
				$metadatas: [...result.$metadatas, ...nextResult.$metadatas],
				errors: [...result.errors, ...nextResult.errors]
			};
		};

		return recurse(input.Entries!);
	};
}
