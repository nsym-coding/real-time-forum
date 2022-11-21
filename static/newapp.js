let posts = document.getElementById("post-feed");
let onlineUsers = document.getElementById("onlineusers");

let postButton = document.getElementById("new-post-btn");

let users = [];
let onlineUsersFromGo = [];

let loggedInUser = "";
let homepageUsername = document.getElementById("active-username");
let crests = document.getElementsByClassName("crest-colors");

let userDetails;
let imageDiv;
let img;

let ws;

let modal = document.getElementsByClassName("modal");
let chatModal = document.getElementById("my-chat-modal");
let createPostModal = document.getElementById("create-post-modal");
let displayPostModal = document.getElementById("display-post-modal");

let submitPostButton = document.querySelector("#submit-post-button");
let postTitle = document.querySelector("#post-title");
let postContent = document.querySelector("#post-content");
let registerBtn = document.getElementById("register-btn");
let signUpForm = document.getElementById("signup-form");

let commentContainer = document.getElementById("comment-container");
let commentArrow = document.getElementById("comment-arrow");
let commentTextArea = document.getElementById("comment-input");

// Get the button that opens the modal
let btn = document.getElementById("myBtn");

let commentData = {};
let clickedPostID;

let signupSwitch = document.getElementById("sign-up-button");
let loginBox = document.querySelector(".login-box");
let registerBox = document.querySelector(".register-box");
let loginReturn = document.querySelector("#login-return");
let loginButton = document.getElementById("login-button");
let forumBody = document.getElementById("forumbody");
let loginModal = document.querySelector(".login-modal");
let loginForm = document.getElementById("login-form");
let loginError = document.getElementById("login-error");

let sendArrow = document.getElementById("chat-arrow");
let chatTextArea = document.getElementById("chat-input");
let chatContainer = document.getElementById("chat-container");
let chatBody = document.getElementById("chat-box-body");
let displayPostBody = document.getElementById("display-post-body");
let chatRecipient = document.getElementById("chat-recipient");
let sender = true;

let typingAnimation = document.getElementById("typing-animation");
let animationCirles = document.querySelectorAll(".circle.scaling");

postButton.addEventListener("click", function () {
  createPostModal.style.display = "block";
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  for (let i = 0; i < modal.length; i++) {
    if (event.target == modal[i]) {
      modal[i].style.display = "none";
      if (modal[i].id === "my-chat-modal") {
        chatContainer.innerHTML = "";
        chatBody.removeEventListener(
          "scroll",
          Throttler(displaySurplusMessages, 2000)
        );
      }
    }
  }
};

loginButton.addEventListener("click", (e) => {
  let loginData = new FormData(loginForm);
  let loginFormToGo = Object.fromEntries(loginData);
  loginFormToGo["type"] = "login";

  // fetch, send login data to backend server

  fetch("http://localhost:8080/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginFormToGo),
  })
    .then((resp) => resp.json())
    .then(function (data) {
      if (data.tipo === "loginValidation") loginValidation(data);
    });
});

sendArrow.addEventListener("click", function () {
  let chatData = {};

  if (chatTextArea.value != "") {
    chatData.chatsender = loggedInUser;
    chatData.chatrecipient = chatRecipient.innerText;
    chatData.message = chatTextArea.value;
    chatData.type = "chatMessage";

    ws.send(JSON.stringify(chatData));
  }
  chatTextArea.value = "";
});

const crestSelection = document.querySelector("select").options;
const categorySelection = document.getElementById("category-selection");

for (let crest of crestSelection) {
  let img = document.createElement("img");
  img.style.backgroundColor = "white";
  img.alt = "none";
  img.id = crest.value;
  img.classList = "crest-colors";
  img.src = `/css/img/${crest.value}.png`;
  categorySelection.append(img);
}

let crestcolors = document.getElementsByClassName("crest-colors");

