package socket

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"real-time-forum/chat"
	"real-time-forum/comments"
	notification "real-time-forum/notifications"
	"real-time-forum/posts"
	"real-time-forum/users"

	"github.com/gorilla/websocket"
	"golang.org/x/crypto/bcrypt"
)

type T struct {
	TypeChecker
	*posts.Posts
	*comments.Comments
	*Register
	*Login
	*Logout
	*comments.CommentsFromPosts
	*chat.Chat
	*whosNotifications
	*deleteNotifications
	*TypingNotification
	*TypingNotificationEnd
	*TypingStatus
}


type TypeChecker struct {
	Type string `json:"type"`
}



type Register struct {
	Username  string `json:"username"`
	Age       string `json:"age"`
	Email     string `json:"email"`
	Gender    string `json:"gender"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Password  string `json:"password"`
	Team      string `json:"teamreg"`
	Tipo      string `json:"tipo"`
}

type Login struct {
	LoginUsername string `json:"loginUsername"`
	LoginPassword string `json:"loginPassword"`
	Tipo          string `json:"tipo"`
}

type Logout struct {
	LogoutUsername string `json:"logoutUsername"`
	Tipo           string `json:"tipo"`
	LogoutClicked  string `json:"logoutClicked"`
}

type formValidation struct {
	UsernameLength         bool             `json:"usernameLength"`
	UsernameSpace          bool             `json:"usernameSpace"`
	UsernameDuplicate      bool             `json:"usernameDuplicate"`
	EmailDuplicate         bool             `json:"emailDuplicate"`
	PasswordLength         bool             `json:"passwordLength"`
	AgeEmpty               bool             `json:"ageEmpty"`
	FirstNameEmpty         bool             `json:"firstnameEmpty"`
	LastNameEmpty          bool             `json:"lastnameEmpty"`
	EmailInvalid           bool             `json:"emailInvalid"`
	SuccessfulRegistration bool             `json:"successfulRegistration"`
	AllUserAfterNewReg     []users.AllUsers `json:"allUserAfterNewReg"`
	OnlineUsers            []string         `json:"onlineUsers"`
	Tipo                   string           `json:"tipo"`
}
type loginValidation struct {
	InvalidUsername    bool             `json:"invalidUsername"`
	InvalidPassword    bool             `json:"invalidPassword"`
	SuccessfulLogin    bool             `json:"successfulLogin"`
	SuccessfulUsername string           `json:"successfulusername"`
	Tipo               string           `json:"tipo"`
	SentPosts          []posts.Posts    `json:"dbposts"`
	AllUsers           []users.AllUsers `json:"allUsers"`
	OnlineUsers        []string         `json:"onlineUsers"`
	UsersWithChat      []chat.Chat      `json:"userswithchat"`
	PopUserCheck       string           `json:"popusercheck"`
}

type whosNotifications struct {
	Username string
}

type notificationsAtLogin struct {
	Notifications []notification.Notification `json:"notification"`
	Response      string                      `json:"response"`
	UserToDelete  string                      `json:"usertodelete"`
	Tipo          string                      `json:"tipo"`
}

type deleteNotifications struct {
	NotificationSender    string `json:"sender"`
	NotificationRecipient string `json:"recipient"`
}

type updateOnlineUsers struct {
	UpdatedOnlineUsers      []string       `json:"UpdatedOnlineUsers"`
	Tipo                    string         `json:"tipo"`
	GetLastUserFromDatabase users.AllUsers `json:"GetLastUserFromDatabase"`
}


type TypingNotification struct {
	TypingRecipient string `json:"typingrecipient"`
	TypingSender    string `json:"typingsender"`
}
type SendTypingNotification struct {
	TypingRecipient string `json:"typingRecipient"`
	TypingSender    string `json:"typingSender"`
	Tipo            string `json:"tipo"`
}
type TypingNotificationEnd struct {
	TypingEndRecipient string `json:"typingrecipient"`
	TypingEndSender    string `json:"typingsender"`
}
type SendTypingNotificationEnd struct {
	TypingEndRecipient string `json:"typingEndRecipient"`
	TypingEndSender    string `json:"typingEndSender"`
	Tipo               string `json:"tipo"`
}
type TypingStatus struct {
	TypingStatusRecipient string `json:"typingstatusrecipient"`
	TypingStatusSender    string `json:"typingstatussender"`
	Status                string `json:"status"`
}
type SendTypingStatus struct {
	SendTypingStatusRecipient string `json:"sendTypingStatusRecipient"`
	SendTypingStatusSender    string `json:"sendTypingStatusSender"`
	SendTypingStatus          string `json:"sendStatus"`
	Tipo                      string `json:"tipo"`
}


var (
	loggedInUsers         = make(map[string]*websocket.Conn)
	broadcastChannelPosts = make(chan posts.Posts, 1)

	broadcastChannelComments = make(chan comments.Comments, 1)
	currentUser              = ""
	CallWS                   = false
	online                   loginValidation
	broadcastOnlineUsers     = make(chan updateOnlineUsers, 1)
	notifyAtLogin            notificationsAtLogin
)

// unmarshall data based on type
func (t *T) UnmarshalForumData(data []byte) error {
	if err := json.Unmarshal(data, &t.TypeChecker); err != nil {
		log.Println("Error when trying to sort forum data type...")
	}

	switch t.Type {
	case "post":
		t.Posts = &posts.Posts{}
		return json.Unmarshal(data, t.Posts)
	case "comment":
		t.Comments = &comments.Comments{}
		return json.Unmarshal(data, t.Comments)
	case "signup":
		t.Register = &Register{}
		return json.Unmarshal(data, t.Register)
	case "login":
		t.Login = &Login{}
		return json.Unmarshal(data, t.Login)
	case "logout":
		t.Logout = &Logout{}
		return json.Unmarshal(data, t.Logout)
	case "getcommentsfrompost":
		t.CommentsFromPosts = &comments.CommentsFromPosts{}
		return json.Unmarshal(data, t.CommentsFromPosts)
	case "chatMessage":
		t.Chat = &chat.Chat{}
		return json.Unmarshal(data, t.Chat)

	case "requestChatHistory":
		t.Chat = &chat.Chat{}
		return json.Unmarshal(data, t.Chat)

	case "requestNotifications":
		t.whosNotifications = &whosNotifications{}
		return json.Unmarshal(data, t.whosNotifications)
	case "deletenotification":
		t.deleteNotifications = &deleteNotifications{}
		return json.Unmarshal(data, t.deleteNotifications)
	case "typingnotificationstart":
		t.TypingNotification = &TypingNotification{}
		return json.Unmarshal(data, t.TypingNotification)
	case "typingnotificationend":
		t.TypingNotificationEnd = &TypingNotificationEnd{}
		return json.Unmarshal(data, t.TypingNotificationEnd)
	case "typingStatus":
		t.TypingStatus = &TypingStatus{}
		return json.Unmarshal(data, t.TypingStatus)
	default:
		return fmt.Errorf("unrecognized type value %q", t.Type)
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func WebSocketEndpoint(w http.ResponseWriter, r *http.Request) {
	db, _ := sql.Open("sqlite3", "real-time-forum.db")

	go broadcastToAllClients()
	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("error when upgrading connection...")
	}
	fmt.Println("CONNECTION TO CLIENT")
	defer wsConn.Close()

	// if user logs into 2 clients, close first connection
	if _, ok := loggedInUsers[currentUser]; ok {
		loggedInUsers[currentUser].Close()
	}

	loggedInUsers[users.GetUserName(db, currentUser)] = wsConn

	fmt.Println("LOGGED IN USERS", loggedInUsers)

	online.Tipo = "onlineUsers"

	online.OnlineUsers = []string{}

	var currentOnlineUsers updateOnlineUsers
	for k := range loggedInUsers {
		if k == users.GetUserName(db, currentUser) {

			online.UsersWithChat = chat.GetLatestChat(db, chat.GetChat(db, k))
			online.PopUserCheck = currentUser
			online.OnlineUsers = append(online.OnlineUsers, k)
			online.AllUsers = users.GetAllUsers(db)
			loggedInUsers[k].WriteJSON(online)
		}

		currentOnlineUsers.UpdatedOnlineUsers = append(currentOnlineUsers.UpdatedOnlineUsers, k)
	}

	

	currentOnlineUsers.Tipo = "updatedOnlineUsers"
	getLastUser := users.GetAllUsers(db)[len(users.GetAllUsers(db))-1]
	currentOnlineUsers.GetLastUserFromDatabase = getLastUser
	broadcastOnlineUsers <- currentOnlineUsers

	var incomingData T
	for {
		message, info, _ := wsConn.ReadMessage()
		fmt.Println("----", string(info))

		// if a connection is closed, we return out of this loop
		if message == -1 {
			fmt.Println("connection closed")
			for username, socketConnection := range loggedInUsers {
				if wsConn == socketConnection {
					delete(loggedInUsers, username)
				}
			}
			fmt.Println("users left in array", loggedInUsers)
			online.OnlineUsers = []string{}
			currentOnlineUsers.UpdatedOnlineUsers = []string{}
			online.Tipo = "loggedOutUser"

			for k := range loggedInUsers {
				online.OnlineUsers = append(online.OnlineUsers, k)
				currentOnlineUsers.UpdatedOnlineUsers = append(currentOnlineUsers.UpdatedOnlineUsers, k)
			}

			broadcastOnlineUsers <- currentOnlineUsers

			// wsConn.WriteJSON(online)
			return
		}
		incomingData.UnmarshalForumData(info)

		if incomingData.Type == "post" {
			incomingData.Posts.Tipo = "post"

			posts.StorePosts(db, incomingData.Posts.Username, incomingData.Posts.PostTitle, incomingData.Posts.PostContent, incomingData.Posts.Categories)
			// posts.GetCommentData(db, 1)
			fmt.Println("this is the post title", incomingData.PostContent)

			// STORE POSTS IN DATABASE
			broadcastChannelPosts <- posts.SendLastPostInDatabase(db)
		} else if incomingData.Type == "comment" {

			// STORE COMMENTS IN THE DATABSE
			postID, _ := strconv.Atoi(incomingData.Comments.PostID)
			comments.StoreComment(db, incomingData.Comments.User, postID, incomingData.Comments.CommentContent)

			incomingData.Comments.Tipo = "comment"
			// wsConn.WriteJSON(comments.GetLastComment(db))
			broadcastChannelComments <- comments.GetLastComment(db)

			// broadcastChannelComments <- f.Comments
		} else if incomingData.Type == "getcommentsfrompost" {
			// Display all comments in a post to a single user.

			var commentsfromPost posts.Posts
			clickedPostID, _ := strconv.Atoi(incomingData.CommentsFromPosts.ClickedPostID)
			commentsfromPost.Tipo = "allComments"
			commentsfromPost.Comments = comments.DisplayAllComments(db, clickedPostID)

			fmt.Println("comments from post struct when unmarshalled", incomingData.CommentsFromPosts)
			incomingData.CommentsFromPosts.Tipo = "commentsfrompost"
			fmt.Println("all comments in this post", comments.DisplayAllComments(db, clickedPostID))
			wsConn.WriteJSON(commentsfromPost)
		} else if incomingData.Type == "logout" {
			incomingData.Logout.LogoutClicked = "true"
			fmt.Println("LOGOUT USERNAME", incomingData.Logout.LogoutUsername)
			wsConn.WriteJSON(incomingData.Logout)
		} else if incomingData.Type == "chatMessage" {
			if !chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).Exists {
				chat.StoreChat(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient)
			}
			fmt.Println("THIS IS THE CHAT ID", chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).ChatID)
			// then store messages using chat id
			chat.StoreMessages(db, chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).ChatID, incomingData.Chat.ChatMessage, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient)

			if !notification.CheckNotification(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient) {
				notification.AddFirstNotificationForUser(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient)

				
			} else {
				notification.IncrementNotifications(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient)
			}

			fmt.Println("THIS IS CHAT HISTORY --> ", chat.GetAllMessageHistoryFromChat(db, chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).ChatID))
			fmt.Println("From JS-->", incomingData.Chat.ChatMessage, incomingData.Chat.ChatSender)
			for user, connection := range loggedInUsers {
				if user == incomingData.Chat.ChatSender || user == incomingData.Chat.ChatRecipient {
					incomingData.Chat.Tipo = "lastMessage"
					

					incomingData.Chat.LastNotification = notification.SingleNotification(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient)
					incomingData.Chat.UsersWithChat = chat.GetLatestChat(db, chat.GetChat(db, currentUser))
					incomingData.Chat.AllUsers = users.GetAllUsers(db)
					connection.WriteJSON(incomingData.Chat)

					

				}
				//  check how many live notifications there are and send to recipient
			}

		} else if incomingData.Type == "requestChatHistory" {
			if notification.RemoveNotifications(db, incomingData.Chat.ChatRecipient, incomingData.Chat.ChatSender) {
				notifyAtLogin.Response = "Notification viewed and set to nil"
				notifyAtLogin.UserToDelete = incomingData.Chat.ChatRecipient
				loggedInUsers[incomingData.Chat.ChatSender].WriteJSON(notifyAtLogin)
			}

			fmt.Println("sender and recipient-------", incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient)
			if chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).Exists {
				
				wsConn.WriteJSON(chat.GetAllMessageHistoryFromChat(db, chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).ChatID))
			} else if !chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).Exists {

				wsConn.WriteJSON(chat.GetAllMessageHistoryFromChat(db, chat.ChatHistoryValidation(db, incomingData.Chat.ChatSender, incomingData.Chat.ChatRecipient).ChatID))

			}
		} else if incomingData.Type == "requestNotifications" {

			data := notification.NotificationQuery(db, incomingData.whosNotifications.Username)
			
			notifyAtLogin.Notifications = []notification.Notification{}
			for _, value := range data {
				if incomingData.whosNotifications.Username == value.NotificationRecipient {
					
					notifyAtLogin.Notifications = append(notifyAtLogin.Notifications, value)
					notifyAtLogin.Tipo = "clientnotifications"

				}
			}
			
			loggedInUsers[incomingData.whosNotifications.Username].WriteJSON(notifyAtLogin)

		} else if incomingData.Type == "deletenotification" {
			
			notification.RemoveNotifications(db, incomingData.deleteNotifications.NotificationSender, incomingData.deleteNotifications.NotificationRecipient)
		}		 else if incomingData.Type == "typingnotificationstart" {
			fmt.Println("Checking if typing notification is getting sent ---> ", incomingData.TypingNotification)
			var t SendTypingNotification
			t.Tipo = "typingNotification"
			t.TypingRecipient = incomingData.TypingRecipient
			t.TypingSender = incomingData.TypingSender
			for user, conn := range loggedInUsers {
				if user == incomingData.TypingNotification.TypingRecipient {
					conn.WriteJSON(t)
				}
			}
		} else if incomingData.Type == "typingnotificationend" {
			var t SendTypingNotificationEnd
			t.Tipo = "typingIsOver"
			t.TypingEndRecipient = incomingData.TypingEndRecipient
			t.TypingEndSender = incomingData.TypingEndSender
			for user, conn := range loggedInUsers {
				if user == incomingData.TypingNotificationEnd.TypingEndRecipient {
					conn.WriteJSON(t)
				}
			}
		} else if incomingData.Type == "typingStatus" {
			fmt.Println("recip check ----> ", incomingData.TypingStatusRecipient)
			fmt.Println("sender check ----> ", incomingData.TypingStatusSender)
			// send data for animation
			var t SendTypingStatus
			t.SendTypingStatusRecipient = incomingData.TypingStatus.TypingStatusRecipient
			t.SendTypingStatusSender = incomingData.TypingStatus.TypingStatusSender
			t.SendTypingStatus = incomingData.Status
			t.Tipo = "toAnimateOrNot"
			fmt.Println("checking struct for t ----> ", t)
			for user, conn := range loggedInUsers {
				if user == incomingData.TypingStatusRecipient {
					conn.WriteJSON(t)
				}
			}
		}

		
	}
}

func broadcastToAllClients() {
	for {
		select {
		case post, ok := <-broadcastChannelPosts:
			if ok {
				for _, user := range loggedInUsers {

					user.WriteJSON(post)
					
				}
			}
		case comment, ok := <-broadcastChannelComments:
			if ok {
				for _, user := range loggedInUsers {
					user.WriteJSON(comment)
					fmt.Println("LINE 248", comment)
				}
			}

		case onlineuser, ok := <-broadcastOnlineUsers:

			if ok {
				for _, user := range loggedInUsers {
					user.WriteJSON(onlineuser)
				}
			}

			

		}
	}
}

func GetLoginData(w http.ResponseWriter, r *http.Request) {
	db, _ := sql.Open("sqlite3", "real-time-forum.db")
	fmt.Println(r.Method)

	var t T

	data, _ := io.ReadAll(r.Body)

	t.UnmarshalForumData(data)

	if t.Type == "signup" {

		var u formValidation
		u.Tipo = "formValidation"
		canRegister := true

		if len(t.Register.Username) < 5 {
			u.UsernameLength = true
			canRegister = false
		}

		intAge, _ := strconv.Atoi(t.Register.Age)
		if intAge < 16 {
			fmt.Println(t.Register.Age)
			fmt.Println("age invalid")
			u.AgeEmpty = true
			canRegister = false
		}
		if t.Register.FirstName == "" {
			fmt.Println("first name empty")
			u.FirstNameEmpty = true
			canRegister = false
		}
		if t.Register.LastName == "" {
			fmt.Println("last name empty")
			u.LastNameEmpty = true
			canRegister = false
		}

		if len(t.Register.Password) < 5 {
			u.PasswordLength = true
			canRegister = false
		}

		if strings.Contains(t.Register.Username, " ") {
			u.UsernameSpace = true
			canRegister = false
		}

		if len(t.Register.Password) < 5 {
			u.PasswordLength = true
			canRegister = false
		}

		if !users.ValidEmail(t.Register.Email) {
			u.EmailInvalid = true
			canRegister = false
		}
		if users.UserExists(db, t.Register.Username) {
			u.UsernameDuplicate = true
			canRegister = false
		}

		if users.EmailExists(db, t.Register.Email) {
			u.EmailDuplicate = true
			canRegister = false
		}

		// all validations passed
		if canRegister {
			// hash password
			var hash []byte
			hash, err := bcrypt.GenerateFromPassword([]byte(t.Password), bcrypt.DefaultCost)
			if err != nil {
				fmt.Println("bcrypt err:", err)
			}
			users.RegisterUser(db, t.Register.Username, t.Register.Age, t.Gender, t.FirstName, t.LastName, hash, t.Email, t.Team)

			// data gets marshalled and sent to client
			u.SuccessfulRegistration = true
			u.AllUserAfterNewReg = users.GetAllUsers(db)
			toSend, _ := json.Marshal(u)
			fmt.Println("toSend -- > ", toSend)
			w.Write(toSend)
			// http.HandleFunc("/ws", WebSocketEndpoint)
		} else {

			toSend, _ := json.Marshal(u)
			w.Write(toSend)
		}
	}

	if t.Type == "login" {
		// validate values then
		var loginData loginValidation

		loginData.Tipo = "loginValidation"

		if !users.UserExists(db, t.Login.LoginUsername) && !users.EmailExists(db, t.Login.LoginUsername) {
			fmt.Println("Checking f.login.loginusername --> ", t.Login.LoginUsername)
			loginData.InvalidUsername = true
			toSend, _ := json.Marshal(loginData)
			w.Write(toSend)

		} else if users.UserExists(db, t.Login.LoginUsername) || users.EmailExists(db, t.Login.LoginUsername) {
			fmt.Println("user exists")
			if !users.CorrectPassword(db, t.Login.LoginUsername, t.Login.LoginPassword) {
				loginData.InvalidPassword = true
				toSend, _ := json.Marshal(loginData)
				w.Write(toSend)

			} else {

				currentUser = t.Login.LoginUsername
				loginData.SentPosts = posts.SendPostsInDatabase(db)
				loginData.AllUsers = users.GetAllUsers(db)
				loginData.UsersWithChat = chat.GetLatestChat(db, chat.GetChat(db, users.GetUserName(db, currentUser)))
				
				loginData.SuccessfulLogin = true
				loginData.SuccessfulUsername = users.GetUserName(db, currentUser)
				toSend, _ := json.Marshal(loginData)

				w.Write(toSend)

				

				fmt.Println("SUCCESSFUL LOGIN")
			}

			
		}

		

	}
}
