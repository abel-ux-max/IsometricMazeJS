//Create an offscreen canvas. This is where we will actually be drawing,
//in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement("canvas");
let offScreenCTX = offScreenCVS.getContext("2d");

//Set the dimensions of the drawing canvas
let size = 30;
offScreenCVS.width = size;
offScreenCVS.height = size;

let mazeColor = "#3e9e3e";

//---------Canvas as Background-----------//
const isMobile = window.innerWidth <= 768;
let bg = document.querySelector(".bg"),
  bgCtx = bg.getContext("2d"),

  //sharpen * 2.5
  bgw = (bg.width = window.innerWidth * 2.5);
bgh = (bg.height = window.innerHeight * 2.5);
bg.style.width = (window.innerWidth / 1.2) + "px";
bg.style.height = (window.innerHeight / 1.2) + "px";

// bgCtx.imageSmoothingEnabled = false;
// bgCtx.drawImage(offScreenCVS,0,0, 1000, 1000)
//draw bg
// bgCtx.fillStyle = "#282c34"
// bgCtx.fillRect(0,0,bgw,bgh)
// let yO = bgh*-0.7;

let xO = bgw * 0.5;
let yO = bgh * 0.1;
let cellSize = isMobile ? 22 : 44;
let perspective = 0.8;
let grid = [];
let timerSecond;
let timerInterval;

const colorOptions = [
  { label: "Gold", value: "#FFD700" },
  { label: "Cyan", value: "#00FFFF" },
  { label: "Orange", value: "#FF6600" },
  { label: "Pink", value: "#FF69B4" },
  { label: "Green", value: "#71d171" },
];



Swal.fire({
  title: "MAZE GAME",
  html: `
    <p style="color:#71d171; font-family:'Audiowide',sans-serif; margin-bottom:16px;">Choose your cube colour</p>
    <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
      ${colorOptions.map(c => `
        <div class="color-pick" data-color="${c.value}" style="
          width:44px; height:44px; background:${c.value};
          border-radius:6px; cursor:pointer; border: 3px solid transparent;
          transition: border 0.2s;
        " title="${c.label}"></div>
      `).join("")}
    </div>
    <p id="picked-label" style="color:#aaa; font-family:'Audiowide',sans-serif; margin-top:12px; font-size:0.85em;">None selected</p>
  `,
  background: "#1e2127",
  color: "#71d171",
  confirmButtonText: "START",
  confirmButtonColor: "#71d171",
  allowOutsideClick: false,
  didOpen: () => {
    window._selectedColor = player.color; // store globally
    document.querySelectorAll(".color-pick").forEach(el => {
      el.addEventListener("click", () => {
        document.querySelectorAll(".color-pick").forEach(e => e.style.border = "3px solid transparent");
        el.style.border = "3px solid white";
        window._selectedColor = el.dataset.color; // update global on click
        document.getElementById("picked-label").textContent = el.title;
      });
    });

  },
  preConfirm: () => {
    return window._selectedColor; // return chosen colour
  }
}).then((result) => {

  backgroundMusicSfx();
  player.color = result.value; // setting to the selected colour before initializing the player and maze
  timerSeconds = 0;
  timerInterval = setInterval(() => {
    timerSeconds++;
    document.getElementById("timer").textContent = `Time: ${timerSeconds}s`;
  }, 1000);
  initMaze();
});


let player = {
  x: 1,
  y: 1,
  color: "#71d171"  // default to original green if somehow no selection;
}

let startPoint = {
  x: 1,
  y: 1,
  color: "#00FF00"  // Green
}

let endPoint = {
  x: 30,
  y: 30,
  color: "#FF0000"  // Red
}

// Colour picker at start


