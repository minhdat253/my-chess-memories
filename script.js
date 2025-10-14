// ===============================
// 🧩 TẠO BÀN CỜ
// ===============================
const boardEl = document.getElementById('board');
const files = ['a','b','c','d','e','f','g','h'];
const ranks = [8,7,6,5,4,3,2,1];
let isFlipped = false; // 👈 ĐẢM BẢO DÒNG NÀY CÓ MẶT

// Tạo 64 ô vuông thật (Giữ nguyên)
for (let r = 0; r < 8; r++) {
  for (let f = 0; f < 8; f++) {
    const square = document.createElement('div');
    square.className = 'square chess-square';
    const dark = (r + f) % 2 === 1;
    square.dataset.dark = dark ? 'true' : 'false';
    square.dataset.coord = files[f] + ranks[r];
    boardEl.appendChild(square);
  }
}

// ...
const squareCenterOffset = 100 / 16; // 6.25%

// Nhãn a–h (Hàng 1) - GIỮ NGUYÊN (Vẫn ở dưới)
files.forEach((f, i) => {
  const lbl = document.createElement('div');
  lbl.className = 'file-label';
  lbl.dataset.index = i; // 👈 Chỉ mục để tra cứu tọa độ
  const leftPosition = (i / 8) * 100 + squareCenterOffset;
  
  lbl.style.left = `${leftPosition}%`;
  lbl.style.bottom = `-35px`; // 👈 Đã điều chỉnh từ -25px xuống -35px
  lbl.textContent = f;
  boardEl.appendChild(lbl);
});

// Nhãn 1–8 (Rìa Trái) - ĐÃ SỬA
ranks.forEach((r, i) => {
  const lbl = document.createElement('div');
  lbl.className = 'rank-label';
  lbl.dataset.index = i; // 👈 Chỉ mục để tra cứu tọa độ
  const topPosition = (i / 8) * 100 + squareCenterOffset;
  
  lbl.style.top = `${topPosition}%`;
  lbl.style.left = `-35px`; // 👈 Đã điều chỉnh từ -25px sang -35px
  lbl.textContent = r;
  boardEl.appendChild(lbl);
});
// ... Phần còn lại của script.js giữ nguyên ...

// ✅ Chỉ lấy các ô thật (Giữ nguyên)
const allCoords = Array.from(boardEl.querySelectorAll('.chess-square')).map(s => s.dataset.coord);
// ... Phần còn lại của script.js giữ nguyên ...

// ===============================
// ♟️ HÀM XỬ LÝ QUÂN CỜ
// ===============================
function getSquare(coord) {
  return boardEl.querySelector(`.chess-square[data-coord='${coord}']`);
}

function clearPieces() {
  // Xóa toàn bộ phần tử .piece trên bàn
  boardEl.querySelectorAll('.piece').forEach(p => p.remove());
}

function placePiece(p) {
  const square = getSquare(p.coord);
  if (!square) return;
  const el = document.createElement('div');
  el.className = `piece ${p.color === 'w' ? 'white' : 'black'}`;
  el.style.backgroundImage = `url('pieces/${p.color}${p.type.toLowerCase()}.png')`;
  square.appendChild(el);
}

// ===============================
// ⚙️ MẢNG 32 QUÂN CỜ CHUẨN
// ===============================
const whitePieces = [
  {type:'R',color:'w'},{type:'N',color:'w'},{type:'B',color:'w'},{type:'Q',color:'w'},
  {type:'K',color:'w'},{type:'B',color:'w'},{type:'N',color:'w'},{type:'R',color:'w'},
  ...Array.from({length:8},()=>({type:'P',color:'w'}))
];
const blackPieces = [
  {type:'R',color:'b'},{type:'N',color:'b'},{type:'B',color:'b'},{type:'Q',color:'b'},
  {type:'K',color:'b'},{type:'B',color:'b'},{type:'N',color:'b'},{type:'R',color:'b'},
  ...Array.from({length:8},()=>({type:'P',color:'b'}))
];
const fullPieces = [...whitePieces, ...blackPieces];

// ===============================
// 🔀 TRỘN MẢNG (Fisher–Yates)
// ===============================
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===============================
// 🎲 RANDOM QUÂN LÊN BÀN
// ===============================
function randomize(n) {
  clearPieces(); // đảm bảo xóa sạch quân cũ

  const shuffledPieces = shuffle(fullPieces);
  const shuffledCoords = shuffle(allCoords);

  const count = Math.min(n, fullPieces.length);
  for (let i = 0; i < count; i++) {
    const piece = shuffledPieces[i];
    const coord = shuffledCoords[i];
    placePiece({type: piece.type, color: piece.color, coord});
  }
}

// ===============================
// ⬆️⬇️ LOGIC LẬT TỌA ĐỘ
// ===============================
function updateCoordinateLabels() {
  // 1. Xác định mảng tọa độ hiện tại (đảo ngược nếu đang lật)
  const currentFiles = isFlipped ? [...files].reverse() : files; 
  const currentRanks = isFlipped ? [...ranks].reverse() : ranks;
  
  // 2. Cập nhật nhãn cột (a-h)
  boardEl.querySelectorAll('.file-label').forEach(lbl => {
    const index = parseInt(lbl.dataset.index);
    lbl.textContent = currentFiles[index];
    // Dùng class CSS để chuyển vị trí (dưới -> trên)
    lbl.classList.toggle('flipped-coords', isFlipped); 
  });
  
  // 3. Cập nhật nhãn hàng (1-8)
  boardEl.querySelectorAll('.rank-label').forEach(lbl => {
    const index = parseInt(lbl.dataset.index);
    lbl.textContent = currentRanks[index];
    // Dùng class CSS để chuyển vị trí (trái -> phải)
    lbl.classList.toggle('flipped-coords', isFlipped); 
  });
}

function flipBoard() {
  isFlipped = !isFlipped;
  updateCoordinateLabels();
}
// ===============================
// 🧭 NÚT BẤM
// ===============================
const randomBtn = document.getElementById('randomBtn');
const clearBtn = document.getElementById('clearBtn');
const flipBtn = document.getElementById('flipBtn'); // 👈 ĐẢM BẢO LẤY NÚT NÀY
const countRange = document.getElementById('countRange');
const countLabel = document.getElementById('countLabel');

countRange.addEventListener('input', () => {
  countLabel.textContent = countRange.value;
});

randomBtn.addEventListener('click', () => {
  randomize(parseInt(countRange.value));
});
clearBtn.addEventListener('click', clearPieces);
flipBtn.addEventListener('click', flipBoard); // 👈 GÁN SỰ KIỆN

