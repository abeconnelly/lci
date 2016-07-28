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
  "version" : "0.1.0",
  "assembly": {
    "0" : "hg19",
    "00" : "hg19",
    "0000" : "hg19",
    "x" : "GRCh38"
  }
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

function api_tilevariant_locus(assembly_pdh,tileid_md5) {

  // assembly pdh igonored for now
  //

  var assembly_name = lci_config.assembly[assembly_pdh];

  var tileid_parts = tileid_md5.split(".");
  var tilever_s = tileid_parts[0];
  var tilepath_s = tileid_parts[1];
  var tilestep_s = tileid_parts[2];
  var tilemd5_s = tileid_parts[3];

  var tilever = parseInt(tilever_s, 16);
  var tilepath = parseInt(tilepath_s, 16);
  var tilestep = parseInt(tilestep_s, 16);

  //var x = JSON.parse(api_tilevariant_id(tileid_md5));

  var q = [
    'var assembly_name = "'+assembly_name+'";',
    'var assembly_pdh = "'+assembly_pdh+'";',
    'var tilepath='+tilepath+';',
    'var tilestep='+tilestep+';',
    'var tilever='+tilever+';',
    'var chrom = glfd_assembly_chrom(assembly_name, assembly_pdh, tilepath);',
    'var end_pos = glfd_assembly_end_pos(assembly_name, assembly_pdh, tilepath, tilever, tilestep);',
    '',
    'var beg_pos = 0;',
    'var tilepath_bef=tilepath; tilestep_bef=tilestep-1;',
    'if (tilestep_bef > 0) {',
    '  beg_pos = glfd_assembly_end_pos(assembly_name, assembly_pdh, tilepath_bef, tilever, tilestep_bef)-24;',
    '} else {',
    '  if (tilepath>0) {',
    '    tilepath_bef=tilepath-1;',
    '    var chrom_bef = glfd_assembly_chrom(assembly_name, assembly_pdh, tilepath_bef);',
    '    if (chrom_bef == chrom) {',
    '      tilestep_bef=glf_info.StepPerPath[tilepath_bef]-1;',
    '      beg_pos = glfd_assembly_end_pos(assembly_name, assembly_pdh, tilepath_bef, tilever, tilestep_bef);',
    '    }',
    '  }',
    '}',
    '',
    'glfd_return({ "chrom":chrom, "beg-pos":beg_pos, "end-pos":end_pos });',
    ''].join("\n");

  //return lci_return({"q":q});

  var res_raw = JSON.parse(lci_remote_req("tile-server", q));
  var res = JSON.parse(res_raw["tile-server"][0]);

  return lci_return({"assembly-name":assembly_name, "assembly-pdh":assembly_pdh, "chromosome-name":res.chrom, "indexing":0, "start-position":res["beg-pos"], "end-position":res["end-pos"]});

  //return lci_return({"ok":"ok","info":"locus placeholder"});
}

