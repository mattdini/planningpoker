const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const messageForm = document.querySelector(".message_form");
const clearForm = document.querySelector(".clear_form");
const nameForm = document.querySelector(".name_form");
const messageBox = document.querySelector(".messages__history");
const table = document.querySelector(".table");
const fallback = document.querySelector(".fallback");

let userName = "";
let auth0 = null;
let userJson = {};

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();

    auth0 = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId
    });
};

const updateUI = async () => {
    const isAuthenticated = await auth0.isAuthenticated();

    document.getElementById("btn-logout").disabled = !isAuthenticated;
    document.getElementById("btn-login").disabled = isAuthenticated;

    // NEW - add logic to show/hide gated content after authentication
    if (isAuthenticated) {
        await auth0.getTokenSilently();

        authUser = await auth0.getUser();

        console.log(authUser.given_name);

        name = authUser.given_name + authUser.family_name.charAt(0);

        document.getElementById("modal-2").checked = false;
        socket.emit("new user", name);
        addToUsersBox(name);
        userName = name;

    } else {
        document.getElementById("gated-content").classList.add("hidden");
    }
};

window.onload = async () => {
    await configureClient();

    updateUI();

    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
        // show the gated content
        return;
    }

    // NEW - check for the code and state parameters
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {

        // Process the login state
        await auth0.handleRedirectCallback();

        updateUI();

        // Use replaceState to redirect the user away and remove the querystring parameters
        window.history.replaceState({}, document.title, "/");
    }
}

const login = async () => {
    await auth0.loginWithRedirect({
        redirect_uri: window.location.origin
    });
};

const newUserConnected = (user) => {
    promptForUserName();
};

const promptForUserName = () => {

    document.getElementById("modal-2").checked = true;

};

const addToUsersBox = (userName) => {
    if (!!document.querySelector(`.${userName}-userlist`)) {
        return;
    }

    const userBox = `
    <span class="chat_ib ${userName}-userlist">
      ${userName} <BR>
    </span>
  `;
    inboxPeople.innerHTML += userBox;
    addUserCard(userName);
};

const addUserCard = (name) => {
    console.log(name);
    const cardName = name + "-card";
    const cardScoreName = name + "-card-score";
    const cardEmote = name + "-emote";
    const card = `
            <div class="${cardName} sm-3 col">
                <div class="card animate__animated animate__flipInX" style="width: 10rem;">
                    <div class="card-header">${name}</div>
                    <div class="card-body">
                        <h1 class="card-title center-text ${cardScoreName} scorecard">--</h1>
                        <span class="${cardEmote} center-text">&nbsp;</span>
                    </div>
                </div>
            </div>
        `;

    table.innerHTML += card;
};

const animateCSS = (element, animation, prefix = 'animate__') =>
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        node.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd() {
            node.classList.remove(`${prefix}animated`, animationName);
            node.removeEventListener('animationend', handleAnimationEnd);

            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd);
    });

const animateCSSThenRemoveById = (id, animation, prefix = 'animate__') =>
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = document.getElementById(id);

        node.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd() {
            node.classList.remove(`${prefix}animated`, animationName);
            node.removeEventListener('animationend', handleAnimationEnd);

            node.remove();
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd);
    });

const emote = ({ user, message }) => {
    const cardEmote = user + "-emote";
    const myCardEmote = document.querySelector("." + cardEmote);
    var itm = document.querySelector("." + message);
    var cln = itm.cloneNode(true);

    cln.className += (" animated-emoji");
    ranID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    cln.setAttribute("id", ranID);
    myCardEmote.appendChild(cln);

    var animations = ['hinge', 'rollOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp'];
    randomAnimation = animations[Math.floor(Math.random() * animations.length)];

    animateCSSThenRemoveById(ranID, randomAnimation);

};

const timebox = ({ user, message }) => {
    const cardName = user + "-card";
    const cardScore = "." + user + "-card-score";

    document.querySelector(cardScore).classList.add("timebox-on");

    animateCSS("." + cardName, 'headShake');

};

const confettiCheck = () => {

    const allScores = document.querySelectorAll(".scorecard");
    let justScores = [];

    for (let key in allScores) {
        if (allScores.hasOwnProperty(key)) {
            justScores.push(allScores[key].innerHTML);
        }
    }

    if (justScores.length < 2) {
        return;
    }

    if (justScores.includes("--")) {
        return;
    }

    if (justScores.every((val, i, arr) => val === arr[0])) {
        initConfetti();
        render();
    }


};

const addNewMessage = ({ user, message }) => {
    if (message.includes('ec-')) {
        emote({ user: user, message: message });
        return;
    }

    if (message.includes('timebox-on')) {
        timebox({ user: user, message: message });
        return;
    }

    if (message.includes('timebox-off')) {
        const cardScore = "." + user + "-card-score";
        document.querySelector(cardScore).classList.remove("timebox-on");
        return;
    }

    const cardName = user + "-card";
    const cardScore = user + "-card-score";

    const myCardScore = document.querySelector("." + cardScore);
    myCardScore.innerHTML = message;

    confettiCheck();

    animateCSS("." + cardName, 'bounce');

};

// new user is created so we generate nickname and emit event
newUserConnected();

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    socket.emit("message bus", {
        message: e.submitter.value,
        nick: userName,
    });

});

var checkbox = document.querySelector("input[name=timebox]");

checkbox.addEventListener('change', function () {
    if (this.checked) {
        socket.emit("message bus", {
            message: 'timebox-on',
            nick: userName,
        });
    } else {
        socket.emit("message bus", {
            message: 'timebox-off',
            nick: userName,
        });
    }
});

clearForm.addEventListener("submit", (e) => {
    e.preventDefault();

    socket.emit("clear", {
        message: e.submitter.value,
        nick: userName,
    });

});

const clearAll = ({ user, message }) => {
    const allCards = document.querySelectorAll(".card-title");
    for (const card of allCards) {
        const parentCard = card.parentElement.parentElement.parentElement.classList[0];
        animateCSS("." + parentCard, 'wobble');

        const cardScore = "." + user + "-card-score";
        document.querySelector(cardScore).classList.remove("timebox-on");
        document.getElementById("timebox").checked = false;

        console.log(card);
        card.innerHTML = '--';
    }
};

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const fakePeople = urlParams.get('fake');
if (fakePeople) {
    for (let step = 0; step < 5; step++) {
        var names = ['Lacey', 'Maurice', 'Kerry', 'Sudie', 'Joanne', 'Eleanore', 'Elva', 'Latisha', 'Harriett', 'Horacio'];
        fakeName = names[Math.floor(Math.random() * names.length)];

        addToUsersBox(fakeName);
    }
}


socket.on("new user", function (data) {
    data.map((user) => addToUsersBox(user));
});

socket.on("user disconnected", function (userName) {
    document.querySelector(`.${userName}-userlist`).remove();
    document.querySelector(`.${userName}-card`).remove();
});

socket.on("message bus", function (data) {
    addNewMessage({ user: data.nick, message: data.message });
});

socket.on("clear all", function (data) {
    clearAll({ user: data.nick, message: data.message });
});
