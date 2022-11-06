/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// VARIABLE DECLARATIONS ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


const ROWS = 20;
const COLUMNS = 12;

// DOM Elements
const boardElement = $('#board');
const playButton = $('#play');
const gameInfo = $('#game-info')

gameInfo.hide();

// Constant Variables
const COLORS = [
  '#a858282',
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

const INSTRUCTIONS = "Keyboard: \nLeft and Right Arrow to move \nQ and W (or Up) to rotate \nDown to drop \nSpace to full drop\n\n" 
  + "Mobile: \nSwipe left or right to move\nTap to rotate\nSwipe down to move down\nSwipe up to drop";
const KEY = {
  W: 87,
  Q: 81,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  P: 80,
  SPACE: 32,
};
const LINE_POINTS = [40, 100, 300, 1200];
const PIECE_TYPES = 'ILJOZST';
const PIECE_MATRIXES = {
  'I': [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ],
  'L': [
    [0, 2, 0],
    [0, 2, 0],
    [0, 2, 2],
  ],
  'J': [
    [0, 3, 0],
    [0, 3, 0],
    [3, 3, 0],
  ],
  'O': [
    [4, 4],
    [4, 4],
  ],
  'Z': [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  'S': [
    [0, 6, 6],
    [6, 6, 0],
    [0, 0, 0],
  ],
  'T': [
    [0, 7, 0],
    [7, 7, 7],
    [0, 0, 0],
  ],
};


let arena,  
score,
lines,
currentPiece,
dropInterval,
isPaused;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GAME SETUP //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

init();

function init() {
  // initialize 2D arena
  arena = getEmptyArena();

  // Turn on resizing
  addEventListener('resize', resize)
  resize();
  
  // initialize score DOM element and score/lines values
  score = {};
  score.element = $('#score');
  score.points = 0;
  lines = {};
  lines.element = $('#lines');
  lines.count = 0;
  updateScore();
  
  // initialize the currentPiece Values
  currentPiece = {};
  
  dropInterval = 1000;
  isPaused = false
}

function startGame() {
  alert(INSTRUCTIONS);  
  
  playButton.hide();
  gameInfo.show();

  // turn on keyboard inputs
  $(document).on('keydown', handleKeyDown);
  $(document).on('touchstart', handleTouchStart);
  $(document).on('touchend', handleTouchEnd);
  $(document).on('touchmove', handleTouchMove);

  resetPlayer();

  // request the first Frame
  requestAnimationFrame(update);
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////// UPDATE FUNCTIONS /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* 
 * On each update tick update each bubble's position and check for
 * collisions with the walls.
 */
let dropCounter = 0;
let lastTime = 0;
function update(timeSinceStart) {
  if (!timeSinceStart) {
    timeSinceStart = 0;
  }

  dropCounter += timeSinceStart - lastTime;
  lastTime = timeSinceStart;

  // every 1000 ms drop the piece
  if (dropCounter > dropInterval) {
    dropPiece();
  }
  
  // unless the game is paused, on each frame draw the piece and request the next frame
  if (!isPaused) {
    drawPlayerPiece();
    requestAnimationFrame(update);
  }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////// KEYBOARD FUNCTIONS //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* 
event.which returns the keycode of the key that is pressed when the
keydown event occurs
*/
function handleKeyDown(event) {
  const key = event.which;
  
  if (key === KEY.P) {
    pause();
  } 
  
  if (isPaused) {
    return;
  } else if (key === KEY.LEFT) {
    strafe(-1);
  } else if (key === KEY.RIGHT) {
    strafe(1);
  } else if (key === KEY.DOWN) {
    dropPiece();
  } else if (key === KEY.Q) {
    rotatePlayer(-1);
  } else if (key === KEY.W || key === KEY.UP) {
    rotatePlayer(1);
  } else if (key === KEY.SPACE) {
    fullDrop();
  } 
}

let xDown, yDown;

function handleTouchStart(evt) {     
  if (isPaused) {
    return;
  }                       
  xDown = evt.originalEvent.touches[0].clientX;                                      
  yDown = evt.originalEvent.touches[0].clientY;                                      
};          

function handleTouchEnd(evt) {
  if (isPaused) {
    return;
  }

  if (xDown || yDown) {
    rotatePlayer(1);
  }
  xDown = null;
  yDown = null;
}

function handleTouchMove(evt) {   
  if (isPaused) {
    return;
  }  

  if ( !xDown || !yDown ) {
      return;
  }
  var xUp = evt.originalEvent.touches[0].clientX;                                    
  var yUp = evt.originalEvent.touches[0].clientY;

  var xDiff = xDown - xUp;
  var yDiff = yDown - yUp;

  /* choose the most significant */
  if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {

    if (xDiff > 0) {
      /* swipe left */
      strafe(-1);
    } else {
      /* swipe right */
      strafe(1);
    }

  }
  else {
    if (yDiff > 0) {
      /* swipe up */
      fullDrop();
    } else {
      /* swipe down */
      dropPiece();
    }
  }
  
  /* reset values */
  xDown = null;
  yDown = null;                                             
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////// HELPER FUNCTIONS ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function checkCollisions() {
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      // if there is an element in the currentPiece.matrix matrix
      const playerSquare = currentPiece.matrix[r][c];
      
      if (playerSquare.element) {

        const arenaRow = r + currentPiece.row;
        const arenaColumn = c + currentPiece.column;

        // check if the piece has hit the bottom or the sides
        if (arenaRow === ROWS || arenaColumn >= COLUMNS || arenaColumn < 0) {
          return true;
        }

        // check the arena for a collision at the row and column
        const arenaSquare = arena[arenaRow][arenaColumn];
        if (arenaSquare.value) {
          return true;
        }
      }
    }
  }
  return false;
}


function clearLines() {
  let linesCleared = 0;

  // find all full rows
  for (let r = ROWS - 1; r >= 0; r--) {
    // assume each row is full
    let isFullRow = true;

    // if a row has a 0, it is not a full row
    for (let c = 0; c < COLUMNS; c++) {
      if (arena[r][c].value === 0) {
        isFullRow = false;
      }
    }

    // if no 0s were found, the row was full so "remove" it by copying 
    // the color/value of the row above it. Repeat for all rows above
    if (isFullRow) {
      for (let x = r; x >= 1; x--) {
        for (let y = 0; y < arena[x].length; y++) {
          const value = arena[x - 1][y].value;
          arena[x][y].value = value;
          if (value !== 0) {
            arena[x][y].element.css('background-color', COLORS[value]);
          }
        }
      }
      
      // don't skip the row directly above the full row 
      r++;

      // count the line
      linesCleared++;
    }
  }

  updateScore(linesCleared);
}

function drawPlayerPiece() {
  const piece = currentPiece.matrix;
  const row = currentPiece.row;
  const column = currentPiece.column;
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c].element) {
        piece[r][c].element.css({
          'width': getSquareSize(),
          'height': getSquareSize(),
          'left': (c + column) * getSquareSize(),
          'top': (r + row) * getSquareSize(),
        });
      }
    }
  }
}

