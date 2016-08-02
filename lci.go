package main

import "os"
import "fmt"
import "log"
import "io/ioutil"

import "github.com/abeconnelly/sloppyjson"

const LCI_VERSION string = "0.1.0"

type LCID struct {
  ServerList map[string][]string
  Port int
  HTMLDir string
  JSDir string
  StaticDir string
}

func (lci *LCID) LoadConfig(config_fn string) error {
  config_s,e := ioutil.ReadFile(config_fn)
  if e!=nil { return e ;}

  config_json,e := sloppyjson.Loads(string(config_s))
  if e!=nil { return e; }

  lci.ServerList = make(map[string][]string)
  lci.Port = int(config_json.O["port"].P)
  lci.HTMLDir = config_json.O["html-dir"].S
  lci.JSDir = config_json.O["js-dir"].S
  lci.StaticDir = config_json.O["static-dir"].S

  key_list := []string{ "tile-server", "cgf-server", "variant-server", "phenotype-server" }
  for idx:=0 ; idx<len(key_list); idx++ {
    key := key_list[idx]
    for i:=0; i<len(config_json.O[key].L) ; i++ {
      lci.ServerList[key] = append(lci.ServerList[key], config_json.O[key].L[i].S)
    }
  }

  return nil
}

func main() {

  config_fn := "./lci-config.json"
  if len(os.Args) > 1 {
    config_fn = os.Args[1]
  }

  lci := LCID{}

  e := lci.LoadConfig(config_fn)
  if e!=nil { log.Fatal(e) }

  for k,v := range lci.ServerList {
    fmt.Printf("%s:", k)
    for idx:=0; idx<len(v); idx++ { fmt.Printf(" %s", v[idx]) }
    fmt.Printf("\n")
  }

  e = lci.StartSrv()
  if e!=nil { log.Fatal(e) }

  fmt.Printf("done\n")
}
