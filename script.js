// ===== Global state =====
// Main in-memory data and UI selection state. Data is saved to localStorage.
let boards = [],
  currentBoardId = null,
  selectedCardId = null,
  selectedPersonId = null,
  selectedBasketPersonId = null,
  draggedCardId = null;

// ===== Storage key and UI text =====
// STORAGE_KEY separates the English and Hebrew versions in the browser.
const STORAGE_KEY = "kpopGoCardManagerBoardsV5_en",
  T = {
    noBoards: "No boards yet. Create a new board to start.",
    needBoard: "Please enter a board name.",
    cards: "cards",
    participants: "participants",
    deleteBoardConfirm: "Delete this board completely?",
    clearConfirm:
      "Clear this board? Cards and personal baskets will be deleted, but the board itself will stay.",
    needCardName: "Please enter a card name/ID.",
    needImage: "Please choose an image.",
    negQty: "Quantity cannot be negative.",
    badGrid: "Use at least one row and one column.",
    needPerson: "Please enter a name.",
    noPeople: "No personal baskets yet.",
    edit: "Edit",
    returnOne: "Return 1",
    noQty: "No quantity left for this card in the main pool.",
    deleteCardConfirm:
      "Delete this card completely? It will also be removed from all personal baskets.",
    emptyName: "Name cannot be empty.",
    deletePersonConfirm: "Delete this basket? All cards inside it will return to the main pool.",
    saved: "Saved!",
    invalidBackup: "Invalid backup file.",
    importConfirm: "Importing will replace current boards. Continue?",
    importSuccess: "Backup imported successfully.",
    importFail: "Could not read backup file.",
    notFound: "Image not found",
    qtyLabel: "Qty",
    more: "more",
    openBasket: "Open Full Basket",
    emptyBasket: "This basket is empty.",
    imageSaveFail:
      "Could not save the image. Try a smaller image or use an image already uploaded to the site.",
    fullImportConfirm: "Full backup import will replace and delete all current boards. Continue?",
    notesAvailable: "📝 Notes available - open full basket",
    invalidBoardFile: "Invalid board file.",
    boardImportConfirm: "Import this board as a new board?",
    boardImportSuccess: "Board imported successfully.",
    boardImportFail: "Could not import board.",
    copySuffix: "copy",
  };

