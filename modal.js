var isShowingNote = false;
var isEditing = true;
var current_row = null;
var current_entry = {};
var timeoutID = "";

function hide_modal() {
  if (isShowingNote) {
    let id = current_row.id;
    // let kunde = getElementFromID(id, data.kunden);
    let textarea = document.getElementById("textarea");

    data.kunden.forEach((kunde, i) => {
      console.log(kunde);
      console.log(id);
      if (kunde._id == id) {
        kunde.notiz = textarea.value;
        putElement(kunde, true);
        console.log("Kunde: ");
        console.log(kunde);
      }
    });
    updateMessageCircle(current_row);
  }
  isShowingNote = false;
  var modal_bg = document.getElementsByClassName("modal_bg")[0];
  var modal = document.getElementById("modal");

  modal.style.opacity = "0%";
  modal.style.top = "90%";
  modal_bg.style.opacity = "0%";
}

function hide_modal_sucessfully() {
  var modal_bg = document.getElementsByClassName("modal_bg")[0];
  var modal = document.getElementById("modal");

  modal.style.opacity = "0%";
  modal.style.top = "10%";
  modal_bg.style.opacity = "0%";

  reloadUI();
}

function showModal() {
  var modal_bg = document.getElementsByClassName("modal_bg")[0];
  var modal = document.getElementById("modal");

  modal_bg.style.display = "inherit";
  modal_bg.style.opacity = "100%";

  modal.style.display = "grid";
  modal.style.top = "50%";
  modal.style.opacity = "100%";
}

function remove_object_after_animating_out() {
  console.log("remove_object_after_animating_out for ");
  console.log(this);
  console.log("This.style.opacity = ");
  if (this.style.opacity == "0%") {
    console.log("removed object " + this);
    this.style.display = "none";
  }
}

function newScrollboxItem(isInclude, id, name) {
  let scrollbox_item = document.createElement("div");
  let button = document.createElement("div");
  let nameLabel = document.createElement("p");

  scrollbox_item.id = id;
  scrollbox_item.isInclude = isInclude;
  scrollbox_item.classList.add("scrollbox_item");
  button.classList.add("modal_scrollbox_button");
  button.classList.add("modal_button_animation");
  button.classList.add((isInclude ? "modal_include_button" : "modal_exclude_button"));
  button.addEventListener("click", scrollbox_button_clicked);
  nameLabel.innerHTML = name;

  scrollbox_item.appendChild(button);
  scrollbox_item.appendChild(nameLabel);

  return scrollbox_item;
}

function scrollbox_button_clicked() {
  let isInclude = !this.parentNode.isInclude;
  let id = this.parentNode.id;
  let name = this.nextSibling.innerHTML;
  this.parentNode.remove();

  if (isInclude) {
    let index = current_entry.linkedIDs.indexOf(id);
    if (index > -1) current_entry.linkedIDs.splice(index, 1);
  } else {
    current_entry.linkedIDs.push(id)
  }


  let scrollbox_item = newScrollboxItem(isInclude, id, name);
  let scrollbox_included = document.getElementsByClassName(isInclude ? "scrollbox_excluded" : "scrollbox_included")[0];
  scrollbox_included.appendChild(scrollbox_item);
}

function modal_save_button_clicked() {
  var modal_input_name = document.getElementsByClassName('modal_body_left')[0].childNodes[1];
  var modal_input_land = document.getElementsByClassName('modal_body_left')[0].childNodes[3];
  current_entry.name = modal_input_name.value;
  if (!showK) current_entry.land = modal_input_land.value

  timeoutID = setTimeout(modal_upload_failed, 5000);
  modal_show_loading_animation();

  if (isEditing) {
    putElement(current_entry, showK, modal_upload_completed);
  } else {
    postElement(current_entry, showK, modal_upload_completed);
  }
}

function modal_delete_button_clicked() {
  deleteElement(current_entry._id, showK);
  setTimeout(hide_modal_sucessfully, 200);
}

function modal_upload_failed() {
  reloadUI();
  modal_hide_loading_animation();
  var modal_save_button = document.getElementsByClassName("blue_button")[0];
  modal_save_button.innerHTML = "Fehler!";
  setTimeout(hide_modal, 3000);
}
function modal_upload_completed(data) {
  clearTimeout(timeoutID);
  modal_hide_loading_animation();
  var modal_save_button = document.getElementsByClassName("blue_button")[0];
  modal_save_button.innerHTML = "Fertig ✓";
  setTimeout(hide_modal_sucessfully, 200);
}