const colorSwitch = {
  newcastle: `linear-gradient(
      to right,
      #040108,
      #040108 50%,
      #f0f0f0 50%,
      #f0f0f0
    )`,
  spurs: "lightgrey",
  "man-u": "red",
  chelsea: "blue",
  liverpool: "red",
  "man-city": "skyblue",
  arsenal: "red",
  "aston-villa": "lightgrey",
  "afc-bournemouth": "red",
  brentford: "red",
  brighton: "blue",
  "crystal-palace": "blue",
  everton: "blue",
  fulham: "lightgrey",
  leeds: "lightgrey",
  leicester: "lightgrey",
  "nottingham-forest": "lightgrey",
  "west-ham": "lightgrey",
  southampton: "red",
  wolverhampton: "lightgrey",
};

for (let i = 0; i < crestcolors.length; i++) {
  crestcolors[i].addEventListener("mouseup", (e) => {
    if (e.target.alt == "none") {
      e.target.style.background = colorSwitch[e.target.id];
      e.target.alt = colorSwitch[e.target.id];
    } else {
      e.target.style.background = "white";
      e.target.alt = "none";
    }
  });
}

signupSwitch.addEventListener("click", (e) => {
  loginBox.style.display = "none";
  registerBox.style.display = "block";
});

loginReturn.addEventListener("click", (e) => {
  loginBox.style.display = "block";
  registerBox.style.display = "none";
});

const loginValidation = (data) => {
  console.log("Data from fetch", data);

  if (data.successfulLogin) {
    loggedInUser = data.successfulusername;
    homepageUsername.innerText = loggedInUser;
    loginModal.style.display = "none";
    forumBody.style.display = "block";
    ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = (e) => {
      for (let i = 0; i < data.dbposts.length; i++) {
        DisplayPosts(data.dbposts[i]);
      }

      console.log("connection established");
    };
    persistentListener();
  } else {
    loginError.style.display = "block";
  }
};

// dummy post info being sent to server
let objData = {};
submitPostButton.addEventListener("click", function (e) {
  e.preventDefault();
  console.log("getSelTeams test -> ", getSelectedTeams());
  objData["title"] = postTitle.value;
  objData["postcontent"] = postContent.value;
  objData["type"] = "post";
  objData["username"] = loggedInUser;
  objData["categories"] = getSelectedTeams();
  createPostModal.style.display = "none";
  postTitle.value = "";
  postContent.value = "";

  // message sent to server
  ws.send(JSON.stringify(objData));
  persistentListener();

  for (let i = 0; i < crests.length; i++) {
    crests[i].alt = "none";
    crests[i].style.background = "white";
  }
});

let successfulRegistrationMessage = document.getElementById(
  "registered-login-success"
);

let registrationErrors = document.querySelectorAll(".registration-errors");

let usernameError = document.getElementById("username-error");
let ageError = document.getElementById("age-error");
let firstnameError = document.getElementById("firstname-error");
let lastnameError = document.getElementById("lastname-error");
let emailError = document.getElementById("email-error");
let passwordError = document.getElementById("password-error");

const registrationValidation = (data) => {
  if (data.successfulRegistration) {
    registerBox.style.display = "none";
    loginBox.style.display = "block";
    signupSwitch.style.display = "none";
    successfulRegistrationMessage.style.display = "block";
  } else {
    if (data.usernameLength || data.usernameSpace) {
      usernameError.innerText = "";
      usernameError.innerText = "min 5 characters, no spaces";
      usernameError.style.display = "block";
    }

    if (data.usernameDuplicate) {
      usernameError.innerText = "";
      usernameError.innerText = "Username exists";
      usernameError.style.display = "block";
    }

    if (data.emailDuplicate) {
      emailError.innerText = "";
      emailError.innerText = "Email exists";
      emailError.style.display = "block";
    }

    if (data.emailInvalid) {
      emailError.innerText = "";
      emailError.innerText = " Valid email required";
      emailError.style.display = "block";
    }

    if (data.passwordLength) {
      passwordError.style.display = "block";
    }
    if (data.ageEmpty) {
      ageError.style.display = "block";
    }

    if (data.firstnameEmpty) {
      firstnameError.style.display = "block";
    }

    if (data.lastnameEmpty) {
      lastnameError.style.display = "block";
    }
  }
};