// ===== DOM shortcuts =====
// $ is a tiny helper for document.getElementById. The constants below cache important HTML elements.
const $ = (id) => document.getElementById(id);
const homeScreen = $("homeScreen"),
  boardScreen = $("boardScreen"),
  newBoardNameInput = $("newBoardNameInput"),
  addBoardBtn = $("addBoardBtn"),
  boardsContainer = $("boardsContainer"),
  fullExportBtn = $("fullExportBtn"),
  fullImportInput = $("fullImportInput"),
  boardImportInput = $("boardImportInput"),
  backHomeBtn = $("backHomeBtn"),
  currentBoardTitle = $("currentBoardTitle"),
  editBoardNameBtn = $("editBoardNameBtn"),
  duplicateBoardBtn = $("duplicateBoardBtn"),
  deleteBoardBtn = $("deleteBoardBtn"),
  cardNameInput = $("cardNameInput"),
  cardQtyInput = $("cardQtyInput"),
  cardImageInput = $("cardImageInput"),
  embedImageCheckbox = $("embedImageCheckbox"),
  addCardBtn = $("addCardBtn"),
  personNameInput = $("personNameInput"),
  addPersonBtn = $("addPersonBtn"),
  gridRowsInput = $("gridRowsInput"),
  gridColsInput = $("gridColsInput"),
  rowLabelsInput = $("rowLabelsInput"),
  colLabelsInput = $("colLabelsInput"),
  updateGridBtn = $("updateGridBtn"),
  saveBtn = $("saveBtn"),
  exportBoardBtn = $("exportBoardBtn"),
  clearBoardBtn = $("clearBoardBtn"),
  mainCardsContainer = $("mainCardsContainer"),
  peopleContainer = $("peopleContainer"),
  cardModal = $("cardModal"),
  closeModalBtn = $("closeModalBtn"),
  modalCardName = $("modalCardName"),
  modalCardImage = $("modalCardImage"),
  modalQtyInput = $("modalQtyInput"),
  modalPeopleButtons = $("modalPeopleButtons"),
  increaseQtyBtn = $("increaseQtyBtn"),
  decreaseQtyBtn = $("decreaseQtyBtn"),
  setQtyBtn = $("setQtyBtn"),
  deleteCardBtn = $("deleteCardBtn"),
  prevCardBtn = $("prevCardBtn"),
  nextCardBtn = $("nextCardBtn"),
  editCardNameInput = $("editCardNameInput"),
  editCardImageInput = $("editCardImageInput"),
  editImageEmbedCheckbox = $("editImageEmbedCheckbox"),
  toggleEditCardBtn = $("toggleEditCardBtn"),
  editCardBox = $("editCardBox"),
  saveCardChangesBtn = $("saveCardChangesBtn"),
  personModal = $("personModal"),
  closePersonModalBtn = $("closePersonModalBtn"),
  editPersonNameInput = $("editPersonNameInput"),
  editPersonNotesInput = $("editPersonNotesInput"),
  savePersonNameBtn = $("savePersonNameBtn"),
  deletePersonBtn = $("deletePersonBtn"),
  boardNameModal = $("boardNameModal"),
  closeBoardNameModalBtn = $("closeBoardNameModalBtn"),
  editBoardNameInput = $("editBoardNameInput"),
  saveBoardNameBtn = $("saveBoardNameBtn"),
  basketModal = $("basketModal"),
  closeBasketModalBtn = $("closeBasketModalBtn"),
  basketModalTitle = $("basketModalTitle"),
  fullBasketContainer = $("fullBasketContainer"),
  basketNotesArea = $("basketNotesArea"),
  editBasketNotesBtn = $("editBasketNotesBtn");

// Create a unique id for boards, cards, and participants.
function id() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

// Return the currently opened board object.
function board() {
  return boards.find((b) => b.id === currentBoardId);
}

// Normalize imported board data so older backups still match the current structure.
function norm(b) {
  b.rowLabels = b.rowLabels || [];
  b.colLabels = b.colLabels || [];
  b.rows = b.rows || 5;
  b.cols = b.cols || 5;
  b.cards = b.cards || [];
  b.people = (b.people || []).map((p) => {
    p.items = p.items || [];
    p.notes = p.notes || "";
    return p;
  });
  return b;
}

// Save all boards to localStorage.
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
    return true;
  } catch (e) {
    alert(T.imageSaveFail);
    return false;
  }
}

// Escape text before inserting it into HTML to avoid broken markup.
function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Load boards from localStorage when the page starts.
function load() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) boards = JSON.parse(s).map(norm);
}

// Render the home screen with all existing boards.
function renderHome() {
  homeScreen.classList.remove("hidden");
  boardScreen.classList.add("hidden");
  boardsContainer.innerHTML = "";
  if (!boards.length) {
    boardsContainer.innerHTML = "<p>" + T.noBoards + "</p>";
    return;
  }
  for (const b of boards) {
    norm(b);
    const d = document.createElement("div");
    d.className = "board-card";
    d.innerHTML = `<h3>${esc(b.name)}</h3><p>${b.cards.length} ${T.cards}</p><p>${b.people.length} ${T.participants}</p>`;
    d.onclick = () => openBoard(b.id);
    boardsContainer.appendChild(d);
  }
}

// Create a new empty board from the home screen.
function addBoard() {
  const name = newBoardNameInput.value.trim();
  if (!name) {
    alert(T.needBoard);
    return;
  }
  boards.push({
    id: id(),
    name,
    rows: 5,
    cols: 5,
    rowLabels: [],
    colLabels: [],
    cards: [],
    people: [],
  });
  newBoardNameInput.value = "";
  save();
  renderHome();
}

// Open a selected board and switch from the home screen to the board screen.
function openBoard(bid) {
  currentBoardId = bid;
  const b = norm(board());
  homeScreen.classList.add("hidden");
  boardScreen.classList.remove("hidden");
  currentBoardTitle.textContent = b.name;
  gridRowsInput.value = b.rows;
  gridColsInput.value = b.cols;
  rowLabelsInput.value = "";
  colLabelsInput.value = "";
  renderBoard();
}