// Eller's algorithm
function generateEllerMaze() {
  offScreenCTX.fillStyle = "black";
  offScreenCTX.fillRect(0, 0, offScreenCVS.width, offScreenCVS.height);
  let imageData = offScreenCTX.getImageData(
    0,
    0,
    offScreenCVS.width,
    offScreenCVS.height
  );

  let cells = [];
  //Generate Maze
  for (let y = 0; y < imageData.height; y++) {
    if (y % 2 === 0) {
      continue;
    }
    //Step 1: Initialize empty row if it doesn't exist
    let rowSets = {};
    if (!cells[y]) {
      cells[y] = [];
    }
    for (let x = 0; x < imageData.width; x++) {
      if (x % 2 === 0) {
        continue;
      }

      if (!cells[y][x]) {
        //Step 2: create each cell in this row if it doesn't exist yet, assign a unique set
        let setID = `${y}${x}`;
        let uniqueSet = new Set();
        let cell = { x: x, y: y, set: setID, connections: {} };
        cells[y][x] = cell;
        //add to set
        uniqueSet.add(cell);
        //add to row sets
        rowSets[setID] = uniqueSet;
      } else {
        //add existing cells to row sets
        let cell = cells[y][x];
        if (rowSets[cell.set]) {
          rowSets[cell.set].add(cell);
        } else {
          let uniqueSet = new Set();
          uniqueSet.add(cell);
          rowSets[cell.set] = uniqueSet;
        }
      }
    }
    function removeWall() {
      return Math.random() > 0.5;
    }
    //Step 3: Create right connections
    cells[y].forEach((c) => {
      let rightCell = cells[y][c.x + 2];
      //if right cell are in different sets, check remove wall
      if (rightCell) {
        if (c.set !== rightCell.set) {
          if (removeWall() || y === imageData.height - 1) {
            //open the right path
            c.connections.right = true;
            let oldSet = rightCell.set;
            //merge right cell's set into left cell's set
            rowSets[oldSet].forEach((rc) => {
              rc.set = c.set;
              rowSets[c.set].add(rc);
            });
            delete rowSets[oldSet];
          }
        }
      }
    });
    //Step 4: Create down connections
    //only continue if not on last row
    if (y < imageData.height - 1) {
      Object.entries(rowSets).forEach((kv) => {
        let connects = 0;
        let last;
        let thisSet = kv[1];
        let thisSetID = kv[0];
        //if set only has one entry, create a path down
        thisSet.forEach((c) => {
          //check removeWall or if this is the last row of the maze
          if (removeWall() || thisSet.size === 1) {
            //open the down path
            c.connections.down = true;
            connects += 1;
            if (!cells[y + 2]) {
              cells[y + 2] = [];
            }
            let downCell = {
              x: c.x,
              y: y + 2,
              set: thisSetID,
              connections: {}
            };
            cells[y + 2][c.x] = downCell;
          }
          last = c;
        });
        //make sure at least one connects
        if (connects === 0) {
          //open the down path
          last.connections.down = true;
          if (!cells[y + 2]) {
            cells[y + 2] = [];
          }
          let downCell = {
            x: last.x,
            y: y + 2,
            set: thisSetID,
            connections: {}
          };
          cells[y + 2][last.x] = downCell;
        }
      });
    }
  }
  //draw
  let j = 1;
  function recursiveDrawMaze() {
    cells[j].forEach((c) => {
      if (c) {
        offScreenCTX.clearRect(c.x, c.y, 1, 1);
        if (c.connections.right) {
          offScreenCTX.clearRect(c.x + 1, c.y, 1, 1);
        }
        if (c.connections.down) {
          offScreenCTX.clearRect(c.x, c.y + 1, 1, 1);
        }
      }
    });
    j += 2;
    if (j < cells.length) {
      recursiveDrawMaze();
    }
  }
  recursiveDrawMaze();

  // Generate random entrance and exit at odd indices (where cells actually exist)
  let entranceX = 1 + Math.floor(Math.random() * ((offScreenCVS.width - 2) / 2)) * 2;
  let exitX = 1 + Math.floor(Math.random() * ((offScreenCVS.width - 2) / 2)) * 2;

  // Carve entrance at top (y=0) at entranceX
  offScreenCTX.clearRect(entranceX, 0, 1, 1);

  // Carve exit at bottom (y=height-1) at exitX
  offScreenCTX.clearRect(exitX, imageData.height - 1, 1, 1);

  return { entranceX, exitX };
}