function modal_show_loading_animation() {
  var modal_save_button = document.getElementsByClassName("blue_button")[0];
  modal_save_button.innerHTML = '<div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>'
}

function modal_hide_loading_animation() {
  var modal_save_button = document.getElementsByClassName("blue_button")[0];
  modal_save_button.innerHTML = "";
}

function initModal() {
  var modal_bg = document.getElementsByClassName("modal_bg")[0];
  var modal = document.getElementById("modal");
  var modal_close_button = document.getElementsByClassName("modal_close_button")[0];

  // var modal_input_land = document.getElementsByClassName('modal_body_left')[0].childNodes[7];

  // Modal backgrounde hide when click outside
  modal_bg.addEventListener("click", hide_modal);
  modal_bg.addEventListener("transitionend", remove_object_after_animating_out);
  modal_bg.addEventListener('webkitAnimationEnd',remove_object_after_animating_out);
  modal_bg.style.display = "none";
  modal_bg.style.opacity = "0%";

  modal.addEventListener("transitionend", remove_object_after_animating_out);
  modal.addEventListener('webkitAnimationEnd',remove_object_after_animating_out);
  modal.style.display = "none";
  modal.style.opacity = "0%";
  modal_close_button.addEventListener("click", hide_modal);

  if (isShowingNote) return; // dont init save button because Note modal does not have a save button

  var modal_save_button = document.getElementsByClassName("blue_button")[0];
  var modal_delete_button = document.getElementsByClassName("red_button")[0];
  var modal_input_name = document.getElementsByClassName('modal_body_left')[0].childNodes[3];
  var modal_searchbar = document.getElementsByClassName("modal_searchbar")[0];

  modal_searchbar.onkeyup = function() {
    modal_showOnly((modal_searchbar.value == "" ? -1 : (modal_filterBy(modal_searchbar.value))));
  }

  modal_save_button.onclick = function() {
    modal_save_button_clicked();
  };

  if (!isEditing) return; // If edit modal -> config delete button too

  modal_delete_button.onclick = function() {
    modal_delete_button_clicked();
    console.log("Delete!");
  }
}

function show_edit_modal(e) {
  isEditing = true;
  let callerID = e.id;

  current_entry = getElementFromID(callerID, (showK ? data.kunden : data.hersteller));

  var modal_headline = (showK ? "Kunde" : "Hersteller") + " bearbeiten";
  var modal_cancel_button_text = "Löschen";
  var modal_save_button_text = "Speichern";

  var modal_land_section = '<h2>Land</h2><input type="text" name="modal_input_name" value="" placeholder="(optional)"><p>Die Kombination aus Name und Land sollte den Hersteller eindeutig beschreiben. Beides kann nach dem Erstellen jederzeit angepasst werden.</p>';
  var modal_container_content = `<div class="modal_header"><h1 class="modal_headline">${modal_headline}</h1><div class="modal_close_button">x</div></div><div class="modal_body"><div class="modal_body_left"><h2>Name</h2><input type="text" name="modal_input_name" value="${current_entry.name}">${showK ? "" : modal_land_section}</div><div class="modal_body_right"><h2>Verknüpfte ${(!showK?"Kunden":"Hersteller")}</h2><div class="modal_body_right_scrollbox"><div class="scrollbox_included"></div><hr class="solid"><div class="scrollbox_excluded"></div></div><div class="modal_body_right_searchbox"><div></div><input class="modal_searchbar" type="text" name="" value="" placeholder="Nach ${showK?"Hersteller":"Kunde"} suchen"><!-- <div></div> --><div class="modal_include_button modal_searchbar_button modal_button_animation"></div><!-- <div></div> --></div><div></div><div class="modal_body_right_buttonbox"><button class="red_button modal_button modal_button_animation" name="button">${modal_cancel_button_text}</button><button class="blue_button modal_button modal_button_animation" name="button">${modal_save_button_text}</button></div></div></div>`;

  let modal = document.getElementById("modal");
  modal.innerHTML = modal_container_content;

  let scrollbox_excluded = document.getElementsByClassName("scrollbox_excluded")[0];
  let scrollbox_included = document.getElementsByClassName("scrollbox_included")[0];
  scrollbox_excluded.innerHTML = "";
  scrollbox_included.innerHTML = "";
  let prim = (!showK ? data.kunden : data.hersteller);
  let sec = (!showK ? data.hersteller : data.kunden);
  for (var i = 0; i < prim.length; i++) {
    let name = prim[i].name;
    let id = prim[i]._id;


    if (current_entry.linkedIDs.includes(id)) {
      let scrollbox_item = newScrollboxItem(false, id, name);
      scrollbox_included.appendChild(scrollbox_item);
    } else {
      let scrollbox_item = newScrollboxItem(true, id, name);
      scrollbox_excluded.appendChild(scrollbox_item);
    }
  }

  initModal(); // Connect funcs to buttons
  showModal();
}

