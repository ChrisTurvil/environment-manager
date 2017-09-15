'use strict';

function foreverAsync(cancellationToken, fn, init) {
  return cancellationToken.cancel
    ? Promise.resolve(init)
    : Promise.resolve(init)
      .then(fn)
      .then(result => foreverAsync(cancellationToken, fn, result));
}

module.exports = foreverAsync;