// Return to the home screen.
function showHome() {
  currentBoardId = selectedCardId = selectedPersonId = selectedBasketPersonId = null;
  [cardModal, personModal, boardNameModal, basketModal].forEach((m) => m.classList.add("hidden"));
  renderHome();
}

// Open the modal for editing the current board name.
function openBoardNameModal() {
  const b = board();
  if (!b) return;
  editBoardNameInput.value = b.name;
  boardNameModal.classList.remove("hidden");
}

// Save the edited board name.
function saveBoardName() {
  const b = board(),
    n = editBoardNameInput.value.trim();
  if (!n) {
    alert(T.emptyName);
    return;
  }
  b.name = n;
  currentBoardTitle.textContent = n;
  save();
  boardNameModal.classList.add("hidden");
}

// Delete the current board after confirmation.
function deleteCurrentBoard() {
  const b = board();
  if (!b || !confirm(T.deleteBoardConfirm)) return;
  boards = boards.filter((x) => x.id !== b.id);
  save();
  showHome();
}

// Clear cards and participants from the current board but keep the board itself.
function clearCurrentBoard() {
  const b = board();
  if (!b || !confirm(T.clearConfirm)) return;
  b.cards = [];
  b.people = [];
  save();
  renderBoard();
}

// Convert row/column label text into clean label arrays.
function parseLabels(s) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// Update the board grid size and optional row/column labels.
function updateGrid() {
  const b = board(),
    r = Number(gridRowsInput.value),
    c = Number(gridColsInput.value);
  if (r < 1 || c < 1) {
    alert(T.badGrid);
    return;
  }
  b.rows = r;
  b.cols = c;
  b.rowLabels = parseLabels(rowLabelsInput.value);
  b.colLabels = parseLabels(colLabelsInput.value);
  rowLabelsInput.value = "";
  colLabelsInput.value = "";
  save();
  renderBoard();
}

// Store an uploaded image either as browser data or as a lightweight images/ path.
function storeImageFromFile(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const maxSide = 800;
      let w = img.width,
        h = img.height;
      if (w > maxSide || h > maxSide) {
        if (w >= h) {
          h = Math.round((h * maxSide) / w);
          w = maxSide;
        } else {
          w = Math.round((w * maxSide) / h);
          h = maxSide;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      try {
        callback(canvas.toDataURL("image/jpeg", 0.75));
      } catch (err) {
        alert(T.imageSaveFail);
      }
    };
    img.onerror = function () {
      alert(T.imageSaveFail);
    };
    img.src = e.target.result;
  };
  reader.onerror = function () {
    alert(T.imageSaveFail);
  };
  reader.readAsDataURL(file);
}

// Validate card input and start adding a card image.
function addCard() {
  const b = board(),
    name = cardNameInput.value.trim(),
    qty = Number(cardQtyInput.value),
    file = cardImageInput.files[0];
  if (!name) {
    alert(T.needCardName);
    return;
  }
  if (!file) {
    alert(T.needImage);
    return;
  }
  if (qty < 0) {
    alert(T.negQty);
    return;
  }
  if (embedImageCheckbox.checked) {
    storeImageFromFile(file, (img) => finishAddCard(name, qty, img));
  } else finishAddCard(name, qty, "images/" + file.name);
}

// Find the first empty slot in the main board grid.
function firstPos(b) {
  const used = b.cards.map((c) => c.position);
  for (let i = 0; i < b.rows * b.cols; i++) if (!used.includes(i)) return i;
  b.rows++;
  gridRowsInput.value = b.rows;
  return b.rows * b.cols - 1;
}

// Add the prepared card object to the current board.
function finishAddCard(name, qty, image) {
  const b = board();
  b.cards.push({ id: id(), name, qty, image, position: firstPos(b) });
  cardNameInput.value = "";
  cardQtyInput.value = 0;
  cardImageInput.value = "";
  save();
  renderBoard();
}