function show_add_modal() {
  console.log("Show edit modal!");
  isEditing = false;
  current_entry = {
    name: "",
    lastModifiedTime: null,
    linkedIDs: []
  }

  var modal_headline = "Neuen " + (showK ? "Kunde" : "Hersteller") + " anlegen";
  var modal_save_button_text = "Speichern";

  var modal_land_section = '<h2>Land</h2><input type="text" name="modal_input_name" value="" placeholder="(optional)"><p>Die Kombination aus Name und Land sollte den Hersteller eindeutig beschreiben. Beides kann nach dem Erstellen jederzeit angepasst werden.</p>';
  var modal_container_content = `<div class="modal_header"><h1 class="modal_headline">${modal_headline}</h1><div class="modal_close_button">x</div></div><div class="modal_body"><div class="modal_body_left"><h2>Name</h2><input type="text" name="modal_input_name" value="">${showK ? "" : modal_land_section}</div><div class="modal_body_right"><h2>Verknüpfte ${(!showK?"Kunden":"Hersteller")}</h2><div class="modal_body_right_scrollbox"><div class="scrollbox_included"></div><hr class="solid"><div class="scrollbox_excluded"></div></div><div class="modal_body_right_searchbox"><div></div><input class="modal_searchbar" type="text" name="" value="" placeholder="Nach ${showK?"Hersteller":"Kunde"} suchen"><!-- <div></div> --><div class="modal_include_button modal_searchbar_button modal_button_animation"></div><!-- <div></div> --></div><div></div><div class="modal_body_right_buttonbox"><button class="blue_button modal_button modal_button_animation" name="button">${modal_save_button_text}</button></div></div></div>`;

  let modal = document.getElementById("modal");
  modal.innerHTML = modal_container_content;

  let scrollbox_excluded = document.getElementsByClassName("scrollbox_excluded")[0];
  scrollbox_excluded.innerHTML = "";
  let prim = (!showK ? data.kunden : data.hersteller);
  for (var i = 0; i < prim.length; i++) {
    let name = prim[i].name;
    let id = prim[i]._id;
    let scrollbox_item = newScrollboxItem(true, id, name);

    scrollbox_excluded.appendChild(scrollbox_item);
  }

  initModal();
  showModal();
}

function show_message_modal(row) {
  let kunde = getElementFromID(row.id, data.kunden);
  let notiz = kunde.notiz || ""
  current_row = row;
  isShowingNote = true;
  let content = `
  <div class="modal_header">
    <h1 class="modal_headline">Notiz</h1>
    <div class="modal_close_button">x</div>
  </div>
  <div class="modal_body_message">
    <textarea id="textarea" type="text" placeholder="Kunden Notiz anfügen">${notiz}</textarea>
  </div>
  `;
  let modal = document.getElementById("modal");
  modal.innerHTML = content;

  initModal();
  showModal();
}

function modal_showOnly(ids) {
  console.log("ids: " + ids.toString);
  let scrollbox_included = document.getElementsByClassName("scrollbox_included")[0];
  let scrollbox_excluded = document.getElementsByClassName("scrollbox_excluded")[0];
  let scrollboxes = [scrollbox_included, scrollbox_excluded];

  if (ids == -1) { // Empty searchBar -> clear search filter and show all
    for (var i = 0; i < scrollboxes.length; i++) {
      let children = Array.from(scrollboxes[i].children);
      children.forEach((item, i) => {
        item.style.display = "grid";
      });
    }
  } else { // show only certain ids
    for (var i = 0; i < scrollboxes.length; i++) {
      let children = Array.from(scrollboxes[i].children);
      children.forEach((item, i) => {
        if (!ids.includes(item.id)) {
          item.style.display = "none";
        } else {
          item.style.display = "grid";
        }
      });
    }
  }
}

function modal_filterBy(term) {
  let displayed = [];
  let prim = showK?data.hersteller:data.kunden;
  let results = prim.filter(e => (e.name.toLowerCase().includes(term.toLowerCase())));

  for (var i = 0; i < results.length; i++) {
    displayed.push(results[i]._id);
  }

  return displayed;
}

function modal_searchbar_button_clicked() {
  var searchbar = document.getElementsByClassName("modal_searchbar")[0];
  var button = document.getElementsByClassName("modal_searchbar_button")[0];
  if (searchbar.value && searchbar.value != "") {

  }
}