function get2DArray() {
  //Make the 2D array to hold all objects
  for (let i = 0; i < offScreenCVS.height + 1; i++) {
    grid[i] = [];
    for (let j = 0; j < offScreenCVS.width + 1; j++) {
      grid[i][j] = {
        color: mazeColor,
        cost: 1,
        type: "free",
        x: j,
        y: i,
        gCost: 0,
        hCost: 0,
        fCost: 0
      };
    }
  }
  let imageData = offScreenCTX.getImageData(
    0,
    0,
    offScreenCVS.width,
    offScreenCVS.height
  );
  for (let i = 0; i < imageData.data.length; i += 4) {
    let x = (i / 4) % offScreenCVS.width,
      y = (i / 4 - x) / offScreenCVS.width;
    let color = `rgba(${imageData.data[i]}, ${imageData.data[i + 1]}, ${imageData.data[i + 2]
      }, ${imageData.data[i + 3]})`;
    switch (color) {
      case "rgba(0, 0, 0, 255)":
        //black pixel
        grid[y][x].color = mazeColor;
        break;
      default:
        //transparent pixel
        grid[y][x].color = "transparent";
    }
  }
}

function initMaze() {

  let mazeData = generateEllerMaze();
  get2DArray();
  // Set start and end points based on generated entrance/exit
  startPoint.x = mazeData.entranceX;
  startPoint.y = 0;
  endPoint.x = mazeData.exitX;
  endPoint.y = offScreenCVS.height;

  // Ensure entrance and exit walls are removed
  grid[startPoint.y][startPoint.x].color = "transparent";
  grid[endPoint.y][endPoint.x].color = "transparent";

  // Debug: Log entrance and exit info
  console.log("=== MAZE GENERATION DEBUG ===");
  console.log("Entrance at:", startPoint.x, startPoint.y, "| Color:", grid[startPoint.y][startPoint.x].color);
  console.log("Exit at:", endPoint.x, endPoint.y, "| Color:", grid[endPoint.y][endPoint.x].color);

  // Reset player to start position
  player.x = startPoint.x;
  player.y = startPoint.y;

  // Mark player in grid at spawn location
  grid[player.y][player.x].color = player.color;

  console.log("Player spawned at:", player.x, player.y, "| Color:", player.color);
  console.log("=========================");


  drawMaze();
  resetTimer();

}
/*draw2DMaze();*/
function drawMaze() {

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      let xPos = xO + cellSize * (x - y);
      let yPos = yO + perspective * (cellSize * (x + y));

      if (grid[y][x].color === "transparent") {
        continue;
      }
      // draw the cube
      drawCube(
        xPos,
        yPos,
        cellSize,
        cellSize,
        cellSize,
        grid[y][x].color,
        perspective
      );

    }

  }

}


function draw2DMaze() { // Made for testing the 3d maze 
  // Draw 2D overhead view of maze in top-left corner
  let maze2DSize = 500;
  let cellSizeSmall = maze2DSize / grid.length;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      let xPos = x * cellSizeSmall;
      let yPos = y * cellSizeSmall;

      if (grid[y][x].color === "transparent") {
        bgCtx.fillStyle = "#FFFFFF";
      } else {
        bgCtx.fillStyle = "#000000";
      }

      bgCtx.fillRect(xPos, yPos, cellSizeSmall, cellSizeSmall);
      bgCtx.strokeStyle = "#CCCCCC";
      bgCtx.lineWidth = 0.5;
      bgCtx.strokeRect(xPos, yPos, cellSizeSmall, cellSizeSmall);
    }
  }

  // Draw player on 2D map
  let playerX2D = player.x * cellSizeSmall;
  let playerY2D = player.y * cellSizeSmall;
  bgCtx.fillStyle = player.color;
  bgCtx.fillRect(playerX2D, playerY2D, cellSizeSmall, cellSizeSmall);

  // Draw entrance marker (green)
  let entranceX2D = startPoint.x * cellSizeSmall;
  let entranceY2D = startPoint.y * cellSizeSmall;
  bgCtx.fillStyle = "#00FF00";
  bgCtx.fillRect(entranceX2D, entranceY2D, cellSizeSmall, cellSizeSmall);

  // Draw exit marker (red)
  let exitX2D = endPoint.x * cellSizeSmall;
  let exitY2D = endPoint.y * cellSizeSmall;
  bgCtx.fillStyle = "#FF0000";
  bgCtx.fillRect(exitX2D, exitY2D, cellSizeSmall, cellSizeSmall);
}

