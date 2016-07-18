#!/bin/bash

url="http://localhost:8085"

curl  $url/status
echo
curl  $url/"tile-library/tag-sets"
echo
curl  $url/"tile-library/tag-sets/0000"
echo
curl  $url/"tile-library/tag-sets/0000/paths"
echo
curl  $url/"tile-library/tag-sets/0000/paths/01f"
echo
#curl  $url/"tile-library/tag-sets/0000/tile-positions"
echo
curl  $url/"tile-library/tag-sets/0000/tile-positions/00.247.0000"
echo
curl  $url/"tile-library/tag-sets/0000/tile-positions/00.247.0000/locus"
echo
exit

