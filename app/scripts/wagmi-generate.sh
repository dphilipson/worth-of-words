#!/usr/bin/env bash

set -e

FILE=app/_generated/wagmi.ts

npx wagmi generate
echo -e "// @ts-nocheck\n$(cat $FILE)" > $FILE
