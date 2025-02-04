# `ao` Connect

The `aoconnect` library provides an abstraction for spawning, evaluating, and
interacting with `ao` Processes.

This module will run in a browser or server environment.

- Read the result of an `ao` Message evaluation from a `ao` Compute Unit `cu`
- Send a Message targeting an `ao` Process to an `ao` Message Unit `mu`
- Spawn an `ao` Process, assigning it to an `ao` Scheduler Unit `su`

<!-- toc -->

- [Usage](#usage)
    - [ESM (Node & Browser) aka type: `module`](#esm-node--browser-aka-type-module)
    - [CJS (Node) type: `commonjs`](#cjs-node-type-commonjs)
  - [API](#api)
    - [`result`](#result)
    - [`results`](#results)
    - [`message`](#message)
    - [`spawn`](#spawn)
    - [`connect`](#connect)
    - [`monitor`](#monitor)
    - [`dryrun`](#dryrun)
    - [Environment Variables](#environment-variables)
    - [`createDataItemSigner`](#createdataitemsigner)
- [Debug Logging](#debug-logging)
- [Testing](#testing)
- [Project Structure](#project-structure)

<!-- tocstop -->

## Usage

This module can be used on the server, as well as the browser:

#### ESM (Node & Browser) aka type: `module`

```js
import { message, result, spawn } from "@permaweb/aoconnect";
```

#### CJS (Node) type: `commonjs`

```js
const { spawn, message, result } = require("@permaweb/aoconnect");
```

The duration of this document will use `ESM` for examples

### API

#### `result`

Read the result of the message evaluation from an `ao` Compute Unit `cu`

```js
import { result } from "@permaweb/aoconnect";

let { messages, spawns, output, error } = await result({
  message: "l3hbt-rIJ_dr9at-eQ3EVajHWMnxPNm9eBtXpzsFWZc",
  process: "5SGJUlPwlenkyuG9-xWh0Rcf0azm8XEd5RBTiutgWAg",
});
```

#### `results`

Read a batch of results from a process, this feature can be used as a polling
mechanism looking for new results

```js
import { results } from "@permaweb/aoconnect";

let results = await results({
  process: "5SGJUlPwlenkyuG9-xWh0Rcf0azm8XEd5RBTiutgWAg",
  from: cursor,
  sort: "ASC",
  limit: 25,
});
```

Parameters

| Name    | Description                                                       | Optional? |
| ------- | ----------------------------------------------------------------- | --------- |
| process | the process identifier                                            | false     |
| from    | cursor starting point                                             | true      |
| to      | cursor ending point                                               | true      |
| sort    | list results in decending or ascending order, default will be ASC | true      |
| limit   | the number of results to return (default: 25)                     | true      |

#### `message`

send a message to an `ao` Message Unit `mu` targeting an ao `process`.

```js
import { createDataItemSigner, message } from "@permaweb/aoconnect";

const messageId = await message({
  process,
  signer: createDataItemSigner(wallet),
  anchor,
  tags,
  data,
});
```

> You can pass a 32 byte `anchor` to `message` which will be set on the DataItem

#### `spawn`

Spawn an `ao` process, assigning the `ao` Scheduler to schedule its messages

```js
import { createDataItemSigner, spawn } from "@permaweb/aoconnect";

const processId = await spawn({
  module,
  scheduler,
  signer: createDataItemSigner(wallet),
  tags,
  data,
});
```

#### `connect`

If you would like the connect to use ao components other than the defaults, you
can specify those components by providing their urls to `connect`. You can
currently specify:

- The GATEWAY_URL (`GATEWAY_URL`)
- The Messenger Unit URL (`MU_URL`)
- The Compute Unit URL (`CU_URL`)

```js
import { connect } from "@permaweb/aoconnect";

const { spawn, message, result } = connect({
  GATEWAY_URL: "...",
  MU_URL: "...",
  CU_URL: "...",
});
```

If any url is not provided, a library default will be used. In this sense,
invoking `connect()` with no parameters or an empty object is functionally
equivalent to using the top-lvl exports of the library:

```js
import {
 spawn,
 message,
 result
 connect
} from '@permaweb/aoconnect';

// These are functionally equivalent
connect() == { spawn, message, result }
```

#### `monitor`

When using cron messages, ao users need a way to start injesting the messages,
using this monitor method, ao users can initiate the subscription service for
cron messages.

```js
import { createDataItemSigner, monitor } from "@permaweb/aoconnect";

const result = await monitor({
  process,
  signer: createDataItemSigner(wallet),
});
```

#### `dryrun`

DryRun is the process of sending a message object to a specific process and
getting the `Result` object back, but the memory is not saved, it is perfect to
create a read message to return the current value of memory. For example, a
balance of a token, or a result of a transfer, etc.

```js
import { createDataItemSigner, dryrun } from "@permaweb/aoconnect";

const result = await dryrun({
  process: 'PROCESSID',
  data: '',
  tags: [{name: 'Action', value: 'Balance'},
  anchor: '1234',
  ...rest are optional (Id, Owner, etc)
});

console.log(result.Messages[0]);
```

#### Environment Variables

The library also allows configuring ao components described above, using
environment variables.

On `NodeJS`, you can use `process.env` to set these values.

In the browser, you can use `globalThis` to set these values.

> In both cases, you should set environment variables prior to importing the
> module. If this is not possible, consider using [`connect`](#connect) and
> passing in values from the environment that way.

#### `createDataItemSigner`

`message` and `spawn` both require signing a DataItem with a wallet.

`createDataItemSigner` is a convenience api that, given a wallet, returns a
function that can be passed to both `message` and `spawn` in order to properly
sign DataItems.

The library provides a browser compatible and node compatible version that you
can use OOTB.

The `browser` compatible versions expects an instance of `window.arweaveWallet`
to be passed to it:

```js
import { createDataItemSigner } from "@permaweb/aoconnect";

const signer = createDataItemSigner(globalThis.arweaveWallet);
```

The `node` compatible versions expects a JWK interface to be passed to it:

```js
import fs from "node:fs";
import { createDataItemSigner } from "@permaweb/aoconnect";

const wallet = JSON.parse(fs.readFileSync(process.env.PATH_TO_WALLET));
const signer = createDataItemSigner(wallet);
```

You can also implement your own `createDataItemSigner`, as long as it satisfies
the api. Here is what the API looks like in TypeScript:

```ts
type CreateDataItemSigner = (wallet: any):
  (args: { data: any, tags?: { name: string, value: string}[], target?: string, anchor?: string }):
    Promise<{ id: string, raw: ArrayBuffer }>
```

## Debug Logging

You can enable verbose debug logging on the library. All logging is scoped under
the name `@permaweb/aoconnect*`. You can use wildcards to enable a subset of
logs ie. `@permaweb/aoconnect/result*`

For Node, set the `DEBUG` environment variable to the logs you're interested in.

For the Browser, set the `localStorage.debug` variable to the logs you're
interested in.

## Testing

Run `npm test` to run the tests.

Run `npm run test:integration` to run the integration tests.

## Project Structure

The `aoconnect` project loosely implements the
[Ports and Adapters](https://medium.com/idealo-tech-blog/hexagonal-ports-adapters-architecture-e3617bcf00a0)
Architecture.

All business logic is in `lib` where each public api is implemented and tested.

`dal.js` contains the contracts for the driven adapters aka side-effects.
Implementations for those contracts are injected into, then parsed and invoked
by, the business logic. This is how we inject specific integrations for
providers ie. `Warp`, `Irys`, or even platforms specific implementations like
`node` and the `browser` while keeping them separated from the business logic --
the business logic simply consumes a black-box API -- easy to stub, and easy to
unit test.

Because the contract wrapping is done by the business logic itself, it also
ensures the stubs we use in our unit tests accurately implement the contract
API. Thus our unit tests are simoultaneously contract tests.

`client` contains implementations, of the contracts in `dal.js`, for various
platforms. The unit tests for the implementations in `client` also import
contracts from `dal.js` to help ensure that the implementation properly
satisfies the API.

Finally, the entrypoints (`index.js` for Node and `index.browser.js` for the
Browser) orchestrate everything, choosing the appropriate implementations from
`client` and injecting them into the business logic from `lib`.