function api_tilevariant_id(assembly_pdh, tileid_md5) {

  // assembly pdh effectively ignored
  //

  var tile_parts = tileid_md5.split(".");
  var tilever  = tile_parts[0];
  var tilepath = tile_parts[1];
  var tilestep = tile_parts[2];
  var tilemd5  = tile_parts[3];

  var tilepath_int = parseInt(tilepath, 16);
  var tilestep_int = parseInt(tilestep, 16);

  var tilepath_hex_str = hexstr(tilepath_int, 4);

  var cgf_query = [
    'var res = [];',
    'for (var idx=0; idx<cgf_info.cgf.length; idx++) {',
    '  var res_ele = { "id" : idx, "name" : cgf_info.cgf[idx].name };',
    '  var cgf_id = cgf_info.cgf[idx].id;',
    '  var band = JSON.parse(muduk_tile_band(cgf_id, ' + tilepath_int + ', ' + tilestep_int + ', 1));',
    '  var b = band["' + tilepath_hex_str + '"];',
    '  res_ele["allele"] = b["allele"];',
    '  res_ele["loq_info"] = b["loq_info"];',
    '  res.push(res_ele);',
    '}',
    '',
    'muduk_return(res);',
   "" ].join("\n");

  var cgf_res_raw = JSON.parse(lci_remote_req("cgf-server", cgf_query));
  var cgf_res = JSON.parse(cgf_res_raw["cgf-server"][0]);


  var match_resp =  {};
  var x_resp = [];
  var cur_match = 0;
  for (var i=0; i<cgf_res.length; i++) {

    var already_matched = false;

    for (var j=0; j<cgf_res[i].allele.length; j++) {
      var tilevarid = cgf_res[i].allele[j][0];
      var f_opt0 = JSON.stringify({
        "tile-path":parseInt(tilepath,16),
        "tile-lib-version":parseInt(tilever,16),
        "tile-step":parseInt(tilestep, 16),
        "tile-variant-id":cgf_res[i].allele[j][0],
        "loq-info":cgf_res[i].loq_info[j][0]
      });

      var f_opt1 = '0x'+tilepath+',0x'+tilever+',0x'+tilestep+',0x'+tilevarid+'';
      var tile_lib_query = [
        'var tilepath=0x'+tilepath+';',
        'var tilestep=0x'+tilestep+';',
        'var query_str = JSON.stringify(' + f_opt0 + ');',
        'var seq_hiq = tilesequence('+f_opt1+');',
        'var seq = tilesequenceloq(query_str);',
        'var span = glfd_tilespan('+f_opt1+');',
        'var m5str = seqmd5sum(seq);',
        'var end_tag = false;',
        'var beg_tag = false;',
        'if ((tilestep + parseInt(span)) >= glf_info.StepPerPath[tilepath]) { end_tag = true; }',
        'if (tilestep==0) { beg_tag = true; }',
        'glfd_return({"seq":seq, "span":span, "md5sum":m5str, "end-tag":end_tag, "beg-tag":beg_tag, "seq-hiq":seq_hiq });',
        '' ].join("\n");

      var raw_resp = JSON.parse(lci_remote_req("tile-server", tile_lib_query));
      var resp = JSON.parse(raw_resp["tile-server"][0]);

      var cur_tot = cgf_res.length;

      if (resp.md5sum == tilemd5) {
        if (tilestep == 0)
        if (!already_matched) { cur_match+=1; }
        already_matched=true;
        var tag_beg = "";
        var tag_end = "";
        if (!resp["beg-tag"]) { tag_beg = resp["seq-hiq"].slice(0,24); }
        if (!resp["end-tag"]) {
          var n = resp["seq-hiq"].length;
          tag_end = resp["seq-hiq"].slice(n-24,n);
        }

        match_resp = {
          "tile-variant-id": tilevarid,
          "tile-variant" : tileid_md5,
          "tag-length": 24,
          "start-tag": tag_beg,
          "end-tag": tag_end,
          "is-start-of-path-tag": resp["beg-tag"],
          "is-end-of-path-tag": resp["end-tag"],
          "sequence": resp.seq,
          "md5sum": resp.md5sum,
          "length": resp.seq.length,
          "number-of-positions-spanned":resp.span,
          "population-frequency": cur_match / cur_tot,
          "population-count":cur_match,
          "population_total":cur_tot
        };
      }

      x_resp.push(resp);

    }
  }

  //return lci_return(cgf_res);
  //return lci_return(x_resp);
  return lci_return(match_resp);
}

//------------------------
//------------------------
//------------------------


function api_callsets() {

  var cgf_query = [

    'var res = [];',
    'for (var i=0; i<cgf_info.cgf.length; i++) {',
    '  res.push(cgf_info.cgf[i].name);',
    '',
    '}',
    'muduk_return(res);',

    ''].join("\n");

  var cgf_res_raw = JSON.parse(lci_remote_req("cgf-server", cgf_query));
  var cgf_res = JSON.parse(cgf_res_raw["cgf-server"][0]);

  return lci_return(cgf_res);
}