function drawPlayer() {
  let xPos = xO + cellSize * (player.x - player.y);
  let yPos = yO + perspective * (cellSize * (player.x + player.y));

  drawCube(
    xPos,
    yPos,
    cellSize,
    cellSize,
    cellSize,
    player.color,
    perspective
  );

}

function shadeColor(color, percent) {
  color = color.substr(1);
  var num = parseInt(color, 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00ff) + amt,
    B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

function drawCube(x, y, wx, wy, h, color, per) {
  //left
  bgCtx.beginPath();
  bgCtx.moveTo(x, y);
  bgCtx.lineTo(x - wx, y - wx * per);
  bgCtx.lineTo(x - wx, y - h - wx * per);
  bgCtx.lineTo(x, y - h * 1);
  bgCtx.closePath();
  bgCtx.fillStyle = shadeColor(color, 10);
  bgCtx.strokeStyle = shadeColor(color, 10);
  bgCtx.stroke();
  bgCtx.fill();

  //right
  bgCtx.beginPath();
  bgCtx.moveTo(x, y);
  bgCtx.lineTo(x + wy, y - wy * per);
  bgCtx.lineTo(x + wy, y - h - wy * per);
  bgCtx.lineTo(x, y - h * 1);
  bgCtx.closePath();
  bgCtx.fillStyle = shadeColor(color, -10);
  bgCtx.strokeStyle = shadeColor(color, -10);
  bgCtx.stroke();
  bgCtx.fill();

  //top
  bgCtx.beginPath();
  bgCtx.moveTo(x, y - h);
  bgCtx.lineTo(x - wx, y - h - wx * per);
  bgCtx.lineTo(x - wx + wy, y - h - (wx * per + wy * per));
  bgCtx.lineTo(x + wy, y - h - wy * per);
  bgCtx.closePath();
  bgCtx.fillStyle = shadeColor(color, 20);
  bgCtx.strokeStyle = shadeColor(color, 20);
  bgCtx.stroke();
  bgCtx.fill();
}

//Canvas Events


function movePlayer(newX, newY) {
  if (
    grid[newY] &&
    grid[newY][newX] &&
    (grid[newY][newX].color === "transparent" || grid[newY][newX].color === "#ffffff")
  ) {
    // restore old position to transparent
    grid[player.y][player.x].color = "transparent";

    // move players
    player.x = newX;
    player.y = newY;

    grid[player.y][player.x].color = player.color;
    bgCtx.clearRect(0, 0, bgw, bgh);
    drawMaze();
    moveSfx();
    /*draw2DMaze();*/

    // Check if reached end after rendering
    if (player.x === endPoint.x && player.y === endPoint.y) {

      winSfx();
      if (isHardMode) {
        bgCtx.clearRect(0, 0, bgw, bgh);
        perspective = 0.8;
        toggleHardMode();
        document.getElementById("hard-mode").disabled = false;
      }
      stopTimer();
      Swal.fire({
        title: "🏆 MAZE COMPLETE!",
        html: `
    <p style="font-family:'Audiowide',sans-serif; color:#71d171; font-size:1.1em;">
      You escaped in <strong style="color:white">${timerSeconds}s</strong>
    </p>
    <p style="font-family:'Audiowide',sans-serif; color:#aaa; font-size:0.85em; margin-top:8px;">
      Think you can beat that?
    </p>
  `,
        footer: `<button id="win-credits-btn" style="
   background:transparent;
    border: 2px solid #71d171;
    color:#71d171;
    font-family:'Audiowide',sans-serif;
    padding:0.4em 1em;
    border-radius:6px;
    cursor:pointer;
    font-size:0.85em;
  ">Credits</button>`,
        background: "#1e2127",
        color: "#71d171",
        confirmButtonText: "PLAY AGAIN",
        confirmButtonColor: "#71d171",
        showCancelButton: true,
        cancelButtonText: "QUIT",
        cancelButtonColor: "#444",
        allowOutsideClick: false,
        didOpen: () => {
          document.getElementById("win-credits-btn").addEventListener("click", () => {
            Swal.fire({
              title: "CREDITS",
              html: `
          <div style="display:flex; flex-direction:column; gap:12px; font-family:'Audiowide',sans-serif;">
            <p style="margin:0; color:#71d171;">
              Design & Development: <strong style="color:white">Abel Elersič</strong>
            </p>
            <hr style="border-color:#71d171; opacity:0.3;">
            <p style="margin:0; color:#aaa; font-size:0.85em;">Isometric maze rendering inspired by:</p>
            <a href="https://cantwell-tom.medium.com/isometric-maze-on-html-canvas-c560afb8430a"
               target="_blank"
               style="color:#71d171; font-weight:bold; text-decoration:none; font-size:0.85em;">
              Tom Cantwell — Isometric Maze on HTML Canvas
            </a>
            <hr style="border-color:#71d171; opacity:0.3;">
            <p style="margin:0; color:#aaa; font-size:0.85em;">Socials</p>
            <div style="display:flex; gap:16px; justify-content:center;">
              <a href="https://www.instagram.com/abelelersic" target="_blank"
                 style="color:#71d171; font-weight:bold; text-decoration:none;">Instagram</a>
              <a href="https://github.com/abel-ux-max" target="_blank"
                 style="color:#71d171; font-weight:bold; text-decoration:none;">GitHub</a>
            </div>
          </div>
        `,
              background: "#1e2127",
              color: "#71d171",
              confirmButtonText: "BACK",
              confirmButtonColor: "#71d171",
            });
          });
        }
      }).then((result) => {
        if (result.isConfirmed) {
          grid[player.y][player.x].color = "transparent";
          mazeData = generateEllerMaze();
          get2DArray();
          startPoint.x = mazeData.entranceX;
          startPoint.y = 0;
          endPoint.x = mazeData.exitX;
          endPoint.y = offScreenCVS.height;
          grid[startPoint.y][startPoint.x].color = "transparent";
          grid[endPoint.y][endPoint.x].color = "transparent";
          player.x = startPoint.x;
          player.y = startPoint.y;
          grid[player.y][player.x].color = player.color;
          bgCtx.clearRect(0, 0, bgw, bgh);
          drawMaze();
          resetTimer();
        }
      });
    }
  }
}

document.addEventListener("keydown", handleKey);

function handleKey(e) {
  let newX = player.x;
  let newY = player.y;

  if (e.key === "w" || e.key === "ArrowUp") newY--;
  if (e.key === "s" || e.key === "ArrowDown") newY++;
  if (e.key === "a" || e.key === "ArrowLeft") newX--;
  if (e.key === "d" || e.key === "ArrowRight") newX++;

  movePlayer(newX, newY);
}

// Timer


function stopTimer() {
  clearInterval(timerInterval);
}

function resetTimer() {
  timerSeconds = -1;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds++;
    document.getElementById("timer").textContent = `Time: ${timerSeconds}s`;
  }, 1000);
}