registerBtn.addEventListener("click", function (e) {
  registrationErrors.forEach(function (el) {
    el.style.display = "none";
  });

  let signupData = new FormData(signUpForm);
  let signUpFormToGo = Object.fromEntries(signupData);

  signUpFormToGo.type = "signup";

  fetch("http://localhost:8080/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signUpFormToGo),
  })
    .then((resp) => resp.json())
    .then(function (data) {
      if (data.tipo === "formValidation") {
        console.log("Check form val is being called");
        registrationValidation(data);
      }
    });
});

// logout
let logoutButton = document.getElementById("log-out-button");

logoutButton.onclick = () => {
  objData = {};
  objData["type"] = "logout";
  objData["logoutUsername"] = loggedInUser;

  ws.send(JSON.stringify(objData));

  ws.onmessage = (e) => {
    let logoutData = JSON.parse(e.data);
    if (logoutData.logoutClicked) {
      ws.close();
      window.location.reload();
    }
  };
};

const DisplayPosts = (data) => {
  console.log("post data on login ---> ", data);
  let postDivs = document.createElement("div");
  let postTitle = document.createElement("div");

  postTitle.className = "post-title-class";

  let postFooter = document.createElement("div");
  postFooter.className = "post-footer";
  postDivs.className = "post-class ";

  postDivs.id = data.postid;
  postTitle.innerText = data.title;
  postTitle.style.borderBottom = "0.2vh solid black";
  postFooter.innerText = `Created by ${data.username},   Date: ${data.posttime}`;

  let badgesDiv = document.createElement("div");
  badgesDiv.style.marginLeft = "0.5vh";

  addBadgesToPosts(data.categories, badgesDiv);
  postFooter.style.display = "flex";
  postFooter.style.fontSize = "small";
  postFooter.style.alignItems = "center";
  postFooter.style.justifyContent = "center";
  postFooter.appendChild(badgesDiv);

  postDivs.appendChild(postTitle);
  postDivs.appendChild(postFooter);

  posts.prepend(postDivs);

  let getCommentsForPosts = {};

  // When a post is clicked on
  postDivs.addEventListener("click", (e) => {
    clickedPostID = postDivs.id;
    getCommentsForPosts["clickedPostID"] = clickedPostID;
    getCommentsForPosts["type"] = "getcommentsfrompost";

    ws.send(JSON.stringify(getCommentsForPosts));

    let displayPostTitle = document.querySelector(".display-post-title");
    let displayPostContent = document.querySelector(".display-post-content");
    let postUsername = document.querySelector(".post-username");
    let postDate = document.querySelector(".post-date");
    displayPostTitle.innerText = data.title;
    displayPostContent.innerText = data.postcontent;
    postUsername.innerText = data.username;
    postDate.innerText = data.posttime;
    displayPostModal.style.display = "block";

    commentContainer.innerHTML = "";

    persistentListener();
  });
};

const getSelectedTeams = () => {
  let crestList = "";
  for (let i = 0; i < crests.length; i++) {
    if (crests[i].alt !== "none") {
      crestList += `${crests[i].id},`;
    }
  }
  return crestList;
};

commentArrow.addEventListener("click", function () {
  commentData["commentcontent"] = commentTextArea.value;
  commentData["user"] = loggedInUser;
  commentData["postid"] = clickedPostID;
  commentData["type"] = "comment";

  ws.send(JSON.stringify(commentData));
  commentTextArea.value = "";
});

let areUsersPopulated = false;

const populateUsers = (users) => {
  console.log({ users });
  onlineUsers.innerHTML = "";

  sortingUsersWithChat(users);
  sortingChatlessUsers(users);

  console.log("online from Go", onlineUsersFromGo);

  let requestNotifications = {};
  requestNotifications.type = "requestNotifications";
  requestNotifications.username = loggedInUser;

  ws.send(JSON.stringify(requestNotifications));

  loadInitialTenMessages();
};

