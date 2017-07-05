/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let gulp = require('gulp');
let path = require('path');
let run = require('gulp-run');
let zip = require('gulp-vinyl-zip');
let { getShortCommit, readPackageFile, updateVersion } = require('./version.js');

function memoize(fn) {
  let memo = new Map();
  return (...args) => {
    let key = JSON.stringify(args);
    if (memo.has(key)) {
      return memo.get(key);
    } else {
      let value = fn(...args);
      memo.set(key, value);
      return value;
    }
  }
}

let getBuildMetadata = memoize(getShortCommit);

function setBuildMetadata(version) {
  let metadata = getBuildMetadata();
  return version.replace(/(\+[0-9A-Za-z-\.])?$/, `+${metadata}`);
}

function server() {
  updateVersion('server', setBuildMetadata);
  return run('gulp build -o ../build', { cwd: path.resolve('server') }).exec();
}

function client() {
  updateVersion('client', setBuildMetadata);
  return run('gulp build -o ../build/dist', { cwd: path.resolve('client') }).exec();
}

function pack() {
  let version = readPackageFile('build').version;
  return gulp.src('build/**/*')
    .pipe(zip.dest(`dist/environment-manager-${version}.zip`));
}

gulp.task('pack', ['client', 'server'], pack);
gulp.task('client', client);
gulp.task('server', server);
gulp.task('default', ['pack']);