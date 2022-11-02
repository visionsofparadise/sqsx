# sqsx

A wrapper for the SQS client from AWS-SDK that provides better typescript support and APIs for scalable usage. Compatible with [sqs-mock](https://www.npmjs.com/package/sqs-mock) for testing.

- Takes objects and returns objects of the type provided at queue definition.
- Serializing and deserializing is internal.
- Maps message attributes from receiving to deleting.
- Simplifies handling messages in batches.
- Use the queue as an object rather than defining the queueUrl with every call.
- Parameter and return properties are camelCased and not PascalCased.

### Not yet implemented

- Create, delete and manage queues and queue attributes.

---

## Usage

### Creating a queue

```js
// testQueue.ts
import { SQS } from 'aws-sdk';
import { SQSX } from 'sqsx';

const sqs = new SQS();

interface ITestMessage {
 test: string;
}

export const testQueue =
 new SQSX.Queue<ITestMessage>({ // Messages in this queue will be of type ITestMessage
  url: process.env.QUEUE_URL || `testQueue`,
  client: sqs
 });
```

### Create and send a message

```js
// sendMessage.ts
import { testQueue } from './testQueue';

const message = new testQueue.Message({ // Typescript error if message is not of type ITestMessage
 test: 'test'
});

await message.send();
```

### Create and send a batch of messages

```js
// sendMessageBatch.ts
import { testQueue } from './testQueue';

const batch = new testQueue.Batch([ // Typescript error if messages are not of type ITestMessage
 { 
  test: 'test1'
 },
 {
  test: 'test2'
 },
 {
  test: 'test3'
 }
]);

await batch.send();
```

### Receiving and deleting messages

```js
// receiveMessages.ts
import { testQueue } from './testQueue';

const messageBatch = new testQueue.receive(5); // Takes max quantity of received messages. DEFAULT: 1, MAX: 10

const messageBody = messageBatch.messages[0].body; // Gets a messages body (of type ITestMessage)

await messageBatch.delete(); // Deletes messages received in the batch

await messageBatch.messages[0].send(); // Resends the first message in the batch
```

### Purge queue of messages

```js
// purgeQueue.ts
import { testQueue } from './testQueue';

await testQueue.purge();
```

## Contribution

Feel free to contribute any missing features or bug fixes. Please provide unit tests for added functionality.