function api_callsets_id(callset_name) {

  var cgf_query = [

    'var callset_name = "' + callset_name + '";',
    'var res = {};',
    'for (var i=0; i<cgf_info.cgf.length; i++) {',
    '  if (cgf_info.cgf[i].name == callset_name) {',
    '    res["callset-name"] = callset_name;',
    '    res["callset-locator"] = cgf_info.cgf[i].file;',
    '    break;',
    '  }',
    '',
    '}',
    'muduk_return(res);',

    ''].join("\n");

  var cgf_res_raw = JSON.parse(lci_remote_req("cgf-server", cgf_query));
  var cgf_res = JSON.parse(cgf_res_raw["cgf-server"][0]);

  return lci_return(cgf_res);

}

function api_callsets_gvcf_header() {
}

function api_callsets_gvcf() {
}

function api_callsets_tilevariants(callset_name, tile_positions) {

  var tile_parts = tile_positions.split(".");
  var tilever = parseInt(tile_parts[0], 16);
  var tilepath = parseInt(tile_parts[1], 16);
  var tile_step_parts = tile_parts[2].split("-");
  var tilestep = -1;
  var n_tilestep = 1;

  if (tile_step_parts.length==1) {
    tilestep = parseInt(tile_step_parts[0], 16);

  } else if (tile_step_parts.length==2) {

    tilestep = parseInt(tile_step_parts[0], 16);
    var end_tilestep = parseInt(tile_step_parts[1], 16);
    n_tilestep = end_tilestep - tilestep;

  } else {
    return lci_return({"error":"invalid parameter: " + tile_positions});
  }

  if ((tilestep < 0) || (n_tilestep<1)) {
    return lci_return({"error":"invalid tilestep or range: " + tile_positions});
  }


  var cgf_query = [

    'var callset_name = "'+callset_name+'";',
    'var tilepath = '+tilepath+';',
    'var tilestep = '+tilestep+';',
    'var n_tilestep = '+n_tilestep+';',
    'var cgf_id = -1;',
    'for (var i=0; i<cgf_info.cgf.length; i++) {',
    '  if (cgf_info.cgf[i].name == callset_name) { cgf_id = cgf_info.cgf[i].id; break; }',
    '}',
    '',
    'resp = {};',
    'if (cgf_id>=0) {',
    '  resp = muduk_tile_band(cgf_id, tilepath, tilestep, n_tilestep);',
    '}',
    '',
    'muduk_return(resp);',

    ''].join("\n");

  var cgf_res_raw = JSON.parse(lci_remote_req("cgf-server", cgf_query));
  var cgf_res = JSON.parse(cgf_res_raw["cgf-server"][0]);

  var hextilepath = hexstr(tilepath, 4);

  var callpos_info = cgf_res[hextilepath];

  //return lci_return(callpos_info);

  var glf_query = [

    'var callset_name = "'+ callset_name  +'";',
    'var tilever = 0;',
    'var z = ' + JSON.stringify(callpos_info) + ';',
    'var res = { "callset-name":callset_name, "tile-variants":[] };',
    'var debug=[];',
    'for (var aa=0; aa<z.allele.length; aa++) {',
    '',
    '  res["tile-variants"].push([]);',
    '  var curstep = z.start_tilestep-1;',
    '  var tilepath = z.tilepath;',
    '',
    '',
    '  for (var i=0; i<z.allele[aa].length; i++) {',
    '    curstep++;',
    '',
    '    if (z.allele[aa][i] < 0) { continue; }',
    '',
    '',
    '    var qstr = JSON.stringify({"tile-path":tilepath, "tile-step":curstep, "tile-lib-version":tilever, "tile-variant-id":z.allele[aa][i], "loq-info":z.loq_info[aa][i]});',
    '',
    '    var fullseq = tilesequenceloq(qstr);',
    '    var m5s = seqmd5sum(fullseq);',
    '',
    '    res["tile-variants"][aa].push(m5s);',
    '  }',
    '}',
    'glfd_return(res);',

  ''].join("\n")

  var glf_res_raw = JSON.parse(lci_remote_req("tile-server", glf_query));
  var glf_res = JSON.parse(glf_res_raw["tile-server"][0]);

  return lci_return(glf_res);
}

function api_assemblies() {
}

function api_assemblies_id() {
}




