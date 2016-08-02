
var L7G_PORT = "8085";
var L7G_URL = "http://localhost:" + L7G_PORT;

function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\//g, '&#x2F;');
}

function htmlUnescape(str){
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function l7g_query(api_str) {
  parts = api_str.split("/");
  console.log(parts);

  if (parts.length==0) { return; }

  if      (parts[0]=="status") { send_status(); }
  else if (parts[0]=="tile-library") {
    if (parts.length==1) { }
    else if (parts.length==2) {
      if (parts[1] == "tag-sets") { send_tag_sets(); }
    }
    else if (parts.length==3) {
      if (parts[1] == "tag-sets") {
        var tagsetid = parts[2];
        send_tag_sets_id(tagsetid);

      }
    }
    else if (parts.length==4) {
      if (parts[1] == "tag-sets") {
        var tagsetid = parts[2];
        if (parts[3] == "paths") {
          api_paths(tagsetid);
        }
        else if (parts[3] == "tile-positions") {
          api_tile_pos(tagsetid);
        }
        else if (parts[4] == "tile-variants") {
          api_tile_var(tagsetid);
        }
      }
    }
    else if (parts.length==5) {
      if (parts[1] == "tag-sets") {
        var tagsetid = parts[2];
        if (parts[3]=="paths") {
          var tilepath = parts[4];
          api_paths(tagsetid, tilepath);
        }
        else if (parts[3] == "tile-positions") {
          var tilepos = parts[4];
          api_tile_pos(tagsetid, tilepos);
        }
        else if (parts[3] == "tile-variants") {
          var tilevar = parts[4];
          api_tile_var(tagsetid, tilevar);
        }
      }
    }
    else if (parts.length==6) {
      if (parts[1] == "tag-sets") {
        var tagsetid = parts[2];
        if (parts[3] == "tile-positions") {
          var tilepos = parts[4];
          if (parts[5] == "locus") {
            api_locus(tagsetid, tilepos);
          }
        }
      }
    }
  }
  else if (parts[0]=="callsets") {
    if (parts.length==1) { send_callsets(); }
    else if (parts.length==2) { send_callsets_id(parts[1]); }

  }

}

function send_get_request(api_route, cb, cb_err) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4) {
     if (xmlhttp.status == 200) {
       cb(xmlhttp.responseText);
      } else {
        if (typeof cb_err !== "undefined") {
          cb_err(xmlhttp);
        }
      }

    }
  };
  xmlhttp.open("GET", api_route, true);
  xmlhttp.send(null);
}

function send_status() {
  console.log("send_status:");
  send_get_request(L7G_URL + "/status", function(data) {
    var x = document.getElementById("api-response");
    //x.innerHTML = "<pre>" + htmlEscape(data) + "</pre>";
    x.innerHTML = '<div class="well"><h5>Response</h5><br><pre>' + htmlEscape(data) + '</pre></div>';
    console.log("status: ", data);
  });
}

function send_callsets() {
  console.log("send_callsets:");
  send_get_request(L7G_URL + "/callsets", function(data) {
    var x = document.getElementById("api-response");
    x.innerHTML = '<div class="well"><h5>Response</h5><br><pre>' + htmlEscape(data) + '</pre></div>';
    console.log("status: ", data);
  });
}

function default_query_success(data) {
  var x = document.getElementById("api-response");
  x.innerHTML = '<div class="well"><h5>Response</h5><br><pre>' + htmlEscape(data) + '</pre></div>';
  console.log("status: ", data);
}


// ------------
// ------------
// tile-library
// ------------
// ------------

function send_tag_sets() {
  send_get_request(L7G_URL + "/tile-library/tag-sets", default_query_success);
}

function send_tag_sets_id(id) {
  send_get_request(L7G_URL + "/tile-library/tag-sets/" + id, default_query_success);
}

function api_paths(tagsetid, pathid) {

  console.log(">>api_paths: ", tagsetid, pathid);

  if (typeof pathid === "undefined") {
    send_get_request(L7G_URL + "/tile-library/tag-sets/" + tagsetid + "/paths", default_query_success);
    return;
  }
  send_get_request(L7G_URL + "/tile-library/tag-sets/" + tagsetid + "/paths/" + pathid, default_query_success);
}

