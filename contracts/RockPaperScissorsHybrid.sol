pragma solidity^0.8.17;


contract RockPaperScissorsHybrid {

    uint256 public gameStart;
    uint256 public gameCost;
    address public player1;
    uint8 private player1Move;
    address public player2;
    uint8 private player2Move;
    bool public gameInProgress;
    bool public lockGame;
    uint16 public gameLength;
    
    

    event GameOver(address Winner, address Loser);
    event GameStart(address Player1, address Player2);
    event TieGame(address Player1, address Player2);
    event GameTerminated(address Loser1, address Loser2);


    constructor() {
        gameCost = 0.05 ether;
        gameLength = 2880; 
    }

    // must be called by one of the players
    // input must be a uint8 representing its moves
    // game costs 0.05 ether to play
    // 1 = rock
    // 2 = paper
    // 3 = scissors
    // 2 > 1, 3 > 2, 1 > 3
    function playGame(uint8 _move) external payable {
        require(lockGame == false);
        require(gameInProgress == true, "Game not in progress.");
        require(msg.value >= gameCost, "Player has not sent enough ether to play.");
        require(_move > 0 && _move < 4, "Invalid move");

        lockGame = true;

        if (msg.sender == player1 && player1Move == 0){
            player1Move = _move;
        } else if(msg.sender == player2 && player2Move == 0) {
            player2Move = _move;
        } else {
            require(1 == 0, "User not authorized to make move.");
        }
        
        if (player1Move != 0 && player2Move != 0) {
            evaluateGame();
        }
        lockGame = false;
    }

    // function used to evaluate winner
    // sends out winnings
    // clears previus games data
    function evaluateGame() private {

        address _player1 = player1;
        uint8 _player1Move = player1Move;
        address _player2 = player2;
        uint8 _player2Move = player2Move;

        if (_player1Move == _player2Move) {
            _player1.call{value: address(this).balance / 2}("");
            _player2.call{value: address(this).balance}("");
            emit TieGame(_player1, _player2);
        } else if ((_player1Move == 1 && _player2Move == 3 ) || (_player1Move == 2 && _player2Move == 1)  || (_player1Move == 3 && _player2Move == 2)) {
            _player1.call{value: address(this).balance}("");
            emit GameOver(_player1, _player2);
        } else {
            _player2.call{value: address(this).balance}("");
            emit GameOver(_player2, _player1);
        }

        assembly {
            sstore(0,0)
            sstore(2, 0)
            let gameLengthShifted := shr(mul(23,8), sload(3))
            let gameLengthVal := shl(mul(23,8), gameLengthShifted)
            sstore(3, gameLengthVal)
        }
        
    }

    // allows users to create a new game
    function createGame(address _player1, address _player2) external {
        require(gameInProgress == false, "Game still in progress.");

        assembly {
            sstore(0, number())
            sstore(2, _player1)
            let gameLengthShifted := shr(mul(23,8), sload(3))
            let gameLengthVal := shl(mul(23,8), gameLengthShifted)
            let glAndGip := or(0x0000000000000000000001000000000000000000000000000000000000000000, gameLengthVal)
            sstore(3, or(glAndGip, _player2))
        }
        
        
    }

    // if the game takes too long to play a user can end the game so they can play a new game
    function terminateGame() external {
        require(gameStart + gameLength < block.number, "Game has time left.");
        require(gameInProgress == true, "Game not started");


        if(player1Move != 0) {
            player1.call{value: address(this).balance}("");
        } else if(player2Move != 0) {
            player2.call{value: address(this).balance}("");
        }
        
        assembly {
            sstore(0,0)
            sstore(2, 0)
            let gameLengthShifted := shr(mul(23,8), sload(3))
            let gameLengthVal := shl(mul(23,8), gameLengthShifted)
            sstore(3, gameLengthVal)
        }

        emit GameTerminated(player1, player2);
    }



}
