# Rock-Paper-Scissors
The classic game created into a series of smart contracts. The original contract is a basic version, then I optimize the contract for gas savings.

```RockPaperScissorsSolid.sol``` and ```RockPaperScissorsHybrid.sol``` play the same way. The only difference between the contracts is that ```RockPaperScissorsHybrid.sol``` uses assembly blocks (yul) to save on gas costs.

## How to play:
A user must create a game using ```createGame(address _player1, address _player2) external```. This function takes 2 adresses for the players and can only be called when a game is not in progress. <br>
After a game is created both players can choose their move with ```playGame(uint8 _move) external payable```. The cost to play is 0.05 ether and each player is only allowed to make one move. Use 1 for rock, 2 for paper, and 3 for scissors. <br>
Once both players make their move ```evaluateGame() private``` is called to check the outcome of the game and distributes the ether to the winner, or splits the ether if the game is a tie. <br>
If the game is taking too long any spectator can call ```terminateGame() external``` so they can play a game. In this case, the ether is sent to a player who has made their move already.

## CAVEAT:
Since no data on a blockchain is truly private, an unsuspecting player can easily be taken advantage of by having their move read. ```scripts\hackTheGame.js``` shows a demonstration on how to read your opponents move. This contract is not meant to be used for competive play. It is simply a demonstartion on how gas optimizations can save the users gas.


## Gas Savings:
Below shows the gas savings by using ```RockPaperScissorsHybrid.sol``` instead of ```RockPaperScissorsSolid.sol```:  <br> <br>
![gasSavingsForRPS](https://user-images.githubusercontent.com/25438255/194196775-a42aba7c-3d06-42c9-8716-ddeae9656b1b.png)


## YUL
```RockPaperScissorsYul.sol``` was created to show how the game can be written in yul.  To test it, open remix and call the contract using the same paramaters for calldata. I have not tested the gas consumption as rigouriosly yet since hardhat does not support contracts fully written in yul. However here is my initial findings using remix: <br>

```playGame(uin8 _move) external payable```: min: 31480 gas, max: 39815 gas  <br>
```createGame(address _player1, address _player2) external```: 71348 gas <br>
```terminateGame() external```: 29372 gas
