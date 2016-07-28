package main

import "fmt"
import "io"
import "net/http"
import "io/ioutil"

import "strconv"

//import "github.com/gorilla/mux"
import "github.com/julienschmidt/httprouter"

func (lci *LCID) WebDefault(w http.ResponseWriter, req *http.Request) {
  body,err := ioutil.ReadAll(req.Body)
  if err != nil { io.WriteString(w, `{"value":"error"}`); return }

  url := req.URL
  fmt.Printf("default:\n")
  fmt.Printf("  method: %s\n", req.Method)
  fmt.Printf("  proto:  %s\n", req.Proto)
  fmt.Printf("  scheme: %s\n", url.Scheme)
  fmt.Printf("  host:   %s\n", url.Host)
  fmt.Printf("  path:   %s\n", url.Path)
  fmt.Printf("  frag:   %s\n", url.Fragment)
  fmt.Printf("  body:   %s\n\n", body)

  io.WriteString(w, `{"value":"ok"}`)
}

func (lci *LCID) WebAbout(w http.ResponseWriter, req *http.Request) {
  str,e := ioutil.ReadFile("html/about.html")
  if e!=nil { io.WriteString(w, "error") ; return }
  io.WriteString(w, string(str))
}

func (lci *LCID) WebInteractive(w http.ResponseWriter, req *http.Request) {
  str,e := ioutil.ReadFile("html/index.html")
  if e!=nil { io.WriteString(w, "error") ; return }
  io.WriteString(w, string(str))
}

func (lci *LCID) WebInteractiveRouter(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
  lci.WebInteractive(w, req)
}

func (lci *LCID) WebJSExec(w http.ResponseWriter, req *http.Request, str_req string) {
  rstr,e := lci.JSVMRun(str_req)
  if e!=nil {
    rerr := strconv.Quote(fmt.Sprintf("%v", e))
    io.WriteString(w, `{"value":"error","error":` + rerr + `}`)
    return
  }

  fmt.Printf("got: %s\n", rstr)

  io.WriteString(w, rstr)
}

func (lci *LCID) WebExec(w http.ResponseWriter, req *http.Request) {
  body,err := ioutil.ReadAll(req.Body)
  if err != nil { io.WriteString(w, `{"value":"error"}`); return }

  fmt.Printf("webexec got>>>\n%s\n\n", body)

  rstr,e := lci.JSVMRun(string(body))
  if e!=nil {
    rerr := strconv.Quote(fmt.Sprintf("%v", e))
    io.WriteString(w, `{"value":"error","error":` + rerr + `}`)
    return
  }

  fmt.Printf("got: %s\n", rstr)

  io.WriteString(w, rstr)
}

func (lci *LCID) WebExecRouter(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
  lci.WebExec(w,req)
}

//---------------------------

func (lci *LCID) Status(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
  fmt.Fprintf(w, `{"api-version":"%x.%x.%x"}`, 0,1,0)
}

func (lci *LCID) TileLibraryTagSets(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
  fmt.Fprintf(w, `["%s"]`, "")
}

func (lci *LCID) TileLibraryTagSetsId(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  fmt.Fprintf(w, `{"tag-set-identifier":"%s","tag-set-integer":%d}`, ps.ByName("tagset"), 0)
}

func (lci *LCID) TileLibraryTagSetsPaths(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  lci.WebJSExec(w,r,"api_tilepaths();")
}

func (lci *LCID) TileLibraryTagSetsPathsTilePath(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  tilepath_str := ps.ByName("tilepath")
  tilepath,e := strconv.ParseInt(tilepath_str, 16, 64)
  if e!=nil { fmt.Fprintf(w, "error") ; return }
  api_str := fmt.Sprintf("api_tilepath(%d);", int(tilepath))
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) TileLibraryTagSetsTilePositions(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  lci.WebJSExec(w,r,"api_tilepositions();")
}

func (lci *LCID) TileLibraryTagSetsTilePositionsTilePosition(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  //fmt.Fprintf(w, "tile library tag sets paths tilepositions ... %v\n", ps.ByName("tilepos"))
  tilepos_str := ps.ByName("tilepos")
  api_str := fmt.Sprintf("api_tileposition_info(%s);", strconv.Quote(tilepos_str))
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) TileLibraryTagSetsTilePositionsTilePositionLocus(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  //fmt.Fprintf(w, "tile library tag sets paths tilepositions %v\n", ps.ByName("tilepos"))
  //fmt.Fprintf(w, "tile library tag sets paths tilepositions ... %v\n", ps.ByName("tilepos"))
  tilepos_str := ps.ByName("tilepos")
  api_str := fmt.Sprintf("api_tileposition_locus(%s);", strconv.Quote(tilepos_str))
  lci.WebJSExec(w,r,api_str)
}

