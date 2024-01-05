#!/usr/bin/env bash

set -e

# Deploys the Worth of Words frontend to S3. Assumes that this directory
# (worth-of-words-terraform) is a sibling to the worth-of-words repo. Don't
# forget to build the frontend and to `aws sso login` first!

S3_ID=www.worthofwords.com
CLOUDFRONT_ID=E1J185RYC67O6L

# https://stackoverflow.com/a/246128/2695248
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source $SCRIPT_DIR/../.env.local

if [[ -z $S3_ID ]]; then
  echo 'S3_ID not set'
  exit 1
fi

if [[ -z $CLOUDFRONT_ID ]]; then
  echo 'CLOUDFRONT_ID not set'
  exit 1
fi

aws s3 sync $SCRIPT_DIR/../worth-of-words/app/out s3://$S3_ID --delete
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths '/*' --no-cli-pager