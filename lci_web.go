package main

import "fmt"
import "io"
import "net/http"
import "io/ioutil"

import "strconv"

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

func (lci *LCID) StartSrv() error {
  http.HandleFunc("/", lci.WebDefault)
  http.HandleFunc("/exec", lci.WebExec)
  http.HandleFunc("/about", lci.WebAbout)
  http.HandleFunc("/i", lci.WebInteractive)

  port_str := fmt.Sprintf("%d", lci.Port)

  e := http.ListenAndServe(":" + port_str, nil)
  return e
}