function dropPiece() {
  currentPiece.row++;

  if (checkCollisions()) {
    currentPiece.row--;
    setPlayerPiece();
    resetPlayer();
  }

  dropCounter = 0;
}

function fullDrop() {
  while(!checkCollisions()) {
    currentPiece.row++;
  }
  currentPiece.row--;

  drawPlayerPiece(); // might not need this

  setPlayerPiece();
  resetPlayer();

  dropCounter = 0;
}

function getEmptyArena() {
  // arena is a 2D matrix organized ROWS x COLUMNS
  const arena = [];

  for (let r = 0; r < ROWS; r++) {
    arena[r] = [];

    for (let c = 0; c < COLUMNS; c++) {
      const additionalProps = {
        'left': c * getSquareSize(),
        'top': r * getSquareSize()
      }
      const emptyArenaSquare = makeArenaSquare(additionalProps);
      arena[r][c] = { element: emptyArenaSquare, value : 0 };
    }
  }
  return arena;
}

function getRandomPieceMatrix() {
  type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];

  const values = PIECE_MATRIXES[type];
  const piece = [];

  for (let r = 0; r < values.length; r++) {
    piece[r] = [];
    for (let c = 0; c < values[r].length; c++) {
      const value = values[r][c];
      piece[r][c] = {value: value};
      if (value) {
        const additionalProps = { 'background-color': COLORS[value] };
        pieceSquare = makeArenaSquare(additionalProps);
        piece[r][c].element = pieceSquare;
      }
    }
  }

  return piece;
}