// New maze button
document.getElementById("new-maze-btn").addEventListener("click", () => {
  if (isHardMode) {
    bgCtx.clearRect(0, 0, bgw, bgh);
    perspective = 0.8;
    toggleHardMode();
    document.getElementById("hard-mode").disabled = false;
  }

  grid[player.y][player.x].color = "transparent";
  mazeData = generateEllerMaze();
  get2DArray();
  startPoint.x = mazeData.entranceX;
  startPoint.y = 0;
  endPoint.x = mazeData.exitX;
  endPoint.y = offScreenCVS.height;
  grid[startPoint.y][startPoint.x].color = "transparent";
  grid[endPoint.y][endPoint.x].color = "transparent";
  player.x = startPoint.x;
  player.y = startPoint.y;
  grid[player.y][player.x].color = player.color;
  bgCtx.clearRect(0, 0, bgw, bgh);
  drawMaze();
  resetTimer();
});

// D-pad buttons
document.getElementById("up").addEventListener("click", () => movePlayer(player.x, player.y - 1));
document.getElementById("down").addEventListener("click", () => movePlayer(player.x, player.y + 1));
document.getElementById("left").addEventListener("click", () => movePlayer(player.x - 1, player.y));
document.getElementById("right").addEventListener("click", () => movePlayer(player.x + 1, player.y));


