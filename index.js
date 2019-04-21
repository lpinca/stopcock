'use strict';

/**
 * Class representing a token bucket.
 */
class TokenBucket {
  /**
   * Create a new `TokenBucket`.
   *
   * @param {Object} options Options object
   * @param {Number} options.limit The tokens to add per `interval`
   * @param {Number} options.interval The interval at which tokens are added
   * @param {Number} options.bucketSize The capacity of the bucket
   */
  constructor(options) {
    this.tokens = this.capacity = options.bucketSize;
    this.interval = options.interval;
    this.limit = options.limit;
    this.last = Date.now();
  }

  /**
   * Refill the bucket with the proper amount of tokens.
   */
  refill() {
    const now = Date.now();
    const tokens = Math.floor(((now - this.last) * this.limit) / this.interval);

    this.tokens += tokens;

    //
    // `tokens` is rounded downward, so we only add the actual time required by
    // those tokens.
    //
    this.last += Math.ceil((tokens * this.interval) / this.limit);

    if (this.tokens > this.capacity) {
      this.tokens = this.capacity;
      this.last = now;
    }
  }

  /**
   * Remove a token from the bucket.
   *
   * @return {Number} The amount of time to wait for a token to be available
   */
  consume() {
    this.refill();

    if (this.tokens) {
      this.tokens--;
      return 0;
    }

    return Math.ceil(this.interval / this.limit - (Date.now() - this.last));
  }
}

/**
 * Limit the execution rate of a function using a leaky bucket algorithm.
 *
 * @param {Function} fn The function to rate limit calls to
 * @param {Object} options Options object
 * @param {Number} options.limit The number of allowed calls per `interval`
 * @param {Number} options.interval The timespan where `limit` is calculated
 * @param {Number} options.queueSize The maximum size of the queue
 * @param {Number} options.bucketSize The capacity of the bucket
 * @return {Function}
 * @public
 */
function stopcock(fn, options) {
  options = Object.assign(
    {
      queueSize: Math.pow(2, 32) - 1,
      bucketSize: 40,
      interval: 1000,
      limit: 2
    },
    options
  );

  const bucket = new TokenBucket(options);
  const queue = [];
  let timer = null;

  function shift() {
    clearTimeout(timer);
    while (queue.length) {
      const delay = bucket.consume();

      if (delay > 0) {
        timer = setTimeout(shift, delay);
        break;
      }

      const data = queue.shift();
      data[2](fn.apply(data[0], data[1]));
    }
  }

  function limiter() {
    const args = arguments;

    return new Promise((resolve, reject) => {
      if (queue.length === options.queueSize) {
        return reject(new Error('Queue is full'));
      }

      queue.push([this, args, resolve]);
      shift();
    });
  }

  Object.defineProperty(limiter, 'size', { get: () => queue.length });

  return limiter;
}

module.exports = stopcock;
