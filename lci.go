package main

import "os"
import "fmt"
//import "io"
//import "net/http"
//import "io/ioutil"

//import "strconv"

import "github.com/abeconnelly/sloppyjson"

type LCID struct {
  ServerList map[string][]string
  Port int
}


/*
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

  io.WriteString(w, rstr)
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

func (lci *LCID) StartSrv() {
  http.HandleFunc("/", lci.WebDefault)
  http.HandleFunc("/exec", lci.WebExec)
  http.HandleFunc("/about", lci.WebAbout)
  http.HandleFunc("/i", lci.WebInteractive)
  http.ListenAndServe(fmt.Sprintf(":%d", lci.Port), nil)
}
*/


func main() {

  sample_config := `
  {
    "tile-server" : [ "http://localhost:8081/exec" ],
    "cgf-server" : [ "http://localhost:8082" ],
    "phenotype-server" : [ "http://localhost:8083/exec" ],
    "variant-server" : [ "http://localhost:8084/exec" ],
    "version" : "0.1.0"
  }
  `;

  config_json,e := sloppyjson.Loads(sample_config)
  if e!=nil {
    fmt.Printf("%v\n", e)
    os.Exit(1)
  }

  lci := LCID{}
  lci.ServerList = make(map[string][]string)
  lci.Port = 8085

  key_list := []string{ "tile-server", "cgf-server", "variant-server", "phenotype-server" }
  for idx:=0 ; idx<len(key_list); idx++ {
    key := key_list[idx]
    for i:=0; i<len(config_json.O[key].L) ; i++ {
      lci.ServerList[key] = append(lci.ServerList[key], config_json.O[key].L[i].S)
    }
  }

  for k,v := range lci.ServerList {
    fmt.Printf("%s:", k)
    for idx:=0; idx<len(v); idx++ { fmt.Printf(" %s", v[idx]) }
    fmt.Printf("\n")
  }

  //fmt.Printf(">> %v\n", config_json.O["tile-server"].L[0].S)

  e = lci.StartSrv()
  if e!=nil { panic(e) }

  fmt.Printf("done\n")

}
