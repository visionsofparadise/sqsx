import { SqsxClientConfig } from '../Client';

export abstract class SqsxCommand<
	Input extends object,
	BaseInput extends object,
	Output extends object,
	BaseOutput extends object
> {
	constructor(public readonly input: Input) {}

	Input!: Input;
	Output!: Output;

	abstract handleInput: (clientConfig: SqsxClientConfig) => Promise<BaseInput>;
	abstract handleOutput: (output: BaseOutput, clientConfig: SqsxClientConfig) => Promise<Output>;

	abstract send: (clientConfig: SqsxClientConfig) => Promise<Output>;
}
