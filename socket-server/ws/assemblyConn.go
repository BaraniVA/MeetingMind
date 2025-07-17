package ws

import (
	"net/http"
	"github.com/gorilla/websocket"
)

func ConnectToAssemblyAI(apiKey string) (*websocket.Conn, *http.Response, error) {
	url := "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000"
	headers := http.Header{}
	headers.Add("Authorization", apiKey)

	conn, resp, err := websocket.DefaultDialer.Dial(url, headers)
	return conn, resp, err
}

