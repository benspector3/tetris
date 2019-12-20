/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// VARIABLE DECLARATIONS ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Constant Variables
var COLORS = [
  '#000000',
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];
var COLUMNS = 12;
var INSTRUCTIONS = "Left and Right Arrow to move \nQ and W (or Up) to rotate \nDown to drop \nSpace to full drop";
var KEY = {
  W: 87,
  Q: 81,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  P: 80,
  SPACE: 32,
};
var LINE_POINTS = [40, 100, 300, 1200];
var PIECE_MATRIXES = {
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
var ROWS = 20;
var SQUARE_SIZE = 20;

var board,
    arena,  
    score,
    lines,
    player,
    dropInterval,
    isPaused;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GAME SETUP //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function init() {
  // initialize board DOM element
  board = {};
  board.element = $('#board');

  // initialize 2D arena
  arena = getEmptyArena();
  
  // initialize score DOM element and score/lines values
  score = {};
  score.element = $('#score');
  score.points = 0;
  lines = {};
  lines.element = $('#lines');
  lines.count = 0;
  updateScore();
  
  // initialize the player Values
  player = {};
  resetPlayer();
  
  dropInterval = 1000;
  isPaused = false

  alert(INSTRUCTIONS);
  
  // turn on keyboard inputs
  $(document).on('keydown', handleKeyDown);

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
var dropCounter = 0;
var lastTime = 0;
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
  var key = event.which;
  
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

////////////////////////////////////////////////////////////////////////////////
////////////////////////// HELPER FUNCTIONS ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function checkCollisions() {
  for (var r = 0; r < player.matrix.length; r++) {
    for (var c = 0; c < player.matrix[r].length; c++) {
      // if there is an element in the player.matrix matrix
      var playerSquare = player.matrix[r][c];
      
      if (playerSquare.element) {

        var arenaRow = r + player.row;
        var arenaColumn = c + player.column;

        // check if the piece has hit the bottom or the sides
        if (arenaRow === ROWS || arenaColumn >= COLUMNS || arenaColumn < 0) {
          return true;
        }

        // check the arena for a collision at the row and column
        var arenaSquare = arena[arenaRow][arenaColumn];
        if (arenaSquare.value) {
          return true;
        }
      }
    }
  }
  return false;
}


function clearLines() {
  var linesCleared = 0;

  // find all full rows
  for (var r = ROWS - 1; r >= 0; r--) {
    // assume each row is full
    var isFullRow = true;

    // if a row has a 0, it is not a full row
    for (var c = 0; c < COLUMNS; c++) {
      if (arena[r][c].value === 0) {
        isFullRow = false;
      }
    }

    // if no 0s were found, the row was full so "remove" it by copying 
    // the color/value of the row above it. Repeat for all rows above
    if (isFullRow) {
      for (var x = r; x >= 1; x--) {
        for (var y = 0; y < arena[x].length; y++) {
          var value = arena[x - 1][y].value;
          arena[x][y].value = value;
          arena[x][y].element.css('background-color', COLORS[value]);
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
  var piece = player.matrix;
  var row = player.row;
  var column = player.column;
  for (var r = 0; r < piece.length; r++) {
    for (var c = 0; c < piece[r].length; c++) {
      if (piece[r][c].element) {
        piece[r][c].element.css({
          'left': (c + column) * SQUARE_SIZE,
          'top': (r + row) * SQUARE_SIZE,
        });
      }
    }
  }
}

function dropPiece() {
  player.row++;

  if (checkCollisions()) {
    player.row--;
    setPlayerPiece();
    resetPlayer();
  }

  dropCounter = 0;
}

function fullDrop() {
  while(!checkCollisions()) {
    player.row++;
  }
  player.row--;

  drawPlayerPiece(); // might not need this

  setPlayerPiece();
  resetPlayer();

  dropCounter = 0;
}

function getEmptyArena() {
  // arena is a 2D matrix organized ROWS x COLUMNS
  var arena = [];

  for (var r = 0; r < ROWS; r++) {
    arena[r] = [];

    for (var c = 0; c < COLUMNS; c++) {
      var props = {
        'left': c * SQUARE_SIZE,
        'top': r * SQUARE_SIZE,
        'background-color': "black"
      }

      arena[r][c] = {
        element: $('<div>').addClass('arena-square').appendTo(board.element).css(props), 
        value : 0
      };
    }
  }
  return arena;
}

function getRandomPieceMatrix() {
  var types = 'ILJOZST';
  type = types[Math.floor(Math.random() * types.length)];

  var values = PIECE_MATRIXES[type];
  var piece = [];

  for (var r = 0; r < values.length; r++) {
    piece[r] = [];
    for (var c = 0; c < values[r].length; c++) {
      var value = values[r][c];
      piece[r][c] = {value: value};
      if (value) {
        pieceSquare = $('<div>').addClass('arena-square').appendTo(board.element);
        pieceSquare.css('background-color', COLORS[value]);
        piece[r][c].element = pieceSquare;
      }
    }
  }

  return piece;
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
  
  board.element.empty();

  alert('game over');
  
  // restart the game after 500 ms
  setTimeout(function() {
    init();
  }, 500);
 
}

function resetPlayer() {
  player.row = 0;
  player.column = (COLUMNS / 2) - 1;
  player.matrix = getRandomPieceMatrix();
  if (checkCollisions()) {
    resetGame();
  }
}

function rotateMatrix(matrix, dir) {
  // transpose:
  var newMatrix = [];
  for (var r = 0; r < matrix.length; r++) {
    newMatrix[r] = [];
    for (var c = 0; c < matrix[r].length; c++) {
      newMatrix[r][c] = matrix[c][r];
    }
  }
  matrix = newMatrix;
  // see https://jsbin.com/yoyowob/3/edit?js,console for full implementation of Array.reverse() method

  // rotate right by reversing the matrix columns (reverse each value in each row)
  if (dir === 1) {
    for (var r = 0; r < matrix.length; r++) {
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
  player.matrix = rotateMatrix(player.matrix, dir);

  var offset = 1;
  while (checkCollisions()) {
    strafe(offset);
    offset *= -1;
    
    if (offset > 0) {
      offset++; 
    }

    if (offset > player.matrix.length) {
      player.matrix = rotateMatrix(player.matrix, -dir);
      return;
    }
  }
}

function setPlayerPiece() {
  for (var r = 0; r < player.matrix.length; r++) {
    for (var c = 0; c < player.matrix[r].length; c++) {
      if (player.matrix[r][c].element) {
        var arenaRow = r + player.row;
        var arenaColumn = c + player.column;
        arena[arenaRow][arenaColumn].element.remove();
        arena[arenaRow][arenaColumn] = player.matrix[r][c];
      }
    }
  }

  clearLines();
}

// initially this was two functions, moveLeft and moveRight but consolidating
// into one allowed for simpler code AND the ability to easily wiggle the piece
// back onto the board when we rotate a piece into either the walls or another piece
function strafe(offset) {
  player.column += offset;
  if (checkCollisions()) {
    player.column -= offset;;
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

init();