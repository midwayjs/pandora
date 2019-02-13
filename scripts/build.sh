#!/bin/bash

set -e

cp ./README.md ./packages/pandora/README.md
npm run authors

lerna run build
