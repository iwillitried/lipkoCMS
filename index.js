// BUGS: (null)
// TODO: add screen
// TODO: edit screen
// TODO: load new page
// TODO: fix dateField position (and resizing when too small!)
// TODO: upload new stuff to backend
// TODO: fetch pages from backend
// TODO: fetch updates from backend periodically
// TODO: upload changes to backend
// TODO: implement form check against i.g. sql injection


var masterTimeoutID = "";
var showK = true; // Show Kunden or Hersteller mode
var pageID = "112011";
var data = {
  page: null,
  kunden: null,
  hersteller: null
}
// var proxyurl = "https://cors-anywhere.herokuapp.com/";
// const data = {
//   message : "Hello World!"
// }
// const options = {
//   method : "POST",
//   header : { "content-type" : "application/json"},
//   body : JSON.stringify(data)
// }
//
// fetch("http://localhost:3000/api", options).then((res) => {
//   console.log("Server said: ");
//   console.log(res);
// });

// POST method
// async function postData(url = '', data = {}) {
//   const response = await fetch(url, {
//     method: 'POST', // *GET, POST, PUT, DELETE, etc.
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(data) // body data type must match "Content-Type" header
//   });
//   return response.json(); // parses JSON response into native JavaScript objects
// }

// postData('http://localhost:3000/api', { message : "Hello my Frrriends!" })
// .then(data => {
//   console.log(data); // JSON data parsed by `data.json()` call
// });

// Networking stuff
async function connect(method = "", route = "", body = {}) {

  var options = {
    method: method, // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer' // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    // body: body // body data type must match "Content-Type" header
  }
  if (method != "GET") options.body = JSON.stringify(body);

  const response = await fetch("https://lipko-backend.herokuapp.com/" + route, options);
  return response.json(); // parses JSON response into native JavaScript objects
}

// function fetchPageWithID(pageID, renderPage) {
//   connect("GET", "api/update/092020/1515928286/", {
//   }).then(data => {
//     console.log(data.status);
//   }).catch(err => {console.error(err);})
// }

function deleteElement(id, isK) {
  connect("DELETE", "api/"+ (isK?"k":"h") + "/"+ id);
}

function putMark(mark) {
  connect("PUT", "api/mark/" + pageID, mark);
}

function putElement(element, isK, callback) {
  connect("PUT", "api/" + (isK ? "k" : "h"), element).then(data => {
    callback();
  });
}

function postElement(element, isK, callback) {
  connect("POST", "api/" + (isK ? "k" : "h"), element).then(data => {
    callback();
  });
}

function getWithRoute(route, callback) {
  connect("GET", route, {}).then(data => {
    callback(data);
  });
}

function syncFetches(syncData, type) { // Wait until both fetch functions have returned then build ui
  if (syncData.kunden && syncData.hersteller) {
    // console.log("Got K&H:");
    // console.log(syncData);
    data.kunden = syncData.kunden;
    data.hersteller = syncData.hersteller;
  }
  if (syncData.pageID) {
    // console.log("Got page:");
    // console.log(syncData);
    data.page = syncData;
  }

  if (data.page && data.hersteller && data.kunden) {
    initUI();
  }
}

// connect("POST", "api", { kunde1 }).then(data => {
//     console.log(data);
//   })
//
//   connect("POST", "api", { hersteller1 }).then(data => {
//       console.log(data);
//     })
// connect("POST", "api", { message: "Hello World!"}).then(data => {
//   console.log(data);
// })

// helper funcs

function getTodaysPageID() {
  return `0${(new Date()).getUTCMonth()}`.slice(-2) + (new Date()).getUTCFullYear();
}

function pageIDToDateString(pageID) {
  let months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
  let month = parseInt(pageID.slice(0, 2));
  let year = pageID.slice(2, 6);
  return (months[month] + " " + year);
}

// Finds the mark that corresponds to the given ids
function getMarkFromIDs(kID, hID, markArray) {
  return markArray.find(element => {
    if (element) return ((element.kID == kID) && (element.hID == hID));
  });
}

function getMarksFromIDAndName(id, name, markArray, primArray, secArray, firstIsK) {
  var returnArray = [];

  if (name == "") { // Singel word search
    markArray.forEach((mark, i) => {
      if (mark.kID == id || mark.hID == id) {
        returnArray.push(mark._id);
      }
    });

  } else { // Two_words search
    var tempArray = [];
    markArray.forEach((mark, i) => {
      if (mark.kID == id || mark.hID == id) {
        tempArray.push(mark);
      }
    });
    tempArray.forEach((item, i) => {
      let secElement = getElementFromID((firstIsK?item.hID:item.kID), secArray);
      console.log("SecID:");
      console.log((firstIsK?item.hID:item.kID));
      console.log("Mark item:");
      console.log(item);
      console.log("SecArray:");
      console.log(secArray);
      console.log("secElement:");
      console.log(secElement);
      if (secElement.name.toLowerCase().includes(name.toLowerCase())) {
        returnArray.push(item._id);
      }
    });
  }

  return returnArray;
}

function getElementFromID(id, array) {
  return array.find(element => (element._id == id));
}

function dateToTimeLabel(date) {
  if (date == null) return "nie";

  const d = new Date(date);
  const ye = new Intl.DateTimeFormat('de', {
    year: 'numeric'
  }).format(d);
  const mo = new Intl.DateTimeFormat('de', {
    month: '2-digit'
  }).format(d);
  const da = new Intl.DateTimeFormat('de', {
    day: '2-digit'
  }).format(d);
  const hhmm = new Intl.DateTimeFormat('de', {
    hour: '2-digit', minute:'2-digit'
  }).format(d);

  return `${da}.${mo}.${ye}\n${hhmm} Uhr`;

  // let diff = (Date.now() - date) / 60000.0;
  // var string = "";
  // if (diff >= 525600) {
  //   string = "vor " + Math.floor(diff / 525600) + (diff < 525600 * 2 ? " Jahr" : " Jahren");
  // } else if (diff >= 43800) {
  //   string = "vor " + Math.floor(diff / 43800) + (diff < 43800 * 2 ? " Monat" : " Monaten");
  // } else if (diff >= 10080) {
  //   string = "vor " + Math.floor(diff / 10080) + (diff < 10080 * 2 ? " Woche" : " Wochen");
  // } else if (diff >= 1440) {
  //   string = "vor " + Math.floor(diff / 1440) + (diff < 1440 * 2 ? " Tag" : " Tagen");
  // } else if (diff >= 60) {
  //   string = "vor " + Math.floor(diff / 60) + (diff < 60 * 2 ? " Stunde" : " Stunden");
  // } else if (diff >= 1) {
  //   string = "vor " + Math.floor(diff) + (diff < 2 ? " Minute" : " Minuten");
  // } else {
  //   string = "gerade eben";
  // }

  // return string;
}

function addToPageID(value, pageID) {
  var month = parseInt(pageID.slice(0, 2));
  var year = parseInt(pageID.slice(2));
  month = month + value;
  while (month > 11) {
    month -= 12;
    year++;
  }
  while (month < 0) {
    month += 12;
    year--;
  }

  return `0${month}`.slice(-2) + year;
}


window.onload = function() {
  pageID = getTodaysPageID();
  getWithRoute("api/page/" + pageID, syncFetches); // Fetch todays page
  getWithRoute("api/", syncFetches); // Fetch kunden & hersteller
  masterTimeoutID = setTimeout(showTimoutError, 10000);
};
