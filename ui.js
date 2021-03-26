import {pageIDToDateString, pageID, data, getMasterTimeoutID, setMasterTimeoutID, getShowK, setShowK, getElementFromID, getMarkFromIDs, dateToTimeLabel, addToPageID, setPageID, getPageID, getTodaysPageID, getMarksFromIDAndName} from "./index.js"
import {deleteElement, putMark, putElement, postElement, getWithRoute} from "./index.js"
import * as Modal from "./modal.js"
var clickedRowButton = false;
var beforeSearchHTMLContent = "";
var uiInited = false;
var loadingTimeouts = [];

function showLoadingAnimation() {
  console.log("Showing loading animation: NOW!");
  let loadingAnimation = document.getElementById("loadingAnimation");
  loadingAnimation.style.display = "inherit";
  loadingAnimation.style.opacity = "100%";
  loadingAnimation.children[0].style.display = "absolute";
  loadingAnimation.children[1].style.display = "absolute";
  loadingAnimation.children[1].innerHTML = "Lade Daten...";
  loadingTimeouts[0] = setTimeout(() => {
    loadingAnimation.children[1].innerHTML = "Das Laden dauert länger als erwartet...";
  }, 4000);
  loadingTimeouts[1] = setTimeout(() => {
    loadingAnimation.children[1].innerHTML = "Fehlgeschlagen Besteht eine Internetverbindung?";
  }, 10000);
}

function hideLoadingAnimation() {
  let loadingAnimation = document.getElementById("loadingAnimation");
  loadingAnimation.style.display = "none";
  loadingAnimation.style.opacity = "0%";
  loadingTimeouts.forEach((timeout) => {
    clearTimeout(timeout);
  });

  // loadingAnimation.children[0].style.display = "none";
  // loadingAnimation.children[1].style.display = "none";
}

function showTimoutError() {

}

function createColl(id, text, content) {
  return `
  <div class="row" id="${id}">
  <div class="collapsible" >
    <div class="collapsibleArrow"></div>
    <p class="collapsibleP">${text}</p>
    <div class ="collapsibleMessage messageHide"></div>
    <div class="collapsibleStatus"></div>
    <div class="collapsibleEdit"></div>
  </div>
  <div class="content"> ${content} </div>
  <hr class="solid">
  </div>
  `;
}

function createRow(markID, isMarked, name, land, lastModifiedTime, hasNote) {
  return `
  <div class="checkboxRow" id=${markID} onclick=rowPressed(this)>
    <div class="checkbox ${(isMarked?"marked":"unmarked")}"></div>
    <p class="checkBoxLeftLabel">${name}${(land != ""?" - ": "") + land}</p>
    <div class="checkboxMessageDot ${hasNote?"":"noDot"}"></div>
    <p class="checkBoxRightLabel">${dateToTimeLabel(lastModifiedTime)}</p>
  </div>
  `;
}
// Called after the current page got loaded into the global var page
function renderPage() {
  if (getMasterTimeoutID != "") {
    clearTimeout(getMasterTimeoutID);
    setMasterTimeoutID("");
  }
  let page = data.page;
  let hersteller = data.hersteller;
  let kunden = data.kunden;
  let main = document.getElementsByTagName("main")[0];
  let searchInput = document.getElementById("searchInput");

  // Show the correct placeholder text inside searchbar
  searchInput.placeholder = getShowK() ? "Kunden suchen..." : "Hersteller suchen..."

  if (!(page && hersteller && kunden)) {
    console.error("Error initializing UI: Data field incomplete");
    return;
  }


  // main.innerHTML = `
  // <div class="col-sm-2">
  //   <div id="wave1">
  //   </div>
  // </div>
  //
  // <div class="searchBox">
  //   <input type="text" name="" value="" class="searchBox_input" placeholder="Suchen...">
  // </div>
  //
  // <div class="rowBox">
  //
  // </div>
  // `;

  let rowBox = document.getElementsByClassName("rowBox")[0];
  rowBox.innerHTML = "";
  let prim = getShowK() ? kunden : hersteller;

  console.log("Rendering page: ");
  console.log(page);
  console.log(hersteller);
  for (var i = 0; i < prim.length; i++) {
    if (prim[i].name == "Gesamt" && getShowK()) continue; // Gesamgt soll nicht als Row bei Kunden angezeigt werden
    let primElement = getElementFromID(prim[i]._id, getShowK() ? kunden : hersteller);
    let sec = prim[i].linkedIDs;
    var htmlContent = "";

    for (var j = 0; j < sec.length; j++) {
      let kID = getShowK() ? prim[i]._id : sec[j];
      let hID = getShowK() ? sec[j] : prim[i]._id;
      let mark = getMarkFromIDs(kID, hID, page.markierungen);
      let secElement = getElementFromID(sec[j], !getShowK() ? kunden : hersteller);
      htmlContent = htmlContent + createRow(mark._id, mark.isMarked, secElement.name, secElement.land?secElement.land:"", mark.lastModifiedTime, (secElement.notiz && secElement.notiz != ""));

    }

    var landString = "";
    if (!getShowK() && primElement.land != "") {
      landString = " - " + primElement.land;
    }
    let html = createColl(primElement._id, primElement.name + landString, htmlContent);


    // Gesamt wird immer ganz oben angezeigt
    if (prim[i].name == "Gesamt") {
      rowBox.innerHTML = html + rowBox.innerHTML;
    } else {
      rowBox.innerHTML = rowBox.innerHTML + html;
    }
  }
  configureRows();
  showPage();
}

