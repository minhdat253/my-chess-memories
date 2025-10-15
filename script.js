// ===============================
// ♟️ KHỞI TẠO BÀN CỜ
// ===============================
const boardEl = document.getElementById("board");
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

for (let r = 0; r < 8; r++) {
  for (let f = 0; f < 8; f++) {
    const square = document.createElement("div");
    square.className = "square chess-square";
    const dark = (r + f) % 2 === 1;
    square.dataset.dark = dark ? "true" : "false";
    square.dataset.coord = `${files[f]}${ranks[r]}`;
    boardEl.appendChild(square);
  }
}

const squares = Array.from(boardEl.querySelectorAll(".chess-square"));
const allCoords = squares.map(s => s.dataset.coord);

// ===============================
// 🔧 BIẾN TOÀN CỤC
// ===============================
let currentPosition = {};
let gameState = "ready"; // ready | memorize | recall | finished
let timer = null;
let timeLeft = 60;
let customTime = 60;
let selectedPiece = { type: "Q", color: "w" };
let isFlipped = false;

// ===============================
// 🔗 THAM CHIẾU PHẦN TỬ
// ===============================
const timerEl = document.getElementById("timer");
const gameStatusEl = document.getElementById("game-status");
const randomBtn = document.getElementById("randomBtn");
const flipBtn = document.getElementById("flipBtn");
const clearBtn = document.getElementById("clearBtn");
const checkBtn = document.getElementById("checkBtn");
const countRange = document.getElementById("countRange");
const countLabel = document.getElementById("countLabel");
const timeInput = document.getElementById("timeInput");
const pieceSelectionBar = document.getElementById("piece-selection-bar");
const pieceOptionsEl = document.getElementById("piece-options");
const toggleColorBtn = document.getElementById("toggleColorBtn");

// ===============================
// 🧩 HÀM CHUNG
// ===============================
function getSquare(coord) {
  return boardEl.querySelector(`.chess-square[data-coord='${coord}']`);
}

function updateStatus(text) {
  gameStatusEl.textContent = text;
}

function updateTimerDisplay() {
  timerEl.textContent = `${timeLeft}s`;
  if (timeLeft <= 5) {
    timerEl.classList.add("low-time");
  } else {
    timerEl.classList.remove("low-time");
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function resetTimer() {
  stopTimer();
  timeLeft = customTime;
  updateTimerDisplay();
}

function startTimer() {
  stopTimer();
  timeLeft = customTime;
  updateTimerDisplay();
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      stopTimer();
      startRecall();
    }
  }, 1000);
}

// ===============================
// 🎲 RANDOM VỊ TRÍ QUÂN CỜ
// ===============================
const whitePieces = [
  { type: "R", color: "w" }, { type: "N", color: "w" }, { type: "B", color: "w" },
  { type: "Q", color: "w" }, { type: "K", color: "w" }, { type: "B", color: "w" },
  { type: "N", color: "w" }, { type: "R", color: "w" },
  ...Array.from({ length: 8 }, () => ({ type: "P", color: "w" }))
];
const blackPieces = [
  { type: "R", color: "b" }, { type: "N", color: "b" }, { type: "B", color: "b" },
  { type: "Q", color: "b" }, { type: "K", color: "b" }, { type: "B", color: "b" },
  { type: "N", color: "b" }, { type: "R", color: "b" },
  ...Array.from({ length: 8 }, () => ({ type: "P", color: "b" }))
];
const fullPieces = [...whitePieces, ...blackPieces];

