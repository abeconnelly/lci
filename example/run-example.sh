#!/bin/bash

url="http://localhost:8085/exec"

x="$1"

if [[ "$x" == "" ]] ; then
  echo "provide filename"
  exit 1
fi

cat $x

echo "---"

curl -s -H 'Content-Type: application/json' -X POST --data-binary @$x $url | jqf --fold 32 .
#curl -s -H 'Content-Type: application/json' -X POST --data-binary @$x $url

