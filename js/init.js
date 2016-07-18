print = ((typeof(print)==="undefined") ? console.log : print);

function hexstr(x, sz) {
  sz = ((typeof sz==="undefined")?0:sz);
  var t = x.toString(16);
  if (t.length < sz) {
    t = Array(sz - t.length + 1).join("0") + t;
  }
  return t;
}

var lci_config =   {
  "tile-server" : [ "http://localhost:8081" ],
  "cgf-server" : [ "http://localhost:8082" ],
  "annotation-server" : [ "http://localhost:8083" ],
  "phenotype-server" : [ "http://localhost:8084" ],
  "version" : "0.1.0"
}


function help() {
  print("lightning call intermediary server");
}

function lci_return(q, indent) {
  indent = ((typeof(indent)==="undefined") ? '' : indent);
  if (typeof(q)==="undefined") { return ""; }
  if (typeof(q)==="object") {
    var s = "";
    try {
      s = JSON.stringify(q, null, indent);
    } catch(err) {
    }
    return s;
  }
  if (typeof(q)==="string") { return q; }
  if (typeof(q)==="number") { return q; }
  return "";
}

function info() {
  return lci_return(lci_config);
}

function api_tilepaths() {
  var tileserver_info = JSON.parse(lci_remote_req("tile-server", 'glfd_return(info());'));
  var glfd_info = JSON.parse(tileserver_info["tile-server"][0]);
  var ret_a = [];
  for (var i=0; i<glfd_info.PathCount; i++) {
    ret_a.push(i);
  }
  return lci_return(ret_a);
}

function api_tilepath(tilepath) {
  var tileserver_info = JSON.parse(lci_remote_req("tile-server", 'glfd_return(info());'));
  var glfd_info = JSON.parse(tileserver_info["tile-server"][0]);
  var ret_o = {};
  ret_o["path"] = tilepath;
  ret_o["num-positions"] = glfd_info.StepPerPath[tilepath];
  return lci_return(ret_o);
}

function api_tilepositions() {
  var tileserver_info = JSON.parse(lci_remote_req("tile-server", 'glfd_return(info());'));
  var glfd_info = JSON.parse(tileserver_info["tile-server"][0]);
  var ret_a = [];
  for (var tilepath=0; tilepath<glfd_info.PathCount; tilepath++) {
    var n = glfd_info.StepPerPath[tilepath];
    for (var i=0; i<n; i++) {
      ret_a.push(hexstr(0,2) + "." + hexstr(tilepath, 4) + "." + hexstr(i, 4));
    }
  }
  return lci_return(ret_a);
}

function api_tileposition_info(tilepos) {

  var parts = tilepos.split(".");
  var tilever = parseInt(parts[0], 16);
  var tilepath = parseInt(parts[1], 16);
  var tilestep = parseInt(parts[2], 16);

  var tileserver_info = JSON.parse(lci_remote_req("tile-server", "glfd_tilepos_info(" + tilepath + "," + tilever + "," + tilestep +");" ));
  var result_json = JSON.parse(tileserver_info["tile-server"][0]);
  var n_var = result_json.length;
  var n_well_seq = 0;

  for (var i=0; i<n_var; i++) {
    if ((result_json[i].seq.indexOf('n')>=0) || (result_json[i].seq.indexOf('N')>=0)) {
      continue;
    }
    n_well_seq++;
  }

  var cgf_server_info = JSON.parse(lci_remote_req("cgf-server", "muduk_return(cgf_info);"));
  var cgf_result = JSON.parse(cgf_server_info["cgf-server"][0]);
  var n_genome = cgf_result.cgf.length;

  return lci_return({"tile-position":tilepos, "total-tile-variants":n_var, "well-sequenced-tile-variants":n_well_seq, "num-genomes":n_genome});
}

function api_tileposition_locus(tilepos) {

  var parts = tilepos.split(".");
  var tilever = parseInt(parts[0], 16);
  var tilepath = parseInt(parts[1], 16);
  var tilestep = parseInt(parts[2], 16);

  var glfd_req = [

    'var tilepath = ' + tilepath + ';',
    'var libver = ' + tilever + ';',
    'var tilestep = ' + tilestep + ';',
    'var a = "hg19";',
    'var apdh = "x";',
    '',
    'var span = 1;',
    '',
    'var chrom = glfd_assembly_chrom(a, apdh, tilepath);',
    'var alt_chrom = chrom;',
    '',
    'var ref_start = 0;',
    'if (tilestep>0) { ref_start = glfd_assembly_end_pos(a, apdh, tilepath, libver, tilestep-1); }',
    'else if (tilepath>0) {',
    '  alt_chrom = glfd_assembly_chrom(a, apdh, tilepath-1);',
    '  var end_step = glf_info.StepPerPath[tilepath-1];',
    '  ref_start = glfd_assembly_end_pos(a, apdh, tilepath-1, libver, end_step-1);',
    '}',
    '',
    'var ref_end = glfd_assembly_end_pos(a, apdh, tilepath, libver, tilestep+span-1);',
    'if (alt_chrom!=chrom) { ref_start = 0; }',
    'var tilepos_str = [ hexstr(tilepath, 4), hexstr(libver, 2), hexstr(tilestep, 4) ].join(".");',
    '',
    'var ret_obj = {"assembly-name":a, "assembly-pdh":apdh, "chromosome-name":chrom, "indexing":0, "start-position":ref_start, "end-position":ref_end };',
    'glfd_return(ret_obj);',

  ''].join("\n");


  var tileserver_info = JSON.parse(lci_remote_req("tile-server", glfd_req));
  var result_json = JSON.parse(tileserver_info["tile-server"][0]);

  return lci_return(result_json);
}