function makeArenaSquare(additionalProps) {
  const props = {
    'width': getSquareSize(),
    'height': getSquareSize(),
    ...additionalProps
  }
  pieceSquare = $('<div>')
    .addClass('arena-square')
    .css(props)
    .appendTo(boardElement);

  return pieceSquare;
}

function pause() {
  if (!isPaused) {
    isPaused = true;
    $('#paused').toggle();
  } else {
    isPaused = false;
    $('#paused').toggle();
    update();
  }
}

function resetGame() {
  // turn off keyboard inputs
  $(document).off();

  isPaused = true;
  
  boardElement.empty();

  alert('game over');
  
  // restart the game after 500 ms
  setTimeout(function() {
    init();
  }, 500);
 
}

function resetPlayer() {
  currentPiece.row = 0;
  currentPiece.column = (COLUMNS / 2) - 1;
  currentPiece.matrix = getRandomPieceMatrix();
  if (checkCollisions()) {
    resetGame();
  }
}

function rotateMatrix(matrix, dir) {
  // transpose:
  const newMatrix = [];
  for (let r = 0; r < matrix.length; r++) {
    newMatrix[r] = [];
    for (let c = 0; c < matrix[r].length; c++) {
      newMatrix[r][c] = matrix[c][r];
    }
  }
  matrix = newMatrix;
  // see https://jsbin.com/yoyowob/3/edit?js,console for full implementation of Array.reverse() method

  // rotate right by reversing the matrix columns (reverse each value in each row)
  if (dir === 1) {
    for (let r = 0; r < matrix.length; r++) {
      matrix[r].reverse();
    }     
    return matrix;
  } 
  // rotate left by reversing the matrix rows (reverse each row)
  else if (dir === -1) {
    return matrix.reverse();
  } 
  // deal with bad input
  else {
    return null;
  }
}

function rotatePlayer(dir) {
  currentPiece.matrix = rotateMatrix(currentPiece.matrix, dir);

  let offset = 1;
  while (checkCollisions()) {
    strafe(offset);
    offset *= -1;
    
    if (offset > 0) {
      offset++; 
    }

    if (offset > currentPiece.matrix.length) {
      currentPiece.matrix = rotateMatrix(currentPiece.matrix, -dir);
      return;
    }
  }
}

function setPlayerPiece() {
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c].element) {
        const arenaRow = r + currentPiece.row;
        const arenaColumn = c + currentPiece.column;

        // replace the existing piece in the arena with the currentPiece
        arena[arenaRow][arenaColumn].element.remove();
        arena[arenaRow][arenaColumn] = currentPiece.matrix[r][c];
      }
    }
  }

  clearLines();
}

// initially this was two functions, moveLeft and moveRight but consolidating
// into one allowed for simpler code AND the ability to easily wiggle the piece
// back onto the board when we rotate a piece into either the walls or another piece
function strafe(offset) {
  currentPiece.column += offset;
  if (checkCollisions()) {
    currentPiece.column -= offset;;
  }
}

function updateScore(linesCleared) {
  if (linesCleared) {
    score.points += LINE_POINTS[linesCleared - 1];
    score.element.text('score ' + score.points);
    
    lines.count += linesCleared;
    lines.element.text('lines cleared: ' + lines.count);

    // speed up the game every 5 lines
    if (lines.count % 5 === 0) {
      dropInterval *= .9;
    }
  }
}


/// RESIZING
function resize() {
  boardElement.css({
    "height": getBoardHeight(),
    "width": getBoardWidth()
  })

  if (arena) {
    for (let r = 0; r < arena.length; r++) {
      for (let c = 0; c < arena[r].length; c++) {

        arena[r][c].element.css({
          'width': getSquareSize(),
          'height': getSquareSize(),
          'left': c * getSquareSize(),
          'top': r * getSquareSize(),
        })
      }
    }
  }
  if (currentPiece){
    drawPlayerPiece();
  }
}

function getBoardHeight() {
  return $(window).height() * 0.6;
}

function getSquareSize() {
  return getBoardHeight() / ROWS
}

function getBoardWidth() {
  return getSquareSize() * COLUMNS;
}