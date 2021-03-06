#!/bin/bash

url="http://localhost:8085"

echo -n "status: "
curl  $url/status
echo
echo
echo -n "tagsets: "
curl  $url/"tile-library/tag-sets"
echo
echo -n "tagset: "
curl  $url/"tile-library/tag-sets/0000"
echo
echo -n "tagset.paths: "
curl  $url/"tile-library/tag-sets/0000/paths"
echo
echo -n "tagset.path: "
curl  $url/"tile-library/tag-sets/0000/paths/01f"
echo
#curl  $url/"tile-library/tag-sets/0000/tile-positions"
echo
echo -n "tagset.tilepos: "
curl  $url/"tile-library/tag-sets/0000/tile-positions/00.247.0000"
echo
echo -n "tagset.locus: "
curl  $url/"tile-library/tag-sets/0000/tile-positions/00.247.0000/locus"
echo

echo
echo

tilepath="247"
#tilestep="0000"
tilestep="0012"
tilepos="00."$tilepath"."$tilestep
#tilevar="00.2c5.30ae.bc952f709d7419f7e103daa2b7e469a9"
tilevar="00.2c5.30ae.46b2e275f595c76ec0b81788d78c3397"
#tilevar="00.2c5.0002.bc952f709d7419f7e103daa2b7e469a9"
tilepos0="00.2c5.12"
tilepos1="00.2c5.12-15"

nam="hg19"
#pdh="dad94936d4144f5e0a289244d8be93e9+5735"
pdh="00"
chr="13"
idx="0"
spo="32199976"
epo="32199983"

echo -n "tagset.var: "
curl  $url/"tile-library/tag-sets/0000/tile-variants/"$tilevar
echo

echo -n "tagset.var.locus: "
curl  $url/"tile-library/tag-sets/0000/tile-variants/"$tilevar"/locus?assembly-name="$nam"&assembly-pdh="$pdh
echo


#echo "..."
#echo $url/"tile-library/tag-sets/0000/tile-variants/"$tilevar"/subsequence?assembly-name="$nam"&assembly-pdh="$pdh"&chromosome-name="$chr"&indexing="$idx"&start-position="$spo"&end-position="$epo
#curl  $url/"tile-library/tag-sets/0000/tile-variants/"$tilevar"/subsequence?assembly-name="$nam"&assembly-pdh="$pdh"&chromosome-name="$chr"&indexing="$idx"&start-position="$spo"&end-position="$epo
#echo
#exit


echo -n "callsets: "
curl  $url/"callsets"
echo

csname="hu826751-GS03052-DNA_B01"

echo -n "callset_name: "
curl  $url/"callsets/"$csname
echo

echo -n "gvcf header: "
curl  $url/"callsets/"$csname"/gvcf-header"
echo

echo -n "gvcf: "
curl  $url/"callsets/"$csname"/gvcf"
echo

echo -n "tile variants ($tilepos0): "
curl  $url/"callsets/"$csname"/tile-variants?tile-positions="$tilepos0
echo

echo -n "tile variants ($tilepos1): "
curl  $url/"callsets/"$csname"/tile-variants?tile-positions="$tilepos1
echo