function updateStatusCircle(row) {
  var totalMarksCount = 0;
  var checkedMarksCount = 0;

  let content_container = row.childNodes[3]
  let nodeArray = Array.from(content_container.childNodes);
  nodeArray.forEach((item, i) => {
    if (i % 2 == 1) {
      totalMarksCount++;
      if (item.childNodes[1].classList.contains("marked")) checkedMarksCount++;
    }
  });

  row.childNodes[1].childNodes[7].classList.remove("statusOpen");
  row.childNodes[1].childNodes[7].classList.remove("statusUndone");
  row.childNodes[1].childNodes[7].classList.remove("statuseDone");

  // console.log("total: " + totalMarksCount + " checked: " + checkedMarksCount);
  // console.log("totalMarksCount == checkedMarksCount : " + (totalMarksCount == checkedMarksCount));
  if (totalMarksCount == checkedMarksCount) {
    row.childNodes[1].childNodes[7].classList.add("statuseDone");
  } else if (checkedMarksCount > 0) {
    row.childNodes[1].childNodes[7].classList.add("statusUndone");
  } else {
    row.childNodes[1].childNodes[7].classList.add("statusOpen");
  }
}

function updateMessageCircle(row) {
  let messageCircle = row.children[0].children[2];
  let kunde = data.kunden.find(e => e._id == row.id);
  if (kunde.notiz && kunde.notiz != "") {
    messageCircle.classList.remove("messageHide");
    messageCircle.classList.remove("messageNew");
    messageCircle.classList.add("messageShow");
  }
}

function configureRows() {
  var coll = document.getElementsByClassName("collapsible");
  var rows = document.getElementsByClassName("row");
  for (var i = 0; i < rows.length; i++) {
    updateStatusCircle(rows[i]);
    if (getShowK()) updateMessageCircle(rows[i]);
  }

  for (i = 0; i < coll.length; i++) {

    coll[i].addEventListener("click", function() {
      if (clickedRowButton) {
        clickedRowButton = false
        return;
      }

      this.classList.toggle("active");
      var content = this.nextElementSibling;
      var children = this.children;
      var row = this;
      var messageCircle = children[2];
      var statusCircle = children[3];
      var editButton = children[4];

      // Ein/ausklappen des collapsible content
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }

      // Message Circle show/hide
      let showK = getShowK();
      if (showK && messageCircle.classList.contains("messageHide")) {
        messageCircle.classList.remove("messageHide");
        messageCircle.classList.add("messageNew");
        messageCircle.classList.remove("messageShow");
      } else if (showK && messageCircle.classList.contains("messageNew")) {
        messageCircle.classList.add("messageHide");
        messageCircle.classList.remove("messageNew");
        messageCircle.classList.remove("messageShow");
      }


      // EditButton show/hide
      // editButton.classList.toggle("collapsibleEditHide");
      // editButton.classList.toggle("collapsibleEditShow");

      // if (row.style.gridTemplateColumns == "50px auto 50px" || row.style.gridTemplateColumns == "") {
      //   console.log(children);
      //   row.style.gridTemplateColumns = "50px auto 65px 50px 50px";
      //   children[4].style.display = "inherit";
      //   if (getShowK()) {
      //     children[2].classList.remove("messageHide");
      //     children[2].classList.add("messageNew");
      //     children[2].classList.remove("messageShow");
      //   }
      // } else {
      //   row.style.gridTemplateColumns = "50px auto 50px";
      //   children[4].style.display = "none";
      //   if (getShowK()) {
      //     let kunde = getElementFromID(row.parentNode.id, data.kunden);
      //     if (!(kunde.message) || (kunde.message == "")) {
      //       children[2].classList.add("messageHide");
      //       children[2].classList.remove("messageNew");
      //       children[2].classList.remove("messageShow");
      //     }
      //   }
      // }

      if (children[0].style.transform == "rotateZ(180deg)") {
        children[0].style.transform = "rotateZ(90deg)";
      } else {
        children[0].style.transform = "rotateZ(180deg)";
      }

    });

    // Add addEventListener to message button
    var messageCircle = coll[i].children[2];
    messageCircle.addEventListener("click", function() {
      clickedRowButton = true;
      Modal.show_message_modal(this.parentNode.parentNode);
    })

    // Add addEventListener to edit button and hide it
    var editButton = coll[i].children[4];
    editButton.addEventListener("click", function() {
      clickedRowButton = true;
      Modal.show_edit_modal(this.parentNode.parentNode);
    });

    var statusCircle = coll[i].children[3];
    statusCircle.addEventListener("click", function() { // Mark all marks when status circle is pressed
      clickedRowButton = true;
      let rows = this.parentNode.parentNode.childNodes[3].childNodes;

      rows.forEach((row, i) => {
        if ((i % 2 == 1) && !(row.childNodes[1].classList.contains("marked"))) {
          rowPressed(row)
        }
      });

    });
  }
}





