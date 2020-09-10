#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const { mkdirSync } = require('fs');
const glob = require('glob');
const projectDir = path.resolve(__dirname, '..');

const rimraf = require('rimraf');

process.chdir(projectDir);
rimraf.sync('.nyc_output');
mkdirSync('.nyc_output', { recursive: true });
// Merge coverage data from each package so we can generate a complete report

glob.sync('packages/*/.nyc_output').forEach(nycOutput => {
  const cwd = path.dirname(nycOutput);
  const { status, stderr } = spawnSync(
    'nyc',
    [
      'merge',
      '.nyc_output',
      path.join(projectDir, '.nyc_output', path.basename(cwd) + '.json'),
    ],
    {
      encoding: 'utf8',
      shell: true,
      cwd,
    }
  );

  if (status !== 0) {
    console.error(stderr);
    process.exit(status);
  }
});
