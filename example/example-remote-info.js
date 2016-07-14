var resp = {}

var cgf_s = JSON.parse(lci_remote_req("cgf-server", "muduk_return(muduk_info());"));
resp["cgf-server"] = JSON.parse(cgf_s["cgf-server"][0]);

var glf_s = JSON.parse(lci_remote_req("tile-server", "glfd_return(info());"));
resp["tile-server"] = JSON.parse(glf_s["tile-server"][0]);

var p7e_s = JSON.parse(lci_remote_req("phenotype-server", "pheno_return(pheno_status());"));
resp["phenotype-server"] = JSON.parse(p7e_s["phenotype-server"][0]);

var v5t_s = JSON.parse(lci_remote_req("variant-server", "vard_return(status());"));
resp["variant-server"] = JSON.parse(v5t_s["variant-server"][0]);

lci_return(resp, "  ");