window.addEventListener("resize", () => {
  location.reload(); // simplest approach, regenerates maze at new size
});


let perspectiveDir = 1;

function animateLoop() {
  perspective += 0.02 * perspectiveDir;
  if (perspective >= 0.8) perspectiveDir = -1;
  if (perspective <= 0.6) perspectiveDir = 1;
  bgCtx.clearRect(0, 0, bgw, bgh);
  drawMaze();
  animationId = requestAnimationFrame(animateLoop); // store the ID
}
//animateLoop();

document.getElementById("hint-btn").addEventListener("click", hint);


function getSolutionPath(startX, startY) {
  let visited = [];
  for (let i = 0; i < grid.length; i++) {
    visited[i] = [];
    for (let j = 0; j < grid[i].length; j++) {
      visited[i][j] = false;
    }
  }

  let path = [];

  function solve(x, y) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[y].length) return false;
    if (grid[y][x].color !== "transparent" && grid[y][x].color !== player.color) return false;
    if (visited[y][x]) return false;
    visited[y][x] = true;
    path.push({ x, y });
    if (x === endPoint.x && y === endPoint.y) return true;
    if (solve(x, y - 1)) return true;
    if (solve(x, y + 1)) return true;
    if (solve(x - 1, y)) return true;
    if (solve(x + 1, y)) return true;
    path.pop();
    return false;
  }

  return solve(startX, startY) ? path : null;
}

function isMazeSolvable() {
  return getSolutionPath(startPoint.x, startPoint.y) !== null;
}

function hint() {

  let path = getSolutionPath(player.x, player.y);
  if (!path) return;

  timerSeconds += 10;
  document.getElementById("timer").textContent = `Time: ${timerSeconds}s`;

  let steps = path.slice(1, 7);
  hintSfx();
  steps.forEach(cell => {
    grid[cell.y][cell.x].color = "#ffffff";
  });
  bgCtx.clearRect(0, 0, bgw, bgh);
  drawMaze();

}


let isHardMode = false;
let animationId = null;

function toggleHardMode() {
  isHardMode = !isHardMode;
  mazeColor = isHardMode ? "#fd2626" : "#3e9e3e";

  if (isHardMode) {
    hardModeSfx();
  } else {
    hardModeSound.pause();
    hardModeSound.currentTime = 0;
  }

  document.getElementById("hard-mode").disabled = isHardMode;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      let cell = grid[y][x];
      if (cell.color !== "transparent" &&
        cell.color !== player.color &&
        cell.color !== "#ffffff") {
        cell.color = mazeColor;
      }
    }
  }

  if (isHardMode) {
    animateLoop();
  } else {
    cancelAnimationFrame(animationId);
    perspective = 0.8;
    bgCtx.clearRect(0, 0, bgw, bgh);
    drawMaze();
  }
}

document.getElementById("hard-mode").addEventListener("click", toggleHardMode);

