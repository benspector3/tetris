/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// VARIABLE DECLARATIONS ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Constant Variables
var SQUARE_SIZE = 20;
var ROWS = 20;
var COLUMNS = 12;
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

var colors = [
  '#000000',
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

var pieceMatrixes = {
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

// HTML jQuery Objects
var game = {
  board: $('#board'),
  width: $('#board').width(),
  height: $(window).height(),
  isPaused: false
}

var player,
    arena,
    score,
    dropInterval;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GAME SETUP //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function init() {
  arena = getEmptyArena();

  score = {};
  score.element = $('#score');
  score.points = 0;
  score.lines = 0;
  
  dropInterval = 1000;
  
  player = {};
  resetPlayer();
  
  // turn on keyboard inputs
  $(document).on('keydown', handleKeyDown);
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
function update(time = 0) {
  dropCounter += time - lastTime;
  lastTime = time;

  // every 1000 ms drop the piece
  if (dropCounter > dropInterval) {
    dropPiece();
  }
  
  // unless the game is paused, on each frame draw the piece and request the next frame
  if (!game.isPaused) {
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
  for (var r = 0; r < player.piece.length; r++) {
    for (var c = 0; c < player.piece[r].length; c++) {
      // if there is an element in the player.piece matrix
      if (player.piece[r][c].element) {
        var arenaRow = r + player.row
        var arenaColumn = c + player.column

        // check if the piece has hit the bottom or the sides
        if (arenaRow === ROWS || arenaColumn >= COLUMNS || arenaColumn < 0) {
          return true;
        }

        // // check the arena for a collision at the row and column
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
  var points = 100;

  for (var r = ROWS - 1; r >= 0; r--) {
    var isFullRow = true;
    for (var c = 0; c < COLUMNS; c++) {
      if (arena[r][c].value === 0) {
        isFullRow = false;
      }
    }
    if (isFullRow) {
      for (var x = r; x >= 1; x--) {
        for (var y = 0; y < arena[x].length; y++) {
          var value = arena[x - 1][y].value;
          arena[x][y].element.css('background-color', colors[value]);
          arena[x][y].value = value;
        }
      }
      r++;

      score.lines++;
      if (score.lines % 1 === 5) {
        dropInterval *= .9;
      }
      updateScore(points);
      points *= 2;
    }
  }
}

function drawPlayerPiece() {
  var piece = player.piece;
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
  updateScore(20);
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
  var arena = [];
  for (var r = 0; r < ROWS; r++) {
    var row = [];

    for (var c = 0; c < COLUMNS; c++) {
      var arenaSquare = $('<div>').addClass('arena-square').appendTo(game.board);
      arenaSquare.css({
        'left': c * SQUARE_SIZE,
        'top': r * SQUARE_SIZE,
        'background-color': "black"
      });
      row.push({element: arenaSquare, value : 0});
    }
    arena.push(row);
  }
  return arena;
}

function getRandomPieceMatrix() {
  var types = 'ILJOZST';
  type = types[Math.floor(Math.random() * types.length)];

  var values = pieceMatrixes[type];
  var piece = [];

  for (var r = 0; r < values.length; r++) {
    piece[r] = [];
    for (var c = 0; c < values[r].length; c++) {
      var value = values[r][c];
      piece[r][c] = {value: value};
      if (value) {
        pieceSquare = $('<div>').addClass('arena-square').appendTo(game.board);
        pieceSquare.css('background-color', colors[value]);
        piece[r][c].element = pieceSquare;
      }
    }
  }

  return piece;
}

function pause() {
  if (!game.isPaused) {
    game.isPaused = true;
    $('#paused').toggle();
  } else {
    game.isPaused = false;
    $('#paused').toggle();
    update();
  }
}

function resetGame() {
  // display the proper score
  score.element.text(score.left + " : " + score.right);

  // turn off keyboard inputs
  $(document).off();

  game.isPaused = true;
  
  // restart the game after 500 ms
  setTimeout(function() {
    
    // anything else you might want to do between points...

    // reset positions of Objects
    init();
    game.isPaused = false;
  }, 500);
 
}

function resetPlayer() {
  player.row = 0;
  player.column = (COLUMNS / 2) - 1;
  player.piece = getRandomPieceMatrix();
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
  player.piece = rotateMatrix(player.piece, dir);
  drawPlayerPiece();
  var offset = 1;
  while (checkCollisions()) {
    strafe(offset);
    drawPlayerPiece();
    offset *= -1;
    if (offset > 0) {
      offset ++; 
    }
  }
}

function setPlayerPiece() {
  updateScore(10);

  for (var r = 0; r < player.piece.length; r++) {
    for (var c = 0; c < player.piece[r].length; c++) {
      if (player.piece[r][c].element) {
        var arenaRow = r + player.row;
        var arenaColumn = c + player.column;
        arena[arenaRow][arenaColumn].element.remove();
        arena[arenaRow][arenaColumn] = player.piece[r][c];
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

function updateScore(points) {
  score.points += points;
  score.element.text('lines: ' + score.lines + ' | score ' + score.points);
}

init();
update();