window.onload = function () {
    var gameBoard = [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [2, 0, 2, 0, 2, 0, 2, 0],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [2, 0, 2, 0, 2, 0, 2, 0]
    ];
    var pieces = [];
    var tiles = [];
  
    var dist = function (x1, y1, x2, y2) {
      return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }
    function Piece(element, position) {
      this.allowedtomove = true;
      this.element = element;
      this.position = position;
      this.player = '';
      if (this.element.attr("id") < 12)
        this.player = 1;
      else
        this.player = 2;
      this.king = false;
      this.makeKing = function () {
        this.element.css("backgroundImage", "url('img/king" + this.player + ".png')");
        this.king = true;
      }
      this.move = function (tile) {
        this.element.removeClass('selected');
        if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
        if (this.player == 1 && this.king == false) {
          if (tile.position[0] < this.position[0]) return false;
        } else if (this.player == 2 && this.king == false) {
          if (tile.position[0] > this.position[0]) return false;
        }
        Board.board[this.position[0]][this.position[1]] = 0;
        Board.board[tile.position[0]][tile.position[1]] = this.player;
        this.position = [tile.position[0], tile.position[1]];
        this.element.css('top', Board.dictionary[this.position[0]]);
        this.element.css('left', Board.dictionary[this.position[1]]);
        if (!this.king && (this.position[0] == 0 || this.position[0] == 7))
          this.makeKing();
        return true;
      };
  
      this.canJumpAny = function () {
        return (this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
          this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
          this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
          this.canOpponentJump([this.position[0] - 2, this.position[1] - 2]))
      };
  
      this.canOpponentJump = function (newPosition) {
        var dx = newPosition[1] - this.position[1];
        var dy = newPosition[0] - this.position[0];
        if (this.player == 1 && this.king == false) {
          if (newPosition[0] < this.position[0]) return false;
        } else if (this.player == 2 && this.king == false) {
          if (newPosition[0] > this.position[0]) return false;
        }
        if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
        var tileToCheckx = this.position[1] + dx / 2;
        var tileToChecky = this.position[0] + dy / 2;
        if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;
        if (!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
          for (let pieceIndex in pieces) {
            if (pieces[pieceIndex].position[0] == tileToChecky && pieces[pieceIndex].position[1] == tileToCheckx) {
              if (this.player != pieces[pieceIndex].player) {
                return pieces[pieceIndex];
              }
            }
          }
        }
        return false;
      };
  
      this.opponentJump = function (tile) {
        var pieceToRemove = this.canOpponentJump(tile.position);
        if (pieceToRemove) {
          pieceToRemove.remove();
          return true;
        }
        return false;
      };
  
      this.remove = function () {
        this.element.css("display", "none");
        if (this.player == 1) {
          $('#player2').append("<div class='capturedPiece'></div>");
          Board.score.player2 += 1;
        }
        if (this.player == 2) {
          $('#player1').append("<div class='capturedPiece'></div>");
          Board.score.player1 += 1;
        }
        Board.board[this.position[0]][this.position[1]] = 0;
        this.position = [];
        var playerWon = Board.checkifAnybodyWon();
        if (playerWon) {
          $('#winner').html("Player " + playerWon + " has won!");
        }
      }
    }
  
    function Tile(element, position) {
      this.element = element;
      this.position = position;
      this.inRange = function (piece) {
        for (let k of pieces)
          if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
        if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
        if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';
        if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
          return 'regular';
        } else if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
          return 'jump';
        }
      };
    }
  
    var Board = {
      board: gameBoard,
      score: {
        player1: 0,
        player2: 0
      },
      playerTurn: 1,
      jumpexist: false,
      continuousjump: false,
      tilesElement: $('div.tiles'),
      dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
      initalize: function () {
        var countPieces = 0;
        var countTiles = 0;
        for (let row in this.board) { 
          for (let column in this.board[row]) { 
            if (row % 2 == 1) {
              if (column % 2 == 0) {
                countTiles = this.tileRender(row, column, countTiles)
              }
            } else {
              if (column % 2 == 1) {
                countTiles = this.tileRender(row, column, countTiles)
              }
            }
            if (this.board[row][column] == 1) {
              countPieces = this.playerPiecesRender(1, row, column, countPieces)
            } else if (this.board[row][column] == 2) {
              countPieces = this.playerPiecesRender(2, row, column, countPieces)
            }
          }
        }
      },
      tileRender: function (row, column, countTiles) {
        this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
        tiles[countTiles] = new Tile($("#tile" + countTiles), [parseInt(row), parseInt(column)]);
        return countTiles + 1
      },
  
      playerPiecesRender: function (playerNumber, row, column, countPieces) {
        $(`.player${playerNumber}pieces`).append("<div class='piece' id='" + countPieces + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
        pieces[countPieces] = new Piece($("#" + countPieces), [parseInt(row), parseInt(column)]);
        return countPieces + 1;
      },
      isValidPlacetoMove: function (row, column) {
        if (row < 0 || row > 7 || column < 0 || column > 7) return false;
        if (this.board[row][column] == 0) {
          return true;
        }
        return false;
      },
      changePlayerTurn: function () {
        if (this.playerTurn == 1) {
          this.playerTurn = 2;
          $('.turn').css("background", "linear-gradient(to right, transparent 50%, #BEEE62 50%)");
        } else {
          this.playerTurn = 1;
          $('.turn').css("background", "linear-gradient(to right, #BEEE62 50%, transparent 50%)");
        }
        this.check_if_jump_exist()
        return;
      },
      checkifAnybodyWon: function () {
        if (this.score.player1 == 12) {
          return 1;
        } else if (this.score.player2 == 12) {
          return 2;
        }
        return false;
      },
      clear: function () {
        location.reload();
      },
      check_if_jump_exist: function () {
        this.jumpexist = false
        this.continuousjump = false;
        for (let k of pieces) {
          k.allowedtomove = false;
          if (k.position.length != 0 && k.player == this.playerTurn && k.canJumpAny()) {
            this.jumpexist = true
            k.allowedtomove = true;
          }
        }
        if (!this.jumpexist) {
          for (let k of pieces) k.allowedtomove = true;
        }
      },
      str_board: function () {
        ret = ""
        for (let i in this.board) {
          for (let j in this.board[i]) {
            var found = false
            for (let k of pieces) {
              if (k.position[0] == i && k.position[1] == j) {
                if (k.king) ret += (this.board[i][j] + 2)
                else ret += this.board[i][j]
                found = true
                break
              }
            }
            if (!found) ret += '0'
          }
        }
        return ret
      }
    }
  
    Board.initalize();
  
   
    $('.piece').on("click", function () {
      var selected;
      var isPlayersTurn = ($(this).parent().attr("class").split(' ')[0] == "player" + Board.playerTurn + "pieces");
      if (isPlayersTurn) {
        if (!Board.continuousjump && pieces[$(this).attr("id")].allowedtomove) {
          if ($(this).hasClass('selected')) selected = true;
          $('.piece').each(function (index) {
            $('.piece').eq(index).removeClass('selected')
          });
          if (!selected) {
            $(this).addClass('selected');
          }
        } else {
          let exist = "jump exist for other pieces, that piece is not allowed to move"
          let continuous = "continuous jump exist, you have to jump the same piece"
          let message = !Board.continuousjump ? exist : continuous
          console.log(message)
        }
      }
    });
  
    $('#cleargame').on("click", function () {
      Board.clear();
    });
  
    $('.tile').on("click", function () {
      if ($('.selected').length != 0) {
        var tileID = $(this).attr("id").replace(/tile/, '');
        var tile = tiles[tileID];
        var piece = pieces[$('.selected').attr("id")];
        var inRange = tile.inRange(piece);
        if (inRange != 'wrong') {
          if (inRange == 'jump') {
            if (piece.opponentJump(tile)) {
              piece.move(tile);
              if (piece.canJumpAny()) {
                piece.element.addClass('selected');
                Board.continuousjump = true;
              } else {
                Board.changePlayerTurn()
              }
            }
          } else if (inRange == 'regular' && !Board.jumpexist) {
            if (!piece.canJumpAny()) {
              piece.move(tile);
              Board.changePlayerTurn()
            } else {
              alert("You must jump when possible!");
            }
          }
        }
      }
    });

    function canClickTile(e) {
        var tile = tiles[e.target.id];
        if (e.target.classList.contains('selected')) return false;
    
        // Only allow selection of your pieces and check for jump or regular moves.
        if (
            (tile.inRange(newPiece) !== 'wrong' &&
             ((newPiece.player == this.playerTurn && tile.inRange(newPiece) === 'jump') ||
              (tile.inRange(newPiece) === 'regular' && !Board.jumpexist))) ||
            (tile.inRange(newPiece) === 'regular' && newPiece.player == this.playerTurn)
        ) {
            newPiece.move(tile);
            return true;
        }
    
        var opponentTile = tile.getOpponentSquare();
        if (opponentTile && pieces[opponentTile].player !== newPiece.player) {
            var nextTile = board[opponentTile[0] + 1][opponentTile[1]];
            if (nextTile === null || !newPiece.isKing && nextTile.value == 0) {
                newPiece.move(nextTile);
                return true;
            }
        }
    
        var opponentTile = tile.getOpponentSquare();
        if (opponentTile && pieces[opponentTile].player !== newPiece.player) {
            newPiece.move(opponentTile);
            return true;
        }
    
        return false;
    }
    
    piece.inRange = function(piece, opponentSquare) {
        var tile = tiles[piece.id];
        var move = piece.getMove();
        if (move && move[0] == opponentSquare[0] && move[1] == opponentSquare[1]) {
            return 'jump';
        }
    
        var direction = [0, 1];
        for (var i = 0; i < tile.children.length; i++) {
            if (tile.children[i][0] != piece.value) continue;
            if (board[tile.children[i][0]][piece.value] == null) {
                return 'regular';
            }
    
            var opponentSquareIndex = this.getOpponentSquare();
            for (var j = 0; j < opponentSquareIndex.children.length; j++) {
                if (opponentSquareIndex.children[j].value != piece.value &&
                    opponentSquareIndex.children[j][1] == tile.children[i][1]) {
                    return 'jump';
                }
            }
        }
    
        direction = [0, -1];
        for (var i = 0; i < tile.children.length; i++) {
            if (tile.children[i][0] != piece.value) continue;
            if (board[tile.children[i][0]][piece.value] == null) {
                return 'regular';
            }
    
            var opponentSquareIndex = this.getOpponentSquare();
            for (var j = 0; j < opponentSquareIndex.children.length; j++) {
                if (opponentSquareIndex.children[j].value != piece.value &&
                    opponentSquareIndex.children[j][1] == tile.children[i][1]) {
                    return 'jump';
                }
            }
        }
    
        if (board[tile.children[i][0]][piece.value] == null) {
            for (var i = 0; i < piece.children.length; i++) {
                board[piece.children[i][0]][piece.children[i][1]] = null;
            }
            return 'noMove';
        }
    
        if (board[tile.children[i][0]][piece.value] != null) {
            for (var i = 0; i < piece.children.length; i++) {
                board[piece.children[i][0]][piece.children[i][1]] = newPiece.value;
            }
            return 'invalidMove';
        }
    
        var canJumpForward = true;
        for (var j = 0; j < piece.children.length; j++) {
            if (!canJumpBackward(piece.children[j])) {
                canJumpForward = false;
            }
        }
    
        return 'canJumpForward';
    }
  }