// Add a participant / personal basket.
function addPerson() {
  const b = board(),
    name = personNameInput.value.trim();
  if (!name) {
    alert(T.needPerson);
    return;
  }
  b.people.push({ id: id(), name, items: [] });
  personNameInput.value = "";
  save();
  renderBoard();
}

// Re-render everything on the board screen.
function renderBoard() {
  renderMain();
  renderPeople();
}

// Render the main card pool grid.
function renderMain() {
  const b = norm(board());
  mainCardsContainer.innerHTML = "";
  mainCardsContainer.style.gridTemplateColumns = `90px repeat(${b.cols},96px)`;
  mainCardsContainer.appendChild(
    Object.assign(document.createElement("div"), { className: "grid-corner" }),
  );
  for (let c = 0; c < b.cols; c++) {
    const el = document.createElement("div");
    el.className = "grid-col-label";
    el.textContent = b.colLabels[c] || "";
    mainCardsContainer.appendChild(el);
  }
  for (let r = 0; r < b.rows; r++) {
    const lab = document.createElement("div");
    lab.className = "grid-row-label";
    lab.textContent = b.rowLabels[r] || "";
    mainCardsContainer.appendChild(lab);
    for (let c = 0; c < b.cols; c++) {
      const pos = r * b.cols + c,
        cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.position = pos;
      const card = b.cards.find((x) => x.position === pos);
      if (card) cell.appendChild(cardEl(card));
      cell.ondragover = (e) => {
        e.preventDefault();
        cell.classList.add("drag-over");
      };
      cell.ondragleave = () => cell.classList.remove("drag-over");
      cell.ondrop = (e) => dropCard(e, cell);
      mainCardsContainer.appendChild(cell);
    }
  }
}

// Build the HTML element for one card in the main grid.
function cardEl(card) {
  const d = document.createElement("div");
  d.className = "card-item" + (card.qty === 0 ? " out-of-stock" : "");
  d.draggable = true;
  d.dataset.cardId = card.id;
  d.innerHTML = `<img src="${card.image}" alt="${esc(card.name)}"><div class="card-name">${esc(card.name)}</div><div class="card-qty">${T.qtyLabel}: ${card.qty}</div><div class="card-mini-buttons"><button class="minus-main">-1</button><button class="plus-main">+1</button></div>`;
  d.querySelector("img").onclick = () => openCardModal(card.id);
  d.querySelector("img").onerror = function () {
    this.alt = T.notFound;
  };
  d.querySelector(".plus-main").onclick = (e) => {
    e.stopPropagation();
    card.qty++;
    save();
    renderBoard();
  };
  d.querySelector(".minus-main").onclick = (e) => {
    e.stopPropagation();
    if (card.qty > 0) card.qty--;
    save();
    renderBoard();
  };
  d.ondragstart = () => (draggedCardId = card.id);
  return d;
}

// Handle drag-and-drop placement of a card inside the grid.
function dropCard(e, cell) {
  e.preventDefault();
  cell.classList.remove("drag-over");
  const b = board(),
    pos = Number(cell.dataset.position),
    drag = b.cards.find((c) => c.id === draggedCardId),
    target = b.cards.find((c) => c.position === pos);
  if (!drag) return;
  if (target && target.id !== drag.id) {
    const old = drag.position;
    drag.position = pos;
    target.position = old;
  } else drag.position = pos;
  draggedCardId = null;
  save();
  renderBoard();
}

// Build the small card preview used inside participant baskets.
function pCardHtml(card, item, pid) {
  return `<div class="person-card"><img src="${card.image}" alt="${esc(card.name)}"><div class="small-text">${esc(card.name)}</div><div class="small-text">x${item.qty}</div><button onclick="returnOneCardToMain('${pid}','${item.cardId}')">${T.returnOne}</button></div>`;
}