//sorting chatUsers
const sortingUsersWithChat = (users) => {
  if (users.userswithchat !== null) {
    users.userswithchat.sort((a, b) => b.messageID - a.messageID);

    console.log("sorting data from last message", users);

    for (let chatUser of users.userswithchat) {
      for (let usersWithBadge of users.allUsers) {
        if (
          usersWithBadge.user != loggedInUser &&
          (chatUser.chatsender === usersWithBadge.user ||
            chatUser.chatrecipient === usersWithBadge.user)
        ) {
          console.log("usersWithBadge-----user-------", usersWithBadge.user);
          console.log("usersWithBadge------team------", usersWithBadge.team);

          userDetails = document.createElement("div");
          let username = document.createElement("div");
          imageDiv = document.createElement("div");
          img = document.createElement("img");
          let onlineIcon = document.createElement("online-icon");

          img.src = `/css/img/${usersWithBadge.team}.png`;
          img.style.width = "2vw";
          imageDiv.appendChild(onlineIcon);
          userDetails.id = `${usersWithBadge.user}`;

          userDetails.className = "registered-user";
          userDetails.classList.add("userWithChat");

          if (onlineUsersFromGo.includes(usersWithBadge.user)) {
            onlineIcon.className = "online-icon-class";
          } else {
            onlineIcon.className = "offline-icon-class";
          }
          username.innerText = `${usersWithBadge.user}`;
          imageDiv.append(img);
          userDetails.appendChild(username);
          userDetails.appendChild(imageDiv);
          onlineUsers.appendChild(userDetails);
        }
      }
    }
  }
};

const UpdateAllWithNewUser = (data) => {
  userDetails = document.createElement("div");
  let username = document.createElement("div");
  imageDiv = document.createElement("div");
  img = document.createElement("img");
  let onlineIcon = document.createElement("online-icon");

  img.src = `/css/img/${usersWithBadge.team}.png`;
  img.style.width = "2vw";
  imageDiv.appendChild(onlineIcon);
  userDetails.id = `${usersWithBadge.user}`;

  userDetails.className = "registered-user";

  if (onlineUsersFromGo.includes(usersWithBadge.user)) {
    onlineIcon.className = "online-icon-class";
  } else {
    onlineIcon.className = "offline-icon-class";
  }
  username.innerText = `${usersWithBadge.user}`;
  imageDiv.append(img);
  userDetails.appendChild(username);
  userDetails.appendChild(imageDiv);
  onlineUsers.appendChild(userDetails);
};

let chatlessArray = [];

const sortingChatlessUsers = (users) => {
  console.log("pre---->", users);
  if (users.userswithchat !== null) {
    for (let j = 0; j < users.userswithchat.length; j++) {
      for (let i = 0; i < users.allUsers.length; i++) {
        if (
          users.allUsers[i].user !== loggedInUser &&
          (users.allUsers[i].user === users.userswithchat[j].chatsender ||
            users.allUsers[i].user === users.userswithchat[j].chatrecipient)
        ) {
          console.log("checking 3 --> ", users.allUsers[i].user);
          users.allUsers.splice(i, 1);
        }
      }
    }
  }

  users.allUsers.sort((a, b) => a.user.localeCompare(b.user));
  chatlessArray = users.allUsers;

  for (let usersWithBadge of users.allUsers) {
    if (usersWithBadge.user != loggedInUser) {
      userDetails = document.createElement("div");
      let username = document.createElement("div");
      imageDiv = document.createElement("div");
      img = document.createElement("img");
      let onlineIcon = document.createElement("online-icon");

      img.src = `/css/img/${usersWithBadge.team}.png`;
      img.style.width = "2vw";
      imageDiv.appendChild(onlineIcon);
      userDetails.id = `${usersWithBadge.user}`;

      userDetails.className = "registered-user";
      userDetails.classList.add("userWithoutChat");

      if (onlineUsersFromGo.includes(usersWithBadge.user)) {
        onlineIcon.className = "online-icon-class";
      } else {
        onlineIcon.className = "offline-icon-class";
      }
      username.innerText = `${usersWithBadge.user}`;
      imageDiv.append(img);
      userDetails.appendChild(username);
      userDetails.appendChild(imageDiv);
      onlineUsers.appendChild(userDetails);
    }
  }
};

const getNotifications = (users) => {
  let userRg = document.getElementsByClassName("registered-user");

  console.log("userrg.length----", userRg.length);
  for (const member of userRg) {
    for (const user of users) {
      if (member.id == user.notificationsender && user.notificationcount > 0) {
        let notificationDiv = document.createElement("notificationsDiv");
        notificationDiv.id = user.notificationsender + "box";

        notificationDiv.classList.add("notifications");
        notificationDiv.innerHTML = user.notificationcount;
        member.appendChild(notificationDiv);
      }
    }
  }
};

