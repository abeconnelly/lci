var cgf_s = JSON.parse(lci_remote_req("cgf-server", "muduk_return(cgf_info, '  ');"));
var resp = JSON.parse(cgf_s["cgf-server"][0]);

lci_return(resp, "  ");
