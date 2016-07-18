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
  fmt.Fprintf(w, "tile library tag sets paths tilepositions ... %v\n", ps.ByName("tilepos"))
  tilepos_str := ps.ByName("tilepos")
  api_str := fmt.Sprintf("api_tileposition_info(\"%s\");", tilepos_str)
  lci.WebJSExec(w,r,api_str)
}

func (lci *LCID) TileLibraryTagSetsTilePositionsTilePositionLocus(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  //fmt.Fprintf(w, "tile library tag sets paths tilepositions %v\n", ps.ByName("tilepos"))
  fmt.Fprintf(w, "tile library tag sets paths tilepositions ... %v\n", ps.ByName("tilepos"))
  tilepos_str := ps.ByName("tilepos")
  api_str := fmt.Sprintf("api_tileposition_locus(\"%s\");", tilepos_str)
  lci.WebJSExec(w,r,api_str)
}

//---------------------------



//---------------------------

func (lci *LCID) StartSrv() error {
  return lci.StartSrvRouter()
}

func (lci *LCID) StartSrvRouter() error {
  router := httprouter.New()

  //http.Handle("/static/",  http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

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

  /*
  router.GET("/tile-library/tag-sets/:tagset/tile-variants", )
  router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar", )
  router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar/locus", )
  router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar/subsequence", )
  router.GET("/tile-library/tag-sets/:tagset/tile-variants/:tilevar/annotations", )

  router.GET("/annotiles", )
  router.GET("/annotiles/:annotationid", )

  router.GET("/callsets", )
  router.GET("/callsets/:callset", )
  router.GET("/callsets/:callset/gvcf-header", )
  router.GET("/callsets/:callset/gvcf", )
  router.GET("/callsets/:callset/vcf-header", )
  router.GET("/callsets/:callset/vcf", )
  router.GET("/callsets/:callset/tile-variants", )

  router.GET("/assemblies", )
  router.GET("/assemblies/:assembly", )

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