function getOneNotification(data) {
  if (document.getElementById(`${data.notificationsender}box`) !== null) {
    document.getElementById(`${data.notificationsender}box`).remove();
    console.log("REMOVING EXTRA DIVS");
  }

  if (data.notificationrecipient === loggedInUser) {
    let notifSenderDiv = document.getElementById(`${data.notificationsender}`);
    console.log("Sanchos Div", notifSenderDiv);

    let notificationDiv = document.createElement("notificationsDiv");
    notificationDiv.id = data.notificationsender + "box";
    notificationDiv.classList.add("notifications");
    notificationDiv.innerHTML = data.notificationcount;
    notifSenderDiv.appendChild(notificationDiv);
  }
}

let span = document.getElementsByClassName("close");
let surplusMessages = [];
let loadedTenMessages = false;

// When the user clicks the button, open the modal

function loadInitialTenMessages() {
  let userRg = document.getElementsByClassName("registered-user");

  for (const user of userRg) {
    user.onclick = function () {
      chatContainer.innerHTML = "";
      chatRecipient.innerText = user.id;
      let requestChatData = {};
      requestChatData["chatsender"] = loggedInUser;
      requestChatData["chatrecipient"] = chatRecipient.innerText;
      requestChatData["type"] = "requestChatHistory";
      ws.send(JSON.stringify(requestChatData));

      persistentListener();
      console.log("Users clicked", user.id);
      chatModal.style.display = "block";
    };
  }

  // When the user clicks on <span> (x), close the modal
  for (let i = 0; i < span.length; i++) {
    span[i].onclick = function () {
      modal[i].style.display = "none";
      if (modal[i].id === "my-chat-modal") {
        chatContainer.innerHTML = "";
        chatBody.removeEventListener(
          "scroll",
          Throttler(displaySurplusMessages, 2000)
        );
      }
    };
  }
}

function Throttler(fn = () => {}, wait) {
  var time = Date.now();
  return function () {
    if (time + wait - Date.now() < 0) {
      fn();
      time = Date.now();
    }
  };
}

function displaySurplusMessages() {
  if (
    surplusMessages.length > 0 &&
    (surplusMessages[0].chatsender === chatRecipient.innerText ||
      surplusMessages[0].chatrecipient === chatRecipient.innerText)
  ) {
    console.log("domrect", chatBody.getBoundingClientRect().y);
    if (loadedTenMessages && chatBody.scrollTop < 100) {
      chatBody.scrollBy(0, 90);
      if (surplusMessages.length > 10) {
        for (
          let i = surplusMessages.length - 1;
          i > surplusMessages.length - 10;
          i--
        ) {
          let newChatBubble = document.createElement("div");
          newChatBubble.innerText = surplusMessages[i].message;
          let dateDiv = document.createElement("div");
          dateDiv.style.fontSize = "xx-small";

          if (surplusMessages[i].chatsender == loggedInUser) {
            dateDiv.innerHTML = `${surplusMessages[i].chatDate}, ${surplusMessages[i].chatsender}`;

            newChatBubble.id = "chat-message-sender";

            newChatBubble.appendChild(dateDiv);
          } else {
            dateDiv.innerHTML = `${surplusMessages[i].chatDate},${surplusMessages[i].chatsender}`;

            newChatBubble.id = "chat-message-recipient";
            newChatBubble.appendChild(dateDiv);
          }
          chatContainer.insertBefore(newChatBubble, chatContainer.children[0]);
        }

        surplusMessages = surplusMessages.slice(0, surplusMessages.length - 10);
      } else {
        for (let j = surplusMessages.length - 1; j >= 0; j--) {
          let newChatBubble = document.createElement("div");
          newChatBubble.innerText = surplusMessages[j].message;
          let dateDiv = document.createElement("div");
          dateDiv.style.fontSize = "xx-small";

          if (surplusMessages[j].chatsender == loggedInUser) {
            dateDiv.innerHTML = `${surplusMessages[j].chatDate}, ${surplusMessages[j].chatsender}`;

            newChatBubble.id = "chat-message-sender";
            newChatBubble.appendChild(dateDiv);
          } else {
            dateDiv.innerHTML = `${surplusMessages[j].chatDate},${surplusMessages[j].chatsender}`;

            newChatBubble.id = "chat-message-recipient";
            newChatBubble.appendChild(dateDiv);
          }
          chatContainer.insertBefore(newChatBubble, chatContainer.children[0]);
        }
        surplusMessages = [];
        loadedTenMessages = false;
      }
    }
  }
}

