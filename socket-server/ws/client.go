package ws

import (
    "github.com/gorilla/websocket"
	"fmt"
)

type Client struct {
	Conn *websocket.Conn
	Text  chan []byte
	AssemblyConn  *websocket.Conn
}



func RegisterClient(client *Client) {

    go client.readAudio()
    go client.writeText()

}

func (c *Client) readAudio() {
    defer func() {
        UnregisterClient(c)
    }()

    for {
        msgType, audio, err := c.Conn.ReadMessage()
        if err != nil {
			fmt.Println("err read message :", err)
            break
        }
		if msgType != websocket.BinaryMessage {
			fmt.Println("this is not a binary file")
			continue
		}

		err = c.AssemblyConn.WriteMessage(websocket.BinaryMessage, audio)
		if err != nil {
			fmt.Println("err when sending audio to assembly")
			continue
		}

    }
}

func (c *Client) writeText() {
	for{
        msgType, msg, err := c.AssemblyConn.ReadMessage()
        if err != nil {
			continue
        }
		if msgType != websocket.TextMessage {
			fmt.Println("from assembly, this is not a text message")
			continue
		}
        if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			fmt.Println("err write message :", err)
            break
        }
    }
}


func UnregisterClient(c *Client) {
    c.Conn.Close()
    close(c.Text)
	c.AssemblyConn.Close()
}
