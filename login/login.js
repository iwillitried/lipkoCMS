import connect from '../network.js'
var cookieName = "lipko-anmelde-token"
import {createCookie,eraseCookie,readCookie} from "../cookies.js"

async function authenticate() {
  let form = document.getElementsByTagName('form')[0];
  let name = form.elements.namedItem('uname').value;
  let password = form.elements.namedItem('psw').value;
  console.log("Got values: name = " + name + ' password = ' + password);
  let body = {};
  body.email = name;
  body.password = password;

  let response = await connect(
    "POST",
    "api/auth/login",
    body,
    {'Content-Type': 'application/x-www-form-urlencoded'
  }).catch((err) => { console.log("There was an error connecting to the API Server" + err);});
  console.log("response: ", response);
  if (response && response.auth) {
    // Auth succeeded
    // Store token in cookie then reload to start page
    createCookie(cookieName, token, 1);
    window.location.replace('/');
  } else {
    document.getElementById('fail-box').classList.add('login-error');
  }
  return false;
}

function init() {
  let button = document.getElementById("submitButton");
  let form = document.getElementById("form")
  button.onclick = authenticate;
  form.onkeyup = (e) => {
    if (e.key == 'enter') authenticate();
  }
  // button.addEventListener('onclick', (e) => { authenticate() });
  // form.addEventListener('onKeyup', function(event) {
  //   if (event.key == 'enter') {
  //     authenticate();
  //     return false;
  //   }
  // });
}



init();
