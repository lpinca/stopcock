# stopcock

[![Version npm][npm-stopcock-badge]][npm-stopcock]
[![Build Status][travis-stopcock-badge]][travis-stopcock]
[![Coverage Status][coverage-stopcock-badge]][coverage-stopcock]

Limit the execution rate of a function using the token bucket algorithm. Useful
for scenarios such as REST APIs consumption where the amount of requests per
unit of time should not exceed a given threshold.

## Install

```
npm install --save stopcock
```

## API

The module exports a single function that takes two arguments.

### `stopcock(fn[, options])`

Returns a function which should be called instead of `fn`.

#### Arguments

- `fn` - The function to rate limit calls to.
- `options` - A plain JavaScript object that contains the configuration options.

#### Options

- `limit` - The maximum number of allowed calls per `interval`. Defaults to 2.
- `interval` - The timespan where `limit` is calculated. Defaults to 1000.
- `bucketSize` - The capacity of the bucket. Defaults to 40.
- `queueSize` - The maximum size of the internal queue. Defaults to 2^32 - 1
  which is the maximum array size in JavaScript.

#### Return value

A function that returns a promise which resolves to the value returned by the
original `fn` function. The returned function has a `size` accessor property
which returns the internal queue size. When the queue is at capacity the promise
is rejected.

#### Example

```js
const stopcock = require('stopcock');

function request(i) {
  return Promise.resolve(`${i} - ${new Date().toISOString()}`);
}

function log(data) {
  console.log(data);
}

const get = stopcock(request, { bucketSize: 5 });

for (let i = 0; i < 10; i++) {
  get(i).then(log);
}

/*
0 - 2017-03-30T16:46:39.938Z
1 - 2017-03-30T16:46:39.940Z
2 - 2017-03-30T16:46:39.940Z
3 - 2017-03-30T16:46:39.940Z
4 - 2017-03-30T16:46:39.940Z
5 - 2017-03-30T16:46:40.443Z
6 - 2017-03-30T16:46:40.943Z
7 - 2017-03-30T16:46:41.441Z
8 - 2017-03-30T16:46:41.942Z
9 - 2017-03-30T16:46:42.439Z
*/
```

## License

[MIT](LICENSE)

[npm-stopcock-badge]: https://img.shields.io/npm/v/stopcock.svg
[npm-stopcock]: https://www.npmjs.com/package/stopcock
[travis-stopcock-badge]: https://img.shields.io/travis/lpinca/stopcock/master.svg
[travis-stopcock]: https://travis-ci.org/lpinca/stopcock
[coverage-stopcock-badge]: https://img.shields.io/coveralls/lpinca/stopcock/master.svg
[coverage-stopcock]: https://coveralls.io/r/lpinca/stopcock?branch=master