function addBadgesToPosts(data, div) {
  // split the string
  // loop through and add each team to the divs inner html.

  let arrayOfBadges = data.split(",");

  for (let i = 0; i < arrayOfBadges.length; i++) {
    if (arrayOfBadges[i] !== "") {
      div.innerHTML += `<img src="/css/img/${arrayOfBadges[i]}.png" style="width: 2vw;"></img>`;
    }
  }
}

let firstTimeNotifications = true;

const changeOnlineStatus = (data) => {
  let userRg = document.getElementsByClassName("registered-user");
  console.log("updated online users", data.UpdatedOnlineUsers);
  for (const item of userRg) {
    if (data.UpdatedOnlineUsers.includes(item.id)) {
      item.getElementsByTagName("online-icon")[0].className =
        "online-icon-class";
    } else {
      item.getElementsByTagName("online-icon")[0].className =
        "offline-icon-class";
    }
  }
};

function newUserDiv(data, userDiv, whereToInsert) {
  let newUserDiv = document.createElement("div");
  let username = document.createElement("div");
  let imageDiv = document.createElement("div");
  let img = document.createElement("img");
  let onlineIcon = document.createElement("online-icon");
  newUserDiv.className = "registered-user";
  newUserDiv.classList.add("userWithoutChat");
  img.src = `/css/img/${data.GetLastUserFromDatabase.team}.png`;
  img.style.width = "2vw";
  imageDiv.appendChild(onlineIcon);
  newUserDiv.id = `${data.GetLastUserFromDatabase.user}`;
  username.innerText = `${data.GetLastUserFromDatabase.user}`;
  imageDiv.append(img);
  newUserDiv.appendChild(username);
  newUserDiv.appendChild(imageDiv);
  if (whereToInsert === "insertBefore") {
    onlineUsers.insertBefore(newUserDiv, userDiv);
  } else {
    userDiv.after(newUserDiv);
  }
  newUserDiv.onclick = function () {
    chatContainer.innerHTML = "";
    chatRecipient.innerText = newUserDiv.id;
    let requestChatData = {};
    requestChatData["chatsender"] = loggedInUser;
    requestChatData["chatrecipient"] = chatRecipient.innerText;
    requestChatData["type"] = "requestChatHistory";
    ws.send(JSON.stringify(requestChatData));
    chatModal.style.display = "block";
  };
}

function addNewRegUserDiv(data) {
  let chatlessUsersNames = chatlessArray.map((a) => a.user);
  if (!chatlessUsersNames.includes(data.GetLastUserFromDatabase.user)) {
    chatlessArray.push(data.GetLastUserFromDatabase.user);
    chatlessUsersNames.push(data.GetLastUserFromDatabase.user);
    console.log("chatless users array", chatlessUsersNames);
    chatlessUsersNames.sort((a, b) => a.localeCompare(b));

    if (chatlessUsersNames.indexOf(data.GetLastUserFromDatabase.user) === 0) {
      let userAfterNewUser = chatlessUsersNames[1];
      const userAfterNewUserDiv = document.getElementById(userAfterNewUser);
      console.log("INSERT BEFORE =============>");
      newUserDiv(data, userAfterNewUserDiv, "insertBefore");
      persistentListener();
    } else if (
      chatlessUsersNames.indexOf(data.GetLastUserFromDatabase.user) ===
      chatlessUsersNames.length - 1
    ) {
      let userAfterNewUser = chatlessUsersNames[chatlessUsersNames.length - 2];
      const userAfterNewUserDiv = document.getElementById(userAfterNewUser);
      console.log("INSERT AFTER 1============>");
      newUserDiv(data, userAfterNewUserDiv, "insertAfter");
      persistentListener();
    } else {
      let userAfterNewUser =
        chatlessUsersNames[
          chatlessUsersNames.indexOf(data.GetLastUserFromDatabase.user) - 1
        ];

      const userAfterNewUserDiv = document.getElementById(userAfterNewUser);
      newUserDiv(data, userAfterNewUserDiv, "insertAfter");
      console.log("INSERT AFTER 2============>");

      persistentListener();
    }
  }
}