function api_tile_pos(tagsetid, tilepos) {
  if (typeof tilepos === "undefined") {
    send_get_request(L7G_URL + "/tile-library/tag-sets/" + tagsetid + "/tile-positions", default_query_success);
    return;
  }
  send_get_request(L7G_URL + "/tile-library/tag-sets/" + tagsetid + "/tile-positions/" + tilepos, default_query_success);
}

function api_tile_var(tagsetid, tilevar) {
  if (typeof tilevar === "undefined") {
    send_get_request(L7G_URL + "/tile-library/tag-sets/" + tagsetid + "/tile-variants", default_query_success);
    return;
  }
  send_get_request(L7G_URL + "/tile-library/tag-sets/" + tagsetid + "/tile-variants/" + tilevar, default_query_success);
}

function api_locus(tagsetid, tilevar) {
  send_get_request(L7G_URL + "/tile-library/tag-sets/" + tagsetid + "/tile-variants/" + tilevar + "/locus", default_query_success);
}

//---

function tile_path_change() {
  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-paths-tilepathid";

  var t = $("#tile-library-tag-sets-tagsetid-paths-tilepathid-text");
  var tilepath = t.val();

  var q = $("#" + base_id + "-query");
  q.val(L7G_URL + "/tile-library/tag-sets/" + tilever + "/paths/" + tilepath );

  var p = $("#" + base_id + "-pre");
  p.html(" curl $LIGHTNING_HOST/tile-library/tag-sets/" + tilever + "/paths/" + tilepath);

}

function tile_path_query() {
  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-paths-tilepathid";

  var q = $("#" + base_id + "-query");
  var x = q.val();

  send_get_request(x, default_query_success);
}

//---

function tile_pos_change() {

  console.log("tile_pos_change>>>");

  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-tile-positions-tilepos";

  var t = $("#" + base_id + "-text");
  var tilepath = t.val();

  var q = $("#" + base_id + "-query");
  var x = q.val();
  q.val(L7G_URL + "/tile-library/tag-sets/" + tilever + "/tile-positions/" + tilepath );

  var p = $("#" + base_id + "-pre");
  p.html(" curl $LIGHTNING_HOST/tile-library/tag-sets/" + tilever + "/tile-positions/" + tilepath);

  var x = $("#" + base_id + "-id");
  x.val(tilepath)

}

function tile_pos_query() {
  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-tile-positions-tilepos";

  var q = $("#" + base_id + "-query");
  var x = q.val();

  send_get_request(x, default_query_success);
}

//---

function tile_pos_locus_change() {

  console.log("tile_pos_locus_change>>>");

  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-tile-positions-tilepos-locus";

  var t = $("#" + base_id + "-text");
  var tilepath = t.val();

  console.log("  ", tilepath);

  var q = $("#" + base_id + "-query");
  q.val(L7G_URL + "/tile-library/tag-sets/" + tilever + "/tile-positions/" + tilepath + "/locus");

  var p = $("#" + base_id + "-pre");
  p.html(" curl $LIGHTNING_HOST/tile-library/tag-sets/" + tilever + "/tile-positions/" + tilepath + "/locus");

  var x = $("#" + base_id + "-id");
  x.val(tilepath);

  console.log("locus change", q.val(), x.val());

}

function tile_pos_locus_query() {
  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-tile-positions-tilepos-locus";

  var q = $("#" + base_id + "-query");
  var x = q.val();

  console.log("locus query", base_id, x);

  send_get_request(x, default_query_success);
}


//---

function tile_var_change() {

  console.log("tile_var_change>>>");

  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-tile-variants-tilevar";

  var t = $("#" + base_id + "-text");
  var tilepath = t.val();

  console.log("  ", tilepath);

  var q = $("#" + base_id + "-query");
  q.val(L7G_URL + "/tile-library/tag-sets/" + tilever + "/tile-positions/" + tilepath + "/locus");

  var p = $("#" + base_id + "-pre");
  p.html(" curl $LIGHTNING_HOST/tile-library/tag-sets/" + tilever + "/tile-positions/" + tilepath + "/locus");

  var x = $("#" + base_id + "-id");
  x.val(tilepath);

  console.log("tile var change", q.val(), x.val());

}

function tile_var_query() {
  var tilever = "0000";
  var base_id = "tile-library-tag-sets-tagsetid-tile-variants-tilevar";

  var q = $("#" + base_id + "-query");
  var x = q.val();

  console.log("tile var query", base_id, x);

  send_get_request(x, default_query_success);
}



