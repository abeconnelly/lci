print = ((typeof(print)==="undefined") ? console.log : print);

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
