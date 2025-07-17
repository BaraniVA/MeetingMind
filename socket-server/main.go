package main

import (
    "fmt"
    "net/http"
    "log"
	"meetingmind-socket/ws"
) 

func main() {
    http.HandleFunc("/ws", ws.HandleWS)
    fmt.Println("WebSocket server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