function showPage() {
  hideLoadingAnimation();
}

function hidePage() {
  let rowBox = document.getElementsByClassName("rowBox")[0];
  rowBox.innerHTML = "";
}

function filterBy(term) {
  if (!(data.kunden && data.hersteller && data.page)) return;

  var termsArray = term.split("_");





  let kunden = data.kunden.filter(k => (k.name.toLowerCase().includes(termsArray[0].toLowerCase())));
  let hersteller = data.hersteller.filter(h => (h.name.toLowerCase().includes(termsArray[0].toLowerCase()) || h.land.toLowerCase().includes(termsArray[0].toLowerCase())));
  var prim = [];
  var sec = [];
  var displayed = [];

  if (getShowK()) {
    prim = kunden;
    sec = hersteller;
  } else {
    prim = hersteller;
    sec = kunden;
  }

  console.log("Prim: ");
  console.log(prim);
  console.log("Sec: ");
  console.log(sec);
  if (termsArray.length == 1) {
    prim.forEach((item, i) => {
      displayed.push({
        primID: item._id,
        markIDs: getMarksFromIDAndName(item._id, "", data.page.markierungen, prim, [], getShowK())
      });
    });
  } else {
    console.log("Two search words: " + termsArray[0] + " and " + termsArray[1]);
    prim.forEach((item, i) => {
      displayed.push({
        primID: item._id,
        markIDs: getMarksFromIDAndName(item._id, termsArray[1], data.page.markierungen, prim, (getShowK() ? data.hersteller : data.kunden), getShowK())
      });
    });
  }

  console.log("Displayed: ");
  console.log(displayed);



  return displayed;
}

// Show only the rows with desired ids
function showOnly(elementArray) {
  // if (beforeSearchHTMLContent == "") { // Save the state before search began
  //   beforeSearchHTMLContent = document.getElementsByClassName("rowBox")[0].innerHTML;
  // }
  // document.getElementsByClassName("rowBox")[0].innerHTML = beforeSearchHTMLContent;
  renderPage();

  // If -1 means user deleted text from searchBar -> show everything again
  if (elementArray == -1) return;

  let rows = Array.from(document.getElementsByClassName("row"));
  console.log("elementArray:");
  console.log(elementArray);

  rows.forEach((row, i) => {
    let def = row.style.background;
    row.style.background = "green";
    var included = false;
    var index = null;
    // See if the row should be displayed
    for (var i = 0; i < elementArray.length; i++) {
      let element = elementArray[i];
      if (row.id == element.primID) {
        index = i;
        included = true;
        break;
      }
    }

    // if it is included, see which marks should be displayed
    if (included) {
      let marks = Array.from(row.children[1].children);
      marks.forEach((mark, i) => {
        if (!elementArray[index].markIDs.includes(mark.id)) {
          mark.style.display = "none";
        }
      });
    } else {
      console.log("Row: " + row.id + " hidden");
      row.style.display = "none";
    }
    row.style.background = def;
  });

  // for (var i = 0; i < rows.length; i++) {
  //   rows[i].style.display = "none";
  // }
  //
  // for (var i = 0; i < elementArray.length; i++) {
  //   rows.namedItem(elementArray[i]).style.display = "grid";
  // }
}