//---------------------------

func (lci *LCID) TileLibraryTagSetsTileVariants(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  tilevar_str := ps.ByName("tilevar")
  assembly_name := ps.ByName("assembly-name")
  assembly_pdh := ps.ByName("assembly-pdh")

  fmt.Fprintf(w, "tile library tag sets tilevariants tilvariantid ... %v %v (%v,%v)\n", ps.ByName("tagset"), ps.ByName("tilevar"), assembly_name, assembly_pdh)

  //api_str := fmt.Sprintf("api_tilevariant_id(%s, %s, %s);", strconv.Quote(assembly_name), strconv.Quote(assembly_pdh), strconv.Quote(tilevar_str))
  api_str := fmt.Sprintf("api_tilevariant_id(%s, %s);", strconv.Quote(assembly_pdh), strconv.Quote(tilevar_str))
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) TileLibraryTagSetsTileVariantsLocus(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

  tilevar_str := ps.ByName("tilevar")
  assembly_name := r.FormValue("assembly-name"); _ = assembly_name
  assembly_pdh := r.FormValue("assembly-pdh")

  fmt.Fprintf(w, "tile library tag sets tilevariants locus ... %v %v %v\n", tilevar_str, assembly_name, assembly_pdh);

  api_str := fmt.Sprintf("api_tilevariant_locus(%s,%s);", strconv.Quote(assembly_pdh), strconv.Quote(tilevar_str))
  lci.WebJSExec(w,r,api_str)
}

// This makes no sense, not implemented

/*
func (lci *LCID) TileLibraryTagSetsTileVariantsSubsequence(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

  fmt.Printf(">>>>>>>>>>>>>>>>>>>>>>>>>> %v\n", ps)

  fmt.Fprintf(w, "tile library tag sets tilevariants tilvariantid ... %v %v\n", ps.ByName("tagset"), ps.ByName("tilevar"))
  tilevar_str := ps.ByName("tilevar")
  api_str := fmt.Sprintf("api_tilevariant_subsequence(%s);", strconv.Quote(tilevar_str))
  lci.WebJSExec(w,r,api_str)
}
*/

//---------------------------

func (lci *LCID) Callsets(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  api_str := fmt.Sprintf("api_callsets();")
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) CallsetsId(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

  callset_name := ps.ByName("callset")

  api_str := fmt.Sprintf("api_callsets_id(%s);", strconv.Quote(callset_name))
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) CallsetsGVCFHeader(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

  callset_name := ps.ByName("callset") ; _ = callset_name
  assembly_name := r.FormValue("assembly-name"); _ = assembly_name
  assembly_pdh := r.FormValue("assembly-pdh") ; _ = assembly_pdh
  //gvcf_block := r.FormValue("gvcf-block") ; _ = gvcf_block

  header_str := fmt.Sprintf(` {
    "fileformat":"VCFc4.2",
    "source":"Lightningv%s",
    "assembly":%s,
    "info": [
      {
        "ID": "END",
        "Number":1,
        "Type":Integer,
        "Description":"Stop position of the interval"
      }
    ],
    "format": [
      {
        "ID": "GT",
        "Number":1,
        "Type":"String",
        "Description":"Genotype"
      }
    ],
    "alt": [
      {
        "ID": "NOT_REF",
        "Description":"Represents any possible alternative allele at this location"
      }
    ]
}`, LCI_VERSION, strconv.Quote(assembly_pdh))


  //api_str := fmt.Sprintf("api_callsets_gvcf_header(%s);", strconv.Quote(assembly_pdh))
  //lci.WebJSExec(w,r,api_str)
  fmt.Fprintf(w, header_str)
}

