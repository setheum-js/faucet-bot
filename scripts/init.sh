#!/usr/bin/env bash

set -e

echo "*** Initializing Bot"

yarn

pm2 start -- environment.json