// Render all participant baskets below the main grid.
function renderPeople() {
  const b = board();
  peopleContainer.innerHTML = "";
  if (!b.people.length) {
    peopleContainer.innerHTML = "<p>" + T.noPeople + "</p>";
    return;
  }
  for (const p of b.people) {
    let items = p.items.length > 6 ? p.items.slice(0, 5) : p.items.slice(0, 6);
    let html = items
      .map((it) => {
        const c = b.cards.find((x) => x.id === it.cardId);
        return c ? pCardHtml(c, it, p.id) : "";
      })
      .join("");
    if (p.items.length > 6) {
      const it = p.items[5],
        c = b.cards.find((x) => x.id === it.cardId),
        more = p.items.length - 5;
      if (c)
        html += `<div class="person-card more-card" onclick="openBasketModal('${p.id}')"><img src="${c.image}" alt="${esc(c.name)}"><span class="more-text">+${more} ${T.more}</span></div>`;
    }
    const d = document.createElement("div");
    d.className = "person-box";
    d.innerHTML = `<div class="person-header"><h3>${esc(p.name)}</h3><button onclick="openPersonModal('${p.id}')">${T.edit}</button></div>${p.notes ? `<div class="person-note-indicator">${T.notesAvailable}</div>` : ""}<div class="person-cards">${html}</div><button class="open-basket-btn" onclick="openBasketModal('${p.id}')">${T.openBasket}</button>`;
    peopleContainer.appendChild(d);
  }
}

// Open a full participant basket with notes and all assigned cards.
function openBasketModal(pid) {
  const p = board().people.find((x) => x.id === pid);
  selectedBasketPersonId = pid;
  basketModalTitle.textContent = p.name;
  if (p.notes) {
    basketNotesArea.textContent = p.notes;
    basketNotesArea.classList.remove("hidden");
  } else {
    basketNotesArea.textContent = "";
    basketNotesArea.classList.add("hidden");
  }
  renderFullBasket(p);
  basketModal.classList.remove("hidden");
}

// Render the contents of the full basket modal.
function renderFullBasket(p) {
  const b = board();
  fullBasketContainer.innerHTML = "";
  if (!p || !p.items.length) {
    fullBasketContainer.innerHTML = "<p>" + T.emptyBasket + "</p>";
    return;
  }
  for (const it of p.items) {
    const c = b.cards.find((x) => x.id === it.cardId);
    if (!c) continue;
    const w = document.createElement("div");
    w.innerHTML = pCardHtml(c, it, p.id);
    fullBasketContainer.appendChild(w.firstElementChild);
  }
}

// Close the participant basket modal and save notes.
function closeBasketModal() {
  selectedBasketPersonId = null;
  basketModal.classList.add("hidden");
}

// Open the card details modal for viewing/editing one card.
function openCardModal(cid) {
  const c = board().cards.find((x) => x.id === cid);
  selectedCardId = cid;
  modalCardName.textContent = c.name;
  modalCardImage.src = c.image;
  modalQtyInput.value = c.qty;
  editCardNameInput.value = c.name;
  editCardImageInput.value = "";
  editImageEmbedCheckbox.checked = false;
  editCardBox.classList.add("hidden");
  renderModalPeopleButtons();
  cardModal.classList.remove("hidden");
}

// Render buttons for assigning the selected card to participants.
function renderModalPeopleButtons() {
  const b = board();
  modalPeopleButtons.innerHTML = "";
  if (!b.people.length) {
    modalPeopleButtons.textContent = T.noPeople;
    return;
  }
  for (const p of b.people) {
    const btn = document.createElement("button");
    btn.textContent = p.name;
    btn.onclick = () => giveToPerson(p.id);
    modalPeopleButtons.appendChild(btn);
  }
}

// Return the currently selected card object.
function selectedCard() {
  return board().cards.find((c) => c.id === selectedCardId);
}

// Move one copy of the selected card from the main pool to a participant basket.
function giveToPerson(pid) {
  const c = selectedCard(),
    p = board().people.find((x) => x.id === pid);
  if (c.qty <= 0) {
    alert(T.noQty);
    return;
  }
  c.qty--;
  let it = p.items.find((x) => x.cardId === c.id);
  if (it) it.qty++;
  else p.items.push({ cardId: c.id, qty: 1 });
  save();
  renderBoard();
  openCardModal(c.id);
}