func (lci *LCID) CallsetsGVCF(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

  callset_name := ps.ByName("callset") ; _ = callset_name
  assembly_name := r.FormValue("assembly-name"); _ = assembly_name
  assembly_pdh := r.FormValue("assembly-pdh") ; _ = assembly_pdh
  //gvcf_block := r.FormValue("gvcf-block") ; _ = gvcf_block


  api_str := fmt.Sprintf("api_callsets_gvcf(%s)", strconv.Quote(assembly_pdh))
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) CallsetsTileVariants(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

  callset_name := ps.ByName("callset") ; _ = callset_name
  tile_positions := r.FormValue("tile-positions") ; _ = tile_positions

  api_str := fmt.Sprintf("api_callsets_tilevariants(%s,%s);", strconv.Quote(callset_name), strconv.Quote(tile_positions))
  lci.WebJSExec(w,r,api_str)
}

//---------------------------

func (lci *LCID) Assemblies(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  fmt.Fprintf(w, "assemblies")
  api_str := fmt.Sprintf("api_assemblies();")
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) AssembliesId(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  fmt.Fprintf(w, "assemblies id")
  api_str := fmt.Sprintf("api_assemblies_id();")
  lci.WebJSExec(w,r,api_str)
}



//---------------------------

func (lci *LCID) StartSrv() error {
  return lci.StartSrvRouter()
}

func (lci *LCID) StartSrvRouter() error {
  router := httprouter.New()

  //http.Handle("/static/",  http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))
  router.ServeFiles("/static/*filepath", http.Dir("./static"))

  //http.HandleFunc("/", lci.WebDefault)
  router.POST("/exec", lci.WebExecRouter)
  //http.HandleFunc("/about", lci.WebAbout)
  router.GET("/i", lci.WebInteractiveRouter)

  //router.GET("/", lci.WebDefault)

  router.GET("/", lci.Status)
  router.GET("/status", lci.Status)

  router.GET("/tile-library/tag-sets", lci.TileLibraryTagSets)
  router.GET("/tile-library/tag-sets/:tagset", lci.TileLibraryTagSetsId)

  router.GET("/tile-library/tag-sets/:tagset/paths", lci.TileLibraryTagSetsPaths)
  router.GET("/tile-library/tag-sets/:tagset/paths/:tilepath", lci.TileLibraryTagSetsPathsTilePath)

  router.GET("/tile-library/tag-sets/:tagset/tile-positions", lci.TileLibraryTagSetsTilePositions)
  router.GET("/tile-library/tag-sets/:tagset/tile-positions/:tilepos", lci.TileLibraryTagSetsTilePositionsTilePosition)
  router.GET("/tile-library/tag-sets/:tagset/tile-positions/:tilepos/locus", lci.TileLibraryTagSetsTilePositionsTilePositionLocus)

  //router.GET("/tile-library/tag-sets/:tagset/tile-variants", )
  router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar", lci.TileLibraryTagSetsTileVariants)
  router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar/locus", lci.TileLibraryTagSetsTileVariantsLocus)
  //router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar/subsequence", lci.TileLibraryTagSetsTileVariantsSubsequence)

  //router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar/annotations", )

  //router.GET("/annotiles", )
  //router.GET("/annotiles/:annotationid", )

  router.GET("/callsets", lci.Callsets)
  router.GET("/callsets/:callset", lci.CallsetsId )
  router.GET("/callsets/:callset/gvcf-header", lci.CallsetsGVCFHeader )
  router.GET("/callsets/:callset/gvcf", lci.CallsetsGVCF )
  router.GET("/callsets/:callset/vcf-header", lci.CallsetsGVCFHeader )
  router.GET("/callsets/:callset/vcf", lci.CallsetsGVCF )
  router.GET("/callsets/:callset/tile-variants", lci.CallsetsTileVariants )

  router.GET("/assemblies", lci.Assemblies)
  router.GET("/assemblies/:assembly", lci.AssembliesId)

  /*
  router.GET("/searches", )
  router.GET("/searches/help", )
  router.GET("/searches/:search", )

  router.POST("/searches", )
  */

  port_str := fmt.Sprintf("%d", lci.Port)
  e := http.ListenAndServe(":" + port_str, router)
  return e
}

func (lci *LCID) StartSrvSimple() error {
  //http.Handle("/", http.FileServer(http.Dir("./example")))
  http.Handle("/static/",  http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

  http.HandleFunc("/", lci.WebDefault)
  http.HandleFunc("/exec", lci.WebExec)
  http.HandleFunc("/about", lci.WebAbout)
  http.HandleFunc("/i", lci.WebInteractive)



  port_str := fmt.Sprintf("%d", lci.Port)

  e := http.ListenAndServe(":" + port_str, nil)
  return e
}

