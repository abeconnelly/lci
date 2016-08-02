package main

import "fmt"
import "bytes"
//import "bufio"
import "strings"
import "io/ioutil"

import "net/http"
import "strconv"

import "github.com/robertkrimen/otto"

//import "github.com/abeconnelly/sloppyjson"


func (lci *LCID) remote_req_otto(call otto.FunctionCall) otto.Value {
  local_debug := true

  otto_err,err := otto.ToValue("error")
  if err!=nil { return otto.Value{} }

  remote_srv := call.Argument(0).String()
  req_str := call.Argument(1).String()

  var url_list []string
  var ok bool

  if local_debug {
    fmt.Printf("remote_srv: %s\n", remote_srv)

    for k,v := range lci.ServerList {
      fmt.Printf("%v %v\n", k, v)
    }
  }

  if url_list,ok = lci.ServerList[remote_srv] ; !ok {

    fmt.Printf("(1)\n")

    return otto_err
  }

  resp_a := []string{}

  for i:=0; i<len(url_list); i++ {
    url := url_list[i]

    req,err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(req_str)))
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")

    cli := &http.Client{}
    resp,err := cli.Do(req)
    if err!=nil {

      fmt.Printf("(2)\n")

      return otto_err
    }

    defer resp.Body.Close()

    if local_debug {
      fmt.Printf("%s>>>\n%s\n---\n", remote_srv, req_str)
      fmt.Printf("  status: %s\n", resp.Status)
      fmt.Printf("  header: %s\n", resp.Header)
    }

    body,_ := ioutil.ReadAll(resp.Body)

    if local_debug {
      fmt.Printf("  got:\n---\n%s\n---\n", string(body))
    }

    resp_a = append(resp_a, url)
    resp_a = append(resp_a, string(body))
  }

  json_str_resp_a := []string{}
  json_str_resp_a = append(json_str_resp_a, "{")
  json_str_resp_a = append(json_str_resp_a, strconv.Quote(remote_srv) + ":[")
  for i:=0; i<len(resp_a); i+=2 {
    if i>0 { json_str_resp_a = append(json_str_resp_a, ",") }
    //json_str_resp_a = append(json_str_resp_a, strconv.Quote(resp_a[i]) + ":")
    json_str_resp_a = append(json_str_resp_a, strconv.Quote(resp_a[i+1]))
  }
  json_str_resp_a = append(json_str_resp_a, "]}")


  json_str_resp := strings.Join(json_str_resp_a, "")
  v,e := otto.ToValue(json_str_resp)
  if e!=nil {

    fmt.Printf("(3)\n")

    return otto_err
  }

  return v
}


func (lci *LCID) status_otto(call otto.FunctionCall) otto.Value {
  v,e := otto.ToValue("ok status")
  if e!=nil { return otto.Value{} }
  return v
}

func (lci *LCID) JSVMRun(src string) (rstr string, e error) {
  local_debug := true
  js_vm := otto.New()

  if local_debug { fmt.Printf("JSVM_run:\n\n") }

  // Script environment
  //
  init_js,err := ioutil.ReadFile( lci.JSDir + "/init.js")
  if err!=nil { e = err; return }
  js_vm.Run(init_js)

  // Bridge functions
  //
  js_vm.Set("status", lci.status_otto)
  js_vm.Set("lci_remote_req", lci.remote_req_otto)

  v,err := js_vm.Run(src)
  if err!=nil {
    e = err
    return
  }

  rstr,e = v.ToString()
  return
}
