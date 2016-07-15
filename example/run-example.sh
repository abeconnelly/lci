#!/bin/bash

url="http://localhost:8085/exec"

x="$1"

if [[ "$x" == "" ]] ; then
  echo "provide filename"
  exit 1
fi

use_jq=0
y="$2"
if [[ "$y" == "" ]] ; then
  use_jq=1
fi

#cat $x
#echo "---"

if [[ $use_jq -eq 1 ]] ; then
  curl -s -H 'Content-Type: application/json' -X POST --data-binary @$x $url | jqf --fold 32 .
else
  curl -s -H 'Content-Type: application/json' -X POST --data-binary @$x $url
fi

