var tilepath = 763;
var hu_idx = 0;
var dataset_id = "hu826751-GS03052-DNA_B01";

var hextilepath = hexstr(tilepath, 4);

var cgf_req = [

  'var dataset_idx = cgf_info["id"]["' + dataset_id + '"];',
  'var tilepath = ' + tilepath + ';',
  'var n_tilestep = cgf_info.StepPerPath[tilepath];',
  'var band_info = muduk_tile_band(dataset_idx, tilepath, 0, n_tilestep);',
  'muduk_return(band_info);',

""].join("\n");


var raw_cgf_s = JSON.parse(lci_remote_req("cgf-server", cgf_req));

lci_return({"ok":raw_cgf_s});
var cgf_s = raw_cgf_s["cgf-server"][0];
var band_info_full = JSON.parse(cgf_s);
var band_info = band_info_full[hextilepath];

var allele = band_info.allele;
var loq_info = band_info.loq_info;

lci_return(band_info);


var tilesrv_req = [


  'var allele = ' + JSON.stringify(allele) + ';',
  'var loq_info = ' + JSON.stringify(loq_info) + ';',
  'var tilepath = ' + tilepath + ';',
  '',


  'var skip_tag = false;',
  'var ret_a = [];',
  'var tilestep = 0;',
  'while (tilestep < allele[0].length) {',
  '  var local_allele = [[],[]];',
  '  var local_loq_info = [[],[]];',
  '',
  '  local_allele[0].push(allele[0][tilestep]);',
  '  local_allele[1].push(allele[1][tilestep]);',
  '',
  '  local_loq_info[0].push(loq_info[0][tilestep]);',
  '  local_loq_info[1].push(loq_info[1][tilestep]);',
  '',
  '  var beg_tilestep = tilestep;',
  '  tilestep++;',
  '',
  '',
  '  while ((tilestep < allele[0].length) && ((allele[0][tilestep] < 0) || (allele[1][tilestep] < 0))) {',
  '    local_allele[0].push(allele[0][tilestep]);',
  '    local_allele[1].push(allele[1][tilestep]);',
  '    local_loq_info[0].push(loq_info[0][tilestep]);',
  '    local_loq_info[1].push(loq_info[1][tilestep]);',
  '    tilestep++;',
  '  }',
  '',
  '  var q = {"tilepath": tilepath, "allele": local_allele, "loq_info": local_loq_info, "skip_tag_prefix":skip_tag, "start_tilestep": beg_tilestep };',
  '  var r = tiletogvcf(JSON.stringify(q), false);',
  '  ret_a.push(r);',
  '  skip_tag = true;',
  '}',
  '',
  'glfd_return({"result":ret_a.join("")});',
  '',

""].join("\n");


lci_return({"ok":tilesrv_req});

var raw_resp = JSON.parse(lci_remote_req("tile-server", tilesrv_req));
var ts_resp = JSON.parse(raw_resp["tile-server"][0]);

lci_return(ts_resp);