function shuffle(arr) {
  return arr
    .map(x => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(a => a.x);
}

// placePiece: hỗ trợ đặt/xóa quân linh hoạt
function placePiece(arg1, arg2, arg3, force = false) {
  // Xác định dạng gọi
  let square, type, color;
  if (arg1 && arg1.nodeType) {
    // (square, type, color, force)
    square = arg1;
    type = arg2;
    color = arg3;
  } else if (arg1 && typeof arg1 === "object" && arg2 && arg2.nodeType) {
    // (pieceObj, square, force)
    const pieceObj = arg1;
    square = arg2;
    type = pieceObj.type;
    color = pieceObj.color;
    if (typeof arg3 === "boolean") force = arg3;
  } else {
    return;
  }

  // Chỉ cho phép đặt khi recall, trừ khi có flag force
  if (!force && gameState !== "recall") return;

  const existingPiece = square.querySelector(".piece:not(.original-piece)");

  if (existingPiece) {
    const existingType = existingPiece.dataset.type;
    const existingColor = existingPiece.dataset.color;

    // 🔹 Nếu đặt lại cùng quân → xóa (toggle)
    if (existingType === type && existingColor === color) {
      existingPiece.classList.add("fade-out");
      setTimeout(() => existingPiece.remove(), 150);
      return;
    } else {
      existingPiece.remove(); // khác thì thay thế
    }
  }

  // 🔹 Tạo quân mới
  const pieceEl = document.createElement("div");
  pieceEl.classList.add("piece");
  pieceEl.style.backgroundImage = `url('pieces/${color}${type.toLowerCase()}.png')`;
  pieceEl.dataset.type = type;
  pieceEl.dataset.color = color;
  square.appendChild(pieceEl);
}


function clearBoard() {
  squares.forEach(s => {
  s.classList.remove("correct-square", "wrong-square");
  const pieces = s.querySelectorAll(".piece");
  pieces.forEach(p => p.remove());
  });
  currentPosition = {};
  showOriginal = false;
  toggleOriginalBtn.classList.remove("active");
  stopTimer();
  resetTimer();
  updateStatus("Sẵn sàng");
  gameState = "ready";
  pieceSelectionBar.style.display = "none";
  checkBtn.style.display = "block";
  selectedPiece = { type: "Q", color: "w" };
  renderPieceOptions();
}


function randomize(n) {
  clearBoard();
  squares.forEach(s => s.classList.remove("correct-square", "wrong-square"));
  const shuffledPieces = shuffle(fullPieces);
  const shuffledCoords = shuffle(allCoords);
  const count = Math.min(n, fullPieces.length);
  const position = {};

  for (let i = 0; i < count; i++) {
    const p = shuffledPieces[i];
    const c = shuffledCoords[i];
    position[c] = { type: p.type, color: p.color };
    placePiece(getSquare(c), p.type, p.color, true);
  }

  currentPosition = position;
  startMemorize();
}

// ===============================
// ⏱️ PHA GHI NHỚ → KIỂM TRA
// ===============================
function startMemorize() {
  gameState = "memorize";
  updateStatus("Ghi nhớ trong...");
  startTimer();
}

function startRecall() {
  gameState = "recall";
  stopTimer();
  updateStatus("⏳ Đặt lại các quân cờ rồi nhấn Kiểm tra!");

  // ❌ Đừng dùng innerHTML = ''
  squares.forEach(s => {
    const pieces = s.querySelectorAll(".piece");
    pieces.forEach(p => p.remove());
  });

  pieceSelectionBar.style.display = "flex";
  renderPieceOptions();
}


function checkResult() {
  if (gameState === "memorize") {
    startRecall();
    return;
  }
  if (gameState !== "recall") return;

  let correct = 0;
  const total = Object.keys(currentPosition).length;
  const placedPieces = boardEl.querySelectorAll(".piece:not(.original-piece)");

  // Xóa hiệu ứng cũ trước khi kiểm tra
  squares.forEach(sq => sq.classList.remove("correct-square", "wrong-square"));

  // So sánh từng ô
  squares.forEach(sq => {
    const coord = sq.dataset.coord;
    const placed = sq.querySelector(".piece:not(.original-piece)");
    const correctPiece = currentPosition[coord];

    if (placed) {
      // 🔹 Có quân người chơi đặt
      if (
        correctPiece &&
        placed.dataset.type === correctPiece.type &&
        placed.dataset.color === correctPiece.color
      ) {
        // ✅ Đặt đúng quân
        sq.classList.add("correct-square");
        correct++;
      } else {
        // ❌ Đặt sai quân
        sq.classList.add("wrong-square");
      }
    } else if (correctPiece) {
      // 🔺 Ô gốc có quân nhưng người chơi bỏ trống → cũng sai
      sq.classList.add("wrong-square");
    }
  });

  updateStatus(`Kết quả: ${correct}/${total} đúng.`);
  gameState = "finished";
}



// Hiển thị hoặc ẩn thế cờ gốc khi nhấn biểu tượng 👁
const toggleOriginalBtn = document.getElementById("toggleOriginalBtn");
let showOriginal = false;

function toggleOriginalPosition() {
  showOriginal = !showOriginal;
  toggleOriginalBtn.classList.toggle("active", showOriginal);

  const playerPieces = boardEl.querySelectorAll(".piece:not(.original-piece)");

  if (showOriginal) {
    // 1️⃣ Ẩn quân người chơi
    playerPieces.forEach(p => (p.style.display = "none"));

    // 2️⃣ Ẩn hiệu ứng (chỉ tạm thời)
    boardEl.classList.add("hide-effects");

    // 3️⃣ Hiển thị thế cờ gốc rõ nét
    squares.forEach(sq => {
      sq.querySelectorAll(".original-piece").forEach(p => p.remove());
      const coord = sq.dataset.coord;
      const p = currentPosition[coord];
      if (p) {
        const el = document.createElement("div");
        el.className = "piece original-piece";
        el.style.backgroundImage = `url('pieces/${p.color}${p.type.toLowerCase()}.png')`;
        el.style.opacity = "1";
        el.style.pointerEvents = "none";
        sq.appendChild(el);
      }
    });
  } else {
    // 4️⃣ Tắt hiển thị thế cờ gốc, hiện lại quân người chơi và hiệu ứng
    document.querySelectorAll(".original-piece").forEach(p => p.remove());
    playerPieces.forEach(p => (p.style.display = ""));
    boardEl.classList.remove("hide-effects");
  }
}

toggleOriginalBtn.addEventListener("click", toggleOriginalPosition);



function showSolution() {
  for (const coord in currentPosition) {
    const sq = getSquare(coord);
    if (!sq.querySelector(".piece")) {
      const p = currentPosition[coord];
      placePiece(sq, p.type, p.color, true);
      sq.querySelector(".piece").style.border = "2px solid gold";
    }
  }
}

// ===============================
// 🧠 THANH CHỌN QUÂN
// ===============================
const pieceTypes = ["Q", "K", "R", "B", "N", "P"];

function renderPieceOptions() {
  pieceOptionsEl.innerHTML = "";
  pieceTypes.forEach(t => {
    const el = document.createElement("div");
    el.className = "piece-option";
    el.style.backgroundImage = `url('pieces/${selectedPiece.color}${t.toLowerCase()}.png')`;
    if (selectedPiece.type === t) el.classList.add("selected");
    el.addEventListener("click", () => selectPiece(t, selectedPiece.color));
    pieceOptionsEl.appendChild(el);
  });
  toggleColorBtn.textContent = `Đổi thành quân ${selectedPiece.color === "w" ? "Đen" : "Trắng"}`;
}

function selectPiece(type, color) {
  selectedPiece = { type, color };
  renderPieceOptions();
}

toggleColorBtn.addEventListener("click", () => {
  selectedPiece.color = selectedPiece.color === "w" ? "b" : "w";
  renderPieceOptions();
});

squares.forEach(sq => {
  sq.addEventListener("click", e => {
    if (gameState !== "recall") return;
    const coord = sq.dataset.coord;
    placePiece(sq, selectedPiece.type, selectedPiece.color);
  });
});

// ===============================
// 🔤 HIỂN THỊ NHÃN TỌA ĐỘ & ĐỔI HƯỚNG
// ===============================
function createLabels() {
  // Chỉ tạo nhãn 1 lần nếu chưa có
  if (document.querySelector(".file-label")) return;

  // Tạo nhãn file (a–h)
  files.forEach((f, i) => {
    const lbl = document.createElement("div");
    lbl.className = "file-label";
    lbl.dataset.fileIndex = i; // lưu thứ tự để flip
    lbl.textContent = f;
    const square = boardEl.querySelector(`[data-coord='${f}1']`); // hàng 1 (rank thấp nhất)
    if (square) square.appendChild(lbl);
  });

  // Tạo nhãn rank (1–8)
  ranks.slice().reverse().forEach((r, i) => {
    const lbl = document.createElement("div");
    lbl.className = "rank-label";
    lbl.dataset.rankIndex = i;
    lbl.textContent = r;
    const square = boardEl.querySelector(`[data-coord='a${r}']`); // cột a
    if (square) square.appendChild(lbl);
  });
}


function flipLabels() {
  isFlipped = !isFlipped;

  const fileLabels = document.querySelectorAll(".file-label");
  const rankLabels = document.querySelectorAll(".rank-label");

  const fileOrder = isFlipped ? [...files].reverse() : files;
  const rankOrder = isFlipped ? [...ranks].reverse() : ranks;

  fileLabels.forEach((lbl, i) => {
    lbl.textContent = fileOrder[i];
  });

  rankLabels.forEach((lbl, i) => {
    lbl.textContent = rankOrder[i];
  });
}


// ===============================
// 🎮 SỰ KIỆN
// ===============================
countRange.addEventListener("input", () => {
  countLabel.textContent = countRange.value;
});

timeInput.addEventListener("change", () => {
  const val = Math.max(5, parseInt(timeInput.value) || 5);
  customTime = val;
  resetTimer();
});

randomBtn.addEventListener("click", () => {
  resetTimer();
  randomize(parseInt(countRange.value));
});

clearBtn.addEventListener("click", clearBoard);
flipBtn.addEventListener("click", flipLabels);
checkBtn.addEventListener("click", checkResult);

// ===============================
// 🚀 KHỞI TẠO
// ===============================
createLabels();
resetTimer();
updateStatus("Sẵn sàng");
renderPieceOptions();
