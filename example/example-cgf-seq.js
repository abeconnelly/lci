// Example of contacting the CGF server to get a tile band
// for a dataset, then contacting the Tile Library server
// to get the underlying sequence.
//
// The sequence is filled in with nocalls locally (here in
// JavaScript).
//

var tilepath_i = 763;
var tilepath_hex = hexstr(tilepath_i, 4);

var cgf_req = "var idx = cgf_info['id']['hu826751-GS03052-DNA_B01'];\n" +
"var tilepath = " + tilepath_i + ";\n" +
"var tile_begstep = 30;\n" +
"var tile_nstep = 10;\n" +
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
  'var allele = x.allele;',
  'var loq = x.loq_info;',
  'var tilepath = x.tilepath;',
  'var beg_step = x.start_tilestep;',
  '',
  'for (var i=0; i<allele[0].length; i++) {',
  '  if (allele[0][i] < 0) {',
  '    seq[0].push("");',
  '  } else {',
  '    seq[0].push(tilesequence(tilepath, 0, beg_step + i, allele[0][i]));',
  '  }',
  '',
  '  if (allele[1][i] < 0) {',
  '    seq[1].push("");',
  '  } else {',
  '    seq[1].push(tilesequence(tilepath, 0, beg_step + i, allele[1][i]));',
  '  }',
  '',
  '}',
  '',
  'glfd_return(seq);',

""].join("\n");

lci_return({"ok":"ok"});
lci_return({"req":tilelib_req});

var tile_s = JSON.parse(lci_remote_req("tile-server", tilelib_req));
//var tile_resp_json = JSON.parse(tile_s["tile-server"][0]);
var seq = JSON.parse(tile_s["tile-server"][0]);

var loq_info = resp_json[tilepath_hex].loq_info;


for (var i=0; i<loq_info[0].length; i++) {

  for (var allele=0; allele<2; allele++) {
    var curseq = seq[allele][i];
    if (curseq.length > 0) {
      for (var j=0; j<loq_info[allele][i].length; j+=2) {
        var beg = loq_info[allele][i][j];
        var n = loq_info[allele][i][j+1];

        var nocs = Array(n+1).join("n");

        curseq = curseq.slice(0,beg) + nocs + curseq.slice(beg+n);

      }
      seq[allele][i] = curseq;
    }
  }
}

var ret_struct = {};
ret_struct[tilepath_hex] = {
  "start_tilestep": resp_json[tilepath_hex].start_tilestep,
  "allele": resp_json[tilepath_hex].allele,
  "tilepath": resp_json[tilepath_hex].tilepath,
  "seq":seq,
  "loq_info":loq_info
};

lci_return(ret_struct);
