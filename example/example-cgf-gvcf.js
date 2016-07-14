// Example of contacting the CGF server to get a tile band
// for a dataset, then contacting the Tile Library server
// to get the GVCF output.
//

var tilepath_i = 763;
var tilepath_hex = hexstr(tilepath_i, 4);

var cgf_req = "var idx = cgf_info['id']['hu826751-GS03052-DNA_B01'];\n" +
"var tilepath = " + tilepath_i + ";\n" +
"var tile_begstep = 30;\n" +
"var tile_nstep = 100;\n" +
"var x = muduk_tile_band(idx, tilepath, tile_begstep, tile_nstep);\n" +
"muduk_return(x);";

var cgf_s = JSON.parse(lci_remote_req("cgf-server", cgf_req));
lci_return(cgf_s);

var resp_json = JSON.parse(cgf_s["cgf-server"][0]);

var struc = JSON.stringify(resp_json[tilepath_hex]);

var tilelib_req = [

  'var x = ' + struc + ';',
  'var seq = [[],[]];',
  '',
  'var q = {"tilepath":x.tilepath, "allele": x.allele, "loq_info":x.loq_info, "start_tilestep":x.start_tilestep};',
  'var r = tiletogvcf(JSON.stringify(q), false);',
  '',
  'glfd_return({"result":r});',

""].join("\n");

var tile_s = JSON.parse(lci_remote_req("tile-server", tilelib_req));
var res_s = tile_s["tile-server"][0];
var res_json = JSON.parse(res_s);

var aa = res_json.result.split("\n");

lci_return(tile_s);
//lci_return(aa);
