export const isNonNullable: <T>(target: T, name: string) => asserts target is NonNullable<T> = (target, name) => {
	if (target === undefined || target === null) {
		throw new Error(`SQSx: Received nullish value for ${name}`);
	}
};