function sendTypingStatus(isTyping) {
  if (keyPressed) {
    let typingData = {};
    typingData["typingstatusrecipient"] = chatRecipient.innerText;
    typingData["typingstatussender"] = loggedInUser;
    typingData["type"] = "typingStatus";
    if (isTyping === true) {
      typingData["status"] = "true";
    } else {
      typingData["status"] = "false";
    }
    ws.send(JSON.stringify(typingData));
  }
}
let compareValue = "";
function hasTextInputChanged() {
  if (compareValue === chatTextArea.value) {
    // Send data to go. Person stopped typing
    sendTypingStatus(false);
  } else {
    sendTypingStatus(true);
    compareValue = chatTextArea.value;
  }
}
let typingInterval;
let keyPressed = false;
chatTextArea.onfocus = function () {
  let typingObject = {};
  typingObject["typingStatusRecipient"] = chatRecipient.innerText;
  typingObject["typingStatusSender"] = loggedInUser;
  typingObject["type"] = "typingnotificationstart";
  console.log("Typing area is focused!!");
  ws.send(JSON.stringify(typingObject));
  chatTextArea.onkeydown = function () {
    keyPressed = true;
  };
  typingInterval = setInterval(hasTextInputChanged, 500);
};
chatTextArea.onblur = function () {
  console.log("object on blur !! ");
  let typingFinished = {};
  typingFinished["typingrecipient"] = chatRecipient.innerText;
  typingFinished["typingsender"] = loggedInUser;
  typingFinished["type"] = "typingnotificationend";
  ws.send(JSON.stringify(typingFinished));
  clearInterval(typingInterval);
};

