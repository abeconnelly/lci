package main

import "fmt"
//import "bytes"
//import "bufio"
//import "strings"
import "io/ioutil"
import "github.com/robertkrimen/otto"

//import "github.com/abeconnelly/sloppyjson"

func status_otto(call otto.FunctionCall) otto.Value {
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
  init_js,err := ioutil.ReadFile("js/init.js")
  if err!=nil { e = err; return }
  js_vm.Run(init_js)

  // Bridge functions
  //
  js_vm.Set("status", status_otto)

  v,err := js_vm.Run(src)
  if err!=nil {
    e = err
    return
  }

  rstr,e = v.ToString()
  return
}



