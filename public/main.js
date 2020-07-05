const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const messageForm = document.querySelector(".message_form");
const clearForm = document.querySelector(".clear_form");
const nameForm = document.querySelector(".name_form");
const messageBox = document.querySelector(".messages__history");
const table = document.querySelector(".table");
const fallback = document.querySelector(".fallback");

let userName = "";

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
                        <h1 class="card-title center-text ${cardScoreName}">--</h1>
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

const addNewMessage = ({ user, message }) => {
    if (message.includes('ec-')) {
        emote({ user: user, message: message });
        return;
    }

    const cardName = user + "-card";
    const cardScore = user + "-card-score";

    const myCardScore = document.querySelector("." + cardScore);
    myCardScore.innerHTML = message;

    animateCSS("." + cardName, 'bounce');

};

// new user is created so we generate nickname and emit event
newUserConnected();

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    socket.emit("chat message", {
        message: e.submitter.value,
        nick: userName,
    });

});

nameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let name = document.getElementById('name').value;
    name = name.replace(/\s/g, '');
    document.getElementById("modal-2").checked = false;

    socket.emit("new user", name);

    addToUsersBox(name);
    userName = name;

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

socket.on("chat message", function (data) {
    addNewMessage({ user: data.nick, message: data.message });
});

socket.on("clear all", function (data) {
    clearAll({ user: data.nick, message: data.message });
});