// --------
// --------
// callsets
// --------
// --------

function callsets_callsetid_query() {
  var q = $("#callsets-callsetid-query");
  console.log(">>>>", q.val());

  send_get_request(q.val(), default_query_success);
}

function callsets_callsetid_gvcf_header_query() {
  var q = $("#callsets-callsetid-gvcf-header-query");
  console.log(">>>>", q.val());

  send_get_request(q.val(), default_query_success);
}

function callsets_callsetid_gvcf_query() {
  var q = $("#callsets-callsetid-gvcf-query");
  console.log(">>>>", q.val());

  send_get_request(q.val(), default_query_success);
}

function callsets_callsetid_tile_variants_query() {
  var q = $("#callsets-callsetid-tile-variants-query");
  console.log(">>>>", q.val());

  send_get_request(q.val(), default_query_success);
}

function send_callsets_id(callsetid) {
  console.log("send_callsets_id:");
  send_get_request(L7G_URL + "/callsets/" + callsetid, function(data) {
    var x = document.getElementById("api-response");
    x.innerHTML = '<div class="well"><h5>Response</h5><br><pre>' + htmlEscape(data) + '</pre></div>';
    console.log("status: ", data);
  });
}

function callsets_callsetid_tilevariant_tilepos_change() {
  var base_id = "callsets-callsetid-tile-variants";

  var t = $("#callsets-callsetid-tile-variants-tilepos-text");
  var tilepos = t.val();

  var csi = $("#callsets-callsetid-tile-variants-id");
  var callsetid = csi.val();

  console.log(">>>", callsetid, tilepos);

  var q = $("#" + base_id + "-query");
  var x = q.val();
  q.val(L7G_URL + "/callsets/" + callsetid + "/tile-variants?tile-positions=" + tilepos );

  var p = $("#" + base_id + "-pre");
  p.html(" curl $LIGHTNING_HOST/callsets/" + callsetid + "/tile-variants?tile-positions=" + tilepos );

}

function callsets_callsetid_dd(callsetid) {

  var ids = ["callsets-callsetid", "callsets-callsetid-gvcf-header", "callsets-callsetid-gvcf", "callsets-callsetid-tile-variants"];
  var api_str = ["", "/gvcf-header", "/gvcf", "/tile-variants" ];

  for (var idx=0; idx<ids.length; idx++) {
    var d = $("#" + ids[idx] + "-dropdown");
    d.html(callsetid + " <span class='caret'></span>");

    var q = $("#" + ids[idx] + "-query");
    q.val(L7G_URL + "/callsets/" + callsetid + api_str[idx] );

    var p = $("#" + ids[idx] + "-pre");
    p.html(" curl $LIGHTNING_HOST/callsets/" + callsetid + api_str[idx] );

    var x = $("#" + ids[idx] + "-id");
    x.val(callsetid);
  }

  callsets_callsetid_tilevariant_tilepos_change();
}


//-----

function init_api_frontend() {

  send_get_request(L7G_URL + "/callsets", function(data) {
    var x = JSON.parse(data);
    var dd = $("#callsets-callsetid-dropdown-ul");
    var dd_gvcf_h = $("#callsets-callsetid-dropdown-gvcf-header-ul");
    var dd_gvcf = $("#callsets-callsetid-dropdown-gvcf-ul");
    var dd_tv = $("#callsets-callsetid-dropdown-tile-variants-ul");
    dd.empty();
    for (var i=0; i<x.length; i++) {
      if (i==0) { callsets_callsetid_dd(x[i]); }
      dd.append("<li><a href='#' onclick='callsets_callsetid_dd(\""+ x[i] + "\");'>" + x[i] + "</a></li>");
      dd_gvcf_h.append("<li><a href='#' onclick='callsets_callsetid_dd(\""+ x[i] + "\");'>" + x[i] + "</a></li>");
      dd_gvcf.append("<li><a href='#' onclick='callsets_callsetid_dd(\""+ x[i] + "\");'>" + x[i] + "</a></li>");
      dd_tv.append("<li><a href='#' onclick='callsets_callsetid_dd(\""+ x[i] + "\");'>" + x[i] + "</a></li>");
    }
  });

  // update hiddne html elements (query, id).
  //
  tile_path_change();
  tile_pos_change();
  tile_var_change();
  callsets_callsetid_tilevariant_tilepos_change();


}
