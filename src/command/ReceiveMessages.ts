import { SqsxCommand } from './Command';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { SqsxClientConfig } from '../Client';
import {
	ReceiveMessageCommandInput,
	ReceiveMessageCommandOutput,
	ReceiveMessageCommand,
	Message
} from '@aws-sdk/client-sqs';

export interface SqsxReceiveMessagesCommandInput extends LowerCaseObjectKeys<ReceiveMessageCommandInput> {}

export interface SqsxReceiveMessagesCommandOutput<Attributes extends object = object>
	extends LowerCaseObjectKeys<Omit<ReceiveMessageCommandOutput, '$metadata' | 'Messages'>> {
	$metadatas: Array<ReceiveMessageCommandOutput['$metadata']>;
	messages: Array<
		LowerCaseObjectKeys<Omit<Message, 'Body' | 'MD5OfMessageBody' | 'MD5OfMessageAttributes'>> & {
			body: Attributes;
			md5: string;
			md5OfMessageAttributes?: string;
		}
	>;
}

export class SqsxReceiveMessagesCommand<Attributes extends object = object> extends SqsxCommand<
	SqsxReceiveMessagesCommandInput,
	ReceiveMessageCommandInput,
	SqsxReceiveMessagesCommandOutput<Attributes>,
	ReceiveMessageCommandOutput
> {
	constructor(input: SqsxReceiveMessagesCommandInput) {
		super(input);
	}

	handleInput = async ({}: SqsxClientConfig): Promise<ReceiveMessageCommandInput> => upperCaseKeys(this.input);

	handleOutput = async (
		output: ReceiveMessageCommandOutput,
		{}: SqsxClientConfig
	): Promise<SqsxReceiveMessagesCommandOutput<Attributes>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const { $metadata, messages } = lowerCaseOutput;

		const formattedOutput: SqsxReceiveMessagesCommandOutput<Attributes> = {
			$metadatas: [$metadata],
			messages: (messages || []).map(message => {
				const { Body, MD5OfBody, MD5OfMessageAttributes, ...messageRest } = message;

				const body = JSON.parse(Body!) as Attributes;

				return {
					body,
					md5: MD5OfBody!,
					md5OfMessageAttributes: MD5OfMessageAttributes,
					...lowerCaseKeys(messageRest)
				};
			})
		};

		return formattedOutput;
	};

	send = async (clientConfig: SqsxClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const recurse = async (remainingCount: number): Promise<SqsxReceiveMessagesCommandOutput<Attributes>> => {
			const currentCount = Math.min(remainingCount, 10);
			const nextCount = remainingCount - currentCount;

			const output = await clientConfig.client.send(
				new ReceiveMessageCommand({
					...input,
					MaxNumberOfMessages: currentCount
				})
			);

			const result = await this.handleOutput(output, clientConfig);

			if (nextCount === 0 || result.messages.length < currentCount) return result;

			const nextResult = await recurse(nextCount);

			return {
				$metadatas: [...result.$metadatas, ...nextResult.$metadatas],
				messages: [...result.messages, ...nextResult.messages]
			};
		};

		return recurse(input.MaxNumberOfMessages || 10);
	};
}
