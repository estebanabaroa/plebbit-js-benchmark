#!/usr/bin/env bash

# deploy to a server

# go to current folder
cd "$(dirname "$0")"
cd ..

# add env vars
if [ -f .deploy-env ]; then
  export $(echo $(cat .deploy-env | sed 's/#.*//g'| xargs) | envsubst)
fi

# check creds
if [ -z "${DEPLOY_HOST+xxx}" ]; then echo "DEPLOY_HOST not set" && exit; fi
if [ -z "${DEPLOY_USER+xxx}" ]; then echo "DEPLOY_USER not set" && exit; fi
if [ -z "${DEPLOY_PASSWORD+xxx}" ]; then echo "DEPLOY_PASSWORD not set" && exit; fi

# copy files
FILE_NAMES=(
  "scripts/debug-libp2p-fetch-ipns.js"
)

# copy files
for FILE_NAME in ${FILE_NAMES[@]}; do
  sshpass -p "$DEPLOY_PASSWORD" scp $FILE_NAME "$DEPLOY_USER"@"$DEPLOY_HOST":/home/plebbit-js-benchmark/scripts
done

SCRIPT="
cd /home/plebbit-js-benchmark
# sudo n 20
# node -v
# rm -fr node_modules
# npm install
DEBUG=libp2p*,helia*,delegated*,plebbit* node scripts/debug-libp2p-fetch-ipns.js
"

# SCRIPT="
# while true; do
#   cd /home/plebbit-js-benchmark
#   node scripts/debug-libp2p-fetch-ipns.js
# done
# "

echo "$SCRIPT" | sshpass -p "$DEPLOY_PASSWORD" ssh "$DEPLOY_USER"@"$DEPLOY_HOST"
