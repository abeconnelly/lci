// This example uses four of the servers (the phenotype
// server, the variatn server, the compact genome server and the tile library
// server).
//  * A participant is discovered through the phenotype server with
//    a trait criterea (blood type AB+ and some type of sleep paralysis).
//  * A variant is looked up in the ClinVar database with a particular RSID.
//  * The tile variant is looked up for the participant querying the cgf server.
//  * The sequence of the tile variant is requested from the tile server.
//
// Though the example is synthetic, this should give a sense for how to use
// all the different components to construct other non-trivial queries.
//

// Look up a participant with blood type 'AB +' and that has some type
// of sleep paralysis.
//
var pheno_req = [

  'var phen_query = [',
  '',
  '  "select s0.human_id,",',
  '  "  h.dataset_name,",',
  '  "  s0.phenotype_category,",',
  '  "  s0.phenotype,",',
  '  "  s1.phenotype_category,",',
  '  "  s1.phenotype",',
  '  "from survey s0, survey s1, huid_lightning_dataset_map h",',
  '  "where s0.phenotype_category = \'Basic_Phenotypes:Blood Type\' and s0.phenotype = \'AB +\'",',
  '  "  and s1.phenotype_category = \'Nervous_System\' and s1.phenotype like \'%sleep paralysis%\'",',
  '  "  and s0.human_id = s1.human_id",',
  '  "  and s0.human_id = h.human_id",',
  '',
  '""].join("\\n");',
  '',
  'var phen_r = pheno_sql(phen_query);',
  'var phen_r_json = JSON.parse(phen_r);',
  '',
  'pheno_return(phen_r_json.result[1]);',

""].join("\n")

var pheno_resp_raw = JSON.parse(lci_remote_req("phenotype-server", pheno_req));
var pheno_res = JSON.parse(pheno_resp_raw["phenotype-server"][0]);

var huid = pheno_res[0];
var dataset_id = pheno_res[1];


// Now look up a variant in ClinVar with the below RSID
//
var rsid = 'rs17885240';
var variant_req = [

  'var result = {};',
  '',
  'var clinvar_query = "select id, chrom, pos, rsid, ref, alt, qual, filter, info from clinvar where rsid = \'' + rsid + '\' limit 3;"',
  'var ret_cv_json = JSON.parse(lvcvd_sql(clinvar_query));',
  'var clinvar_id = parseInt(ret_cv_json.result[1][0]);',
  '',
  'result.clinvar_id = clinvar_id;',
  'result.clinvar_pos = ret_cv_json.result[1][2];',
  'result.rsid = ret_cv_json.result[1][3];',
  'result.clinvar_ref = ret_cv_json.result[1][4];',
  'result.clinvar_alt = ret_cv_json.result[1][5];',
  'result.clinvar_info = ret_cv_json.result[1][8];',
  '',
  'var tile_query = "select id, clinvar_id, tileID from clinvar_tilemap where clinvar_id = " + clinvar_id + ";";',
  'var ret_t_json = JSON.parse(lvcvd_sql(tile_query));',
  '',
  'result.tile_info = [];',
  '',
  'for (var i=1; i<ret_t_json.result.length; i++) {',
  '  var t_inf = {};',
  '  t_inf.tileID = ret_t_json.result[i][2];',
  '',
  '  var tile_parts = t_inf.tileID.split(".");',
  '  var tilepath = parseInt(tile_parts[0], 16);',
  '  var tilever = parseInt(tile_parts[1], 16);',
  '  var tilestep = parseInt(tile_parts[2], 16);',
  '  var tilevar  = parseInt(tile_parts[3], 16);',
  '',
  '  var assembly_query = "select reference_name, chromosome, tilepath, tilestep, reference_start, reference_length from lightning_tile_assembly where tilepath = " + tilepath + " and tilestep = " + tilestep + ";";',
  '  var ret_a = JSON.parse(lvcvd_sql(assembly_query));',
  '',
  '  t_inf.refName = ret_a.result[1][0];',
  '  t_inf.refChrom = ret_a.result[1][1];',
  '  t_inf.refStart = ret_a.result[1][4];',
  '  t_inf.refLen = ret_a.result[1][5];',
  '  t_inf.tilepath = tilepath;',
  '  t_inf.tilestep = tilestep;',
  '  t_inf.tilevariant = tilevar;',
  '  t_inf.tileversion = tilever;',
  '',
  '  result.tile_info.push(t_inf);',
  '}',
  'vard_return(result, "  ");',
  '',
  '',

""].join("\n");


var var_resp_raw = JSON.parse(lci_remote_req("variant-server", variant_req));
var var_resp = JSON.parse(var_resp_raw["variant-server"][0]);
lci_return(var_resp);

var uniq_tileid = {};
for (var idx=0; idx< var_resp.tile_info.length; idx++) {
  uniq_tileid[ var_resp.tile_info[idx].tileID ] = var_resp.tile_info[idx];
}

var uniq_tileid_str = JSON.stringify(uniq_tileid);
lci_return(uniq_tileid);


var tilepath_i = var_resp.tile_info[0].tilepath;
var tilestep_i = var_resp.tile_info[0].tilestep;

var tilepath_hex = hexstr(tilepath_i, 4);

// Get the small band for the dataset in question (just one
// tile)
//
var cgf_req = "var idx = cgf_info['id']['" + dataset_id + "'];\n" +
"var tilepath = " + tilepath_i + ";\n" +
"var tile_begstep = " + tilestep_i + ";\n" +
"var tile_nstep = 1;\n" +
"var x = muduk_tile_band(idx, tilepath, tile_begstep, tile_nstep);\n" +
"muduk_return(x);";

var cgf_s = JSON.parse(lci_remote_req("cgf-server", cgf_req));
var resp_json = JSON.parse(cgf_s["cgf-server"][0]);
lci_return(resp_json);

var matched_variant = {};

var allele = resp_json[tilepath_hex].allele;
for (var aa=0; aa<allele.length; aa++) {
  var tileid_str = tilepath_hex + "." + "00" + "." + hexstr(tilestep_i, 4) + "." + hexstr(allele[aa][0], 3);

  if (tileid_str in uniq_tileid) {
    matched_variant[tileid_str] = uniq_tileid[tileid_str];
  }
}

lci_return(matched_variant);

// Lookup the tile sequence from the tile library
//
var matched_variant_str = JSON.stringify(matched_variant);
var tilelib_req = [

  'var in_data = ' + matched_variant_str + ';',
  'var seq = [];',
  'var result = {};',
  '',
  'for (var tileid_str in in_data) {',
  '  var x = in_data[tileid_str];',
  '  var tseq = tilesequence( x.tilepath, x.tileversion, x.tilestep, x.tilevariant );',
  '  result[tileid_str] = {"seq":tseq, "tileID":tileid_str, "chrom":x.refChrom, "refStart":parseInt(x.refStart), "refLen":parseInt(x.refLen), "refName":x.refName};',
  '}',
  '',
  'glfd_return(result);',

""].join("\n");

lci_return({"ok":tilelib_req});

var tile_s = JSON.parse(lci_remote_req("tile-server", tilelib_req));
var res_s = tile_s["tile-server"][0];
var res_json = JSON.parse(res_s);

for (var key in res_json) {
  res_json[key].human_id = huid;
  res_json[key].dataset_id = dataset_id;
  res_json[key].rsid = rsid;
}

// Finally, we get to see the sequence.
// To sum up, this is the sequence for the participant that has blood
// type AB+ and has had some type of sleep paralysis with the above RSID
// from ClinVar.
//
lci_return(res_json, "  ");