function rowPressed(row) {
  console.log("rowPressed with", row);
  let id = row.id;
  let mark = data.page.markierungen.find(e => {
    if (e._id == id) return e;
  });
  let checkbox = row.childNodes[1];
  checkbox.classList.toggle("marked");
  checkbox.classList.toggle("unmarked");

  mark.isMarked = !mark.isMarked;
  if (mark.isMarked) {
    mark.lastModifiedTime = Date.now();
  } else {
    mark.lastModifiedTime = -1;
  }

  console.log("Row pressed, row:");
  console.log(row.children);
  row.children[3].innerHTML = dateToTimeLabel(mark.lastModifiedTime)
  putMark(mark);
  updateStatusCircle(row.parentNode.parentNode);
}

function reloadUI() {
  let dateString = pageIDToDateString(getPageID());
  let dateField = document.getElementById("dateField");
  dateField.innerHTML = dateString;
  console.log("Hiding page");
  hidePage();
  console.log("Showing loading animation");
  showLoadingAnimation();

  console.log("Reload UI!");
  // Reload page, kunden and hersteller data
  getWithRoute("api/page/" + getPageID(), (fetchedData) => {
    // Show error if the data is missing
    // console.log("Got page data: ");
    // console.log(fetchedData);
    if (!(fetchedData)) {
      showTimoutError();
      return;
    }
    data.page = fetchedData;
    getWithRoute("api/", (fetchedData) => {
      // console.log("Got entity data: ");
      // console.log(fetchedData);
      // Show error if the data is missing
      if (!(fetchedData && fetchedData.kunden && fetchedData.hersteller)) {
        showTimoutError();
        return;
      }
      data.kunden = fetchedData.kunden;
      data.hersteller = fetchedData.hersteller;
      renderPage();
    }); // Fetch kunden & hersteller

  });
}

export default function initUI() {
  // Inits all the static parts of the page, only ran once the side loads
  if (uiInited) return;
  uiInited = true;

  let dateString = pageIDToDateString(getPageID());
  let dateField = document.getElementById("dateField");
  dateField.innerHTML = dateString;
  showLoadingAnimation();
  renderPage();


  var check = document.getElementsByClassName("checkboxRow");
  var addButton = document.getElementById("addButton");
  var searchButton = document.getElementById("searchButton");
  var searchBar = document.getElementsByClassName("searchBox_input")[0];
  var changeButton = document.getElementById("changeButton");
  var navButtonLeft = document.getElementsByClassName("buttonBox")[0].childNodes[3];
  var navButtonToday = document.getElementsByClassName("buttonBox")[0].childNodes[5];
  var navButtonRight = document.getElementsByClassName("buttonBox")[0].childNodes[7];
  var i;


  navButtonLeft.onclick = function() {
    setPageID(addToPageID(-1, getPageID()));
    reloadUI();
  }

  navButtonToday.onclick = function() {
    let todaysPageID = getTodaysPageID();
    if (getPageID() == todaysPageID) return;
    setPageID(todaysPageID);
    reloadUI();
  }

  navButtonRight.onclick = function() {
    setPageID(addToPageID(1, getPageID()));
    reloadUI();
  }

  // changeButton
  changeButton.onclick = function() {
    setShowK(!getShowK());
    this.classList.toggle("kView");
    this.classList.toggle("hView");
    renderPage();
  }

  // search bar user input changed
  searchBar.onkeyup = function() {
    showOnly((searchBar.value == "" ? -1 : (filterBy(searchBar.value))));
  };
  // Search Button
  searchButton.addEventListener("click", function() {
    var searchBox = document.getElementsByClassName("searchBox")[0];
    var searchBox_input = document.getElementsByClassName("searchBox_input")[0];
    if (searchBox.style.maxHeight == "0px" || searchBox.style.maxHeight == "") {
      searchBox.style.maxHeight = "100px";
      searchBox_input.focus();
    } else {
      searchBox.style.maxHeight = "0px";
    }
  });

  addButton.onclick = function() {
    Modal.show_add_modal();
  }

}


export {showTimoutError, initUI, reloadUI, rowPressed, updateMessageCircle}
window.rowPressed = rowPressed;
