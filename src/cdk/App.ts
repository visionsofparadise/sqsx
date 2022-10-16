#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SQSXPipelineStack } from './Pipeline';

export const serviceName = 'SQSx';

const app = new cdk.App();

new SQSXPipelineStack(app, 'SQSXPipelineStack', {
	env: {
		region: process.env.CDK_DEFAULT_REGION,
		account: process.env.CDK_DEFAULT_ACCOUNT
	}
});
