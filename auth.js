import connect from './network.js'
var cookieName = "lipko-anmelde-token"
import {createCookie,eraseCookie,readCookie} from "../cookies.js"

export default function authenticate() {
  var token = checkCookies();
  if (token != null) return token;
  window.location.replace('/login/page.html');
}

async function validateToken(token) {
  // start reques with localhost:3000/api/auth/me and the token in header
  let response = await connect("GET", "api/auth/me", {}, {'Content-Type': 'application/x-www-form-urlencoded', 'x-access-token' : token});
  return (response.name != null);
}

function checkCookies() {
  let value = readCookie(cookieName);
  if (value != null && validateToken(token)) {
    return token;
  }
  return null;
}