function persistentListener() {
  ws.onmessage = (e) => {
    let data = JSON.parse(e.data);

    if (data.tipo == "allComments") {
      console.log("ALL COMMENTS DISPLAYED");
      for (let i = 0; i < data.comments.length; i++) {
        let commentDiv = document.createElement("div");
        commentDiv.style.marginBottom = "1vh";
        commentDiv.id = `comment${data.comments[i].commentId}`;
        commentDiv.innerText = `${data.comments[i].commentcontent} \n ${data.comments[i].user}, ${data.comments[i].commenttime}`;
        commentContainer.appendChild(commentDiv);
      }
    }

    if (data.tipo == "lastComment") {
      console.log("This is the last coment", data);
      let commentDiv = document.createElement("div");
      commentDiv.style.marginBottom = "1vh";
      commentDiv.id = `comment${data.commentid}`;
      commentDiv.innerText = `${data.commentcontent} \n ${data.user}, ${data.commenttime}`;
      commentContainer.appendChild(commentDiv);
    }

    if (data.response === "Notification viewed and set to nil") {
      let clickedNotificationDiv = document.getElementById(
        `${data.usertodelete}box`
      );

      if (clickedNotificationDiv !== null) {
        clickedNotificationDiv.remove();
      }
    }

    if (data.tipo === "messagehistoryfromgo" && data.chathistory !== null) {
      chatContainer.innerHTML = "";
      let loopfrom;

      if (data.chathistory.length >= 10) {
        loopfrom = data.chathistory.length - 10;

        surplusMessages = data.chathistory.slice(
          0,
          data.chathistory.length - 10
        );

        loadedTenMessages = true;
        chatBody.addEventListener(
          "scroll",
          Throttler(displaySurplusMessages, 2000)
        );
      } else {
        loopfrom = 0;
      }

      for (let i = loopfrom; i < data.chathistory.length; i++) {
        let newChatBubble = document.createElement("div");
        let dateDiv = document.createElement("div");
        dateDiv.style.fontSize = "xx-small";
        newChatBubble.innerText = data.chathistory[i].message;

        if (data.chathistory[i].chatsender == loggedInUser) {
          dateDiv.innerHTML = `${data.chathistory[i].chatDate}, ${data.chathistory[i].chatsender}`;
          newChatBubble.id = "chat-message-sender";
          newChatBubble.appendChild(dateDiv);
        } else {
          dateDiv.innerHTML = `${data.chathistory[i].chatDate},${data.chathistory[i].chatsender}`;

          newChatBubble.id = "chat-message-recipient";
          newChatBubble.appendChild(dateDiv);
        }
        chatContainer.appendChild(newChatBubble);

        chatBody.scrollTo(0, chatBody.scrollHeight);
      }
    } else if (
      data.tipo === "messagehistoryfromgo" &&
      data.chathistory === null
    ) {
      chatBody.removeEventListener(
        "scroll",
        Throttler(displaySurplSurplusMessages, 2000)
      );
      chatContainer.innerHTML = "";
    }
    if (data.tipo === "clientnotifications" && firstTimeNotifications) {
      getNotifications(data.notification);
      firstTimeNotifications = false;
    }
    if (data.tipo === "post") {
      DisplayPosts(data);
    }

    if (data.tipo === "onlineUsers") {
      onlineUsersFromGo = data.onlineUsers;

      populateUsers(data);
    }

    if (data.tipo === "updatedOnlineUsers") {
      //deal with new users and add them to userrg
      if (data.GetLastUserFromDatabase.user !== loggedInUser) {
        addNewRegUserDiv(data);
      }
      changeOnlineStatus(data);
    }

    if (data.tipo === "lastMessage") {
      let userDivs = document.getElementsByClassName("registered-user");

      // move user div to the top if sender or recipient
      if (data.chatsender === loggedInUser) {
        onlineUsers.insertBefore(
          userDivs.namedItem(data.chatrecipient),
          userDivs[0]
        );
      } else {
        onlineUsers.insertBefore(
          userDivs.namedItem(data.chatsender),
          userDivs[0]
        );
      }

      let newChatBubble = document.createElement("div");
      newChatBubble.innerText = data.message;
      let dateDiv = document.createElement("div");
      dateDiv.style.fontSize = "xx-small";

      if (data.chatsender == loggedInUser) {
        dateDiv.innerHTML = `${new Date()
          .toLocaleTimeString("en-GB", {
            hour: "numeric",
            minute: "numeric",
          })
          .replace(",", "")} ${new Date()
          .toLocaleDateString()
          .replace(",", "")} ${data.chatsender}`;

        newChatBubble.id = "chat-message-sender";
        newChatBubble.appendChild(dateDiv);
      } else {
        dateDiv.innerHTML = `${new Date()
          .toLocaleTimeString("en-GB", {
            hour: "numeric",
            minute: "numeric",
          })
          .replace(",", "")} ${new Date()
          .toLocaleDateString()
          .replace(",", "")} ${data.chatsender}`;

        newChatBubble.id = "chat-message-recipient";
        newChatBubble.appendChild(dateDiv);
      }

      chatContainer.appendChild(newChatBubble);
      chatBody.scrollTo(0, chatBody.scrollHeight);

      if (
        chatModal.style.display === "block" &&
        data.livenotification.notificationsender == chatRecipient.innerHTML
      ) {
        let deleteNotifications = {};
        deleteNotifications.type = "deletenotification";
        deleteNotifications.sender = data.livenotification.notificationsender;
        deleteNotifications.recipient =
          data.livenotification.notificationrecipient;
        ws.send(JSON.stringify(deleteNotifications));
      } else {
        getOneNotification(data.livenotification);
      }
    }
    if (data.tipo === "typingNotification") {
      if (
        chatModal.style.display === "block" &&
        chatRecipient.innerText === data.typingSender
      ) {
        typingNotificationRecipient = chatRecipient.innerText;
      }
    }
    if (data.tipo === "typingIsOver") {
      typingAnimation.style.display = "none";
    }
    if (data.tipo === "toAnimateOrNot") {
      typingAnimation.style.display = "flex";

      if (data.sendStatus === "true") {
        // animate
        for (let circle of animationCirles) {
          circle.style.animationPlayState = "running";
        }
      } else {
        // dont animate
        for (let circle of animationCirles) {
          circle.style.animationPlayState = "paused";
        }
      }
    }
  };
}