// Update the main quantity of the selected card.
function setQty() {
  const c = selectedCard(),
    q = Number(modalQtyInput.value);
  if (q < 0) {
    alert(T.negQty);
    return;
  }
  c.qty = q;
  save();
  renderBoard();
  openCardModal(c.id);
}

// Save card name/image edits from the modal.
function saveCardChanges() {
  const c = selectedCard(),
    n = editCardNameInput.value.trim(),
    file = editCardImageInput.files[0];
  if (n) c.name = n;
  if (file) {
    if (editImageEmbedCheckbox.checked) {
      storeImageFromFile(file, (img) => {
        c.image = img;
        save();
        renderBoard();
        openCardModal(c.id);
      });
      return;
    } else c.image = "images/" + file.name;
  }
  save();
  renderBoard();
  openCardModal(c.id);
}

// Delete the selected card from the board and all baskets.
function deleteSelectedCard() {
  const b = board();
  if (!confirm(T.deleteCardConfirm)) return;
  b.cards = b.cards.filter((c) => c.id !== selectedCardId);
  for (const p of b.people) p.items = p.items.filter((i) => i.cardId !== selectedCardId);
  cardModal.classList.add("hidden");
  save();
  renderBoard();
}

// Return cards in a stable order for previous/next navigation.
function sortedCards() {
  return [...board().cards].sort((a, b) => a.position - b.position);
}

// Move to the previous or next card in the modal.
function navCard(step) {
  const arr = sortedCards(),
    i = arr.findIndex((c) => c.id === selectedCardId);
  if (i < 0 || !arr.length) return;
  openCardModal(arr[(i + step + arr.length) % arr.length].id);
}

// Open the participant edit modal.
function openPersonModal(pid) {
  selectedPersonId = pid;
  const p = board().people.find((x) => x.id === pid);
  editPersonNameInput.value = p.name;
  editPersonNotesInput.value = p.notes || "";
  personModal.classList.remove("hidden");
}

// Save participant name and notes.
function savePersonName() {
  const p = board().people.find((x) => x.id === selectedPersonId),
    n = editPersonNameInput.value.trim();
  if (!n) {
    alert(T.emptyName);
    return;
  }
  p.name = n;
  p.notes = editPersonNotesInput.value.trim();
  save();
  renderBoard();
  if (selectedBasketPersonId === p.id) openBasketModal(p.id);
  personModal.classList.add("hidden");
}

// Delete a participant and return their cards to the main pool.
function deleteSelectedPerson() {
  const b = board(),
    p = b.people.find((x) => x.id === selectedPersonId);
  if (!confirm(T.deletePersonConfirm)) return;
  for (const it of p.items) {
    const c = b.cards.find((x) => x.id === it.cardId);
    if (c) c.qty += it.qty;
  }
  b.people = b.people.filter((x) => x.id !== p.id);
  save();
  renderBoard();
  personModal.classList.add("hidden");
}

// Return one assigned card from a participant basket back to the main pool.
function returnOneCardToMain(pid, cid) {
  const b = board(),
    p = b.people.find((x) => x.id === pid),
    c = b.cards.find((x) => x.id === cid),
    it = p.items.find((x) => x.cardId === cid);
  if (!it) return;
  it.qty--;
  c.qty++;
  if (it.qty <= 0) p.items = p.items.filter((x) => x.cardId !== cid);
  save();
  renderBoard();
  if (selectedBasketPersonId === pid) renderFullBasket(p);
}

