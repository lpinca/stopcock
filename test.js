'use strict';

const test = require('tape');

const stopcock = require('.');

test('is exported as a function', (t) => {
  t.equal(typeof stopcock, 'function');
  t.end();
});

test('returns a function that returns a promise', (t) => {
  const limit = stopcock(() => 'foo');

  limit().then((value) => {
    t.equal(value, 'foo');
    t.end();
  });
});

test('calls the original function with the same context and arguments', (t) => {
  const limit = stopcock(function () {
    t.deepEqual(arguments, (function () { return arguments; })(1, 2));
    t.equal(this, 'foo');
  });

  limit.call('foo', 1, 2).then(t.end);
});

test('allows to limit the queue size', (t) => {
  const limit = stopcock(() => {}, {
    bucketSize: 1,
    interval: 100,
    queueSize: 2,
    limit: 1
  });

  limit();
  limit();
  limit();
  limit().then(() => {
    t.fail('Promise should not be fulfilled');
    t.end();
  }, (err) => {
    t.equal(err instanceof Error, true);
    t.equal(err.message, 'Queue is full');
    t.end();
  });
});

test('limits the execution rate of the original function', (t) => {
  const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const start = Date.now();
  const times = [];
  const limit = stopcock((arg) => {
    times.push(Date.now());
    return Promise.resolve(arg);
  }, {
    bucketSize: 4,
    interval: 200,
    limit: 2
  });

  Promise.all(values.map((i) => limit(i))).then((data) => {
    t.deepEqual(data, values);
    times.forEach((time, i) => {
      const delay = i < 4 ? 0 : (i - 3) * 100;
      const diff = time - start - delay;

      t.ok(diff >= 0 && diff < 20);
    });
    t.end();
  });
});

test('prevents the bucket from going over capacity', (t) => {
  const limit = stopcock(() => Date.now(), {
    bucketSize: 1,
    interval: 50,
    limit: 1
  });

  setTimeout(() => {
    const start = Date.now();

    limit();
    limit().then((now) => {
      t.ok(now - start >= 50);
      t.end();
    });
  }, 150);
});
