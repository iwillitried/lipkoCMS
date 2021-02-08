export default async function connect(method = "", route = "", body = {}, headers = {'Content-Type': 'application/json'}) {
// 'Content-Type': 'application/x-www-form-urlencoded',

  var options = {
    method: method, // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: headers,
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer' // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    // body: body // body data type must match "Content-Type" header
  }
  if (method != "GET") options.body = JSON.stringify(body);

  //let serverDomain = "http://localhost:3000/";
  let serverDomain = "https://lipko-backend.herokuapp.com/";
  // console.log("Connecting to api server: " + serverDomain);
  const response = await fetch(serverDomain + route, options);
  // console.log("Received: ", response);
  // const response = await fetch("https://lipko-backend.herokuapp.com/" + route, options); // https://lipko-backend.herokuapp.com/
  return response.json(); // parses JSON response into native JavaScript objects
}