// Download a JSON backup of all boards.
function exportFullBackup() {
  const blob = new Blob([JSON.stringify(boards, null, 2)], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "go-card-manager-full-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import a full JSON backup and replace all current boards.
function importFullBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = (x) => {
    try {
      const data = JSON.parse(x.target.result);
      if (!Array.isArray(data)) {
        alert(T.invalidBackup);
        return;
      }
      if (!confirm(T.fullImportConfirm)) return;
      boards = data.map(norm);
      save();
      showHome();
      alert(T.importSuccess);
    } catch {
      alert(T.importFail);
    }
  };
  r.readAsText(file);
  fullImportInput.value = "";
}

// ===== Event handlers =====
// Connect buttons, file inputs, and modals to the functions above.
addBoardBtn.onclick = addBoard;
fullExportBtn.onclick = exportFullBackup;
fullImportInput.onchange = importFullBackup;
boardImportInput.onchange = importBoardBackup;
backHomeBtn.onclick = showHome;
editBoardNameBtn.onclick = openBoardNameModal;
duplicateBoardBtn.onclick = duplicateCurrentBoard;
deleteBoardBtn.onclick = deleteCurrentBoard;
addCardBtn.onclick = addCard;
addPersonBtn.onclick = addPerson;
updateGridBtn.onclick = updateGrid;
saveBtn.onclick = () => {
  save();
  alert(T.saved);
};
exportBoardBtn.onclick = exportCurrentBoard;
clearBoardBtn.onclick = clearCurrentBoard;
closeModalBtn.onclick = () => cardModal.classList.add("hidden");
increaseQtyBtn.onclick = () => {
  const c = selectedCard();
  c.qty++;
  save();
  renderBoard();
  openCardModal(c.id);
};
decreaseQtyBtn.onclick = () => {
  const c = selectedCard();
  if (c.qty > 0) c.qty--;
  save();
  renderBoard();
  openCardModal(c.id);
};
setQtyBtn.onclick = setQty;
deleteCardBtn.onclick = deleteSelectedCard;
prevCardBtn.onclick = () => navCard(-1);
nextCardBtn.onclick = () => navCard(1);
toggleEditCardBtn.onclick = () => editCardBox.classList.toggle("hidden");
saveCardChangesBtn.onclick = saveCardChanges;
closePersonModalBtn.onclick = () => personModal.classList.add("hidden");
savePersonNameBtn.onclick = savePersonName;
deletePersonBtn.onclick = deleteSelectedPerson;
closeBoardNameModalBtn.onclick = () => boardNameModal.classList.add("hidden");
saveBoardNameBtn.onclick = saveBoardName;
closeBasketModalBtn.onclick = closeBasketModal;
editBasketNotesBtn.onclick = () => {
  if (selectedBasketPersonId) openPersonModal(selectedBasketPersonId);
};

// ===== App startup =====
// Load saved data and render the home screen when the script runs.
load();
renderHome();

// Create a non-conflicting name for an imported/duplicated board.
function makeUniqueBoardName(baseName) {
  const names = boards.map((b) => b.name);
  let name = `${baseName} (${T.copySuffix})`,
    i = 2;
  while (names.includes(name)) {
    name = `${baseName} (${T.copySuffix} ${i})`;
    i++;
  }
  return name;
}

// Duplicate the current board as a new board.
function duplicateCurrentBoard() {
  const b = board();
  if (!b) return;
  const d = JSON.parse(JSON.stringify(b));
  d.id = id();
  d.name = makeUniqueBoardName(b.name);
  const map = {};
  d.cards = d.cards.map((c, i) => {
    const nid = id();
    map[b.cards[i].id] = nid;
    return { ...c, id: nid };
  });
  d.people = d.people.map((p) => ({
    ...p,
    id: id(),
    items: p.items.map((it) => ({ ...it, cardId: map[it.cardId] || it.cardId })),
  }));
  boards.push(norm(d));
  save();
  showHome();
}

// Download a JSON backup of the current board only.
function exportCurrentBoard() {
  const b = board();
  if (!b) return;
  const blob = new Blob([JSON.stringify(norm(b), null, 2)], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = (b.name || "board").replace(/[^a-z0-9א-ת_-]+/gi, "_") + "-board-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import one board without deleting existing boards.
function importBoardBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = (x) => {
    try {
      const b = norm(JSON.parse(x.target.result));
      if (!b || !Array.isArray(b.cards) || !Array.isArray(b.people)) {
        alert(T.invalidBoardFile);
        return;
      }
      if (!confirm(T.boardImportConfirm)) return;
      b.id = id();
      b.name = makeUniqueBoardName(b.name || "Imported Board");
      boards.push(b);
      save();
      renderHome();
      alert(T.boardImportSuccess);
    } catch {
      alert(T.boardImportFail);
    }
  };
  r.readAsText(file);
  boardImportInput.value = "";
}
