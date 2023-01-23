object "RockPaperScissorsYul" {

    code {
        sstore(1, 0xB1A2BC2EC50000)
        sstore(3, 0x0000000000000000000000000000000000000000000000000000000000000000)
        datacopy(0, dataoffset("runtime"), datasize("runtime"))
        return(0, datasize("runtime"))
    }

    object "runtime" {

        // Storage Layout:
        // slot 0 : gameStart
        // slot 1 : gameCost
        // slot 2 : bytes 13 - 32 : player1
        // slot 2 : bytes 12 : player1Move
        // slot 3 : bytes 13 - 32 : player2
        // slot 3 : bytes 12 : player2Move
        // slot 3 : bytes 11 : gameInProgress
        // slot 3 : bytes 10  : lockGame
        // slot 3 : bytes 9 - 8 : gameLength


// creatGame() 
// 0xa6f979ff0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc4000000000000000000000000ab8483f64d9c6d1ecf9b849ae677dd3315835cb2

// playGame()
// 0x985d4ac30000000000000000000000000000000000000000000000000000000000000001

// terminateGame()
// 0x97661f31

               
          
        
        code {
            let callData := calldataload(0)
            let selector := shr(0xe0, callData)

            switch selector

            // createGame(address, address)
            case 0xa6f979ff {

                let slot3 := sload(3)

                // get gameInProgress from storage
                let gameInProgress := and(0xff, shr( mul( 21, 8),  slot3) )
                // if game in progress set, revert
                if eq(gameInProgress, 1) {
                    revert(0,0)
                }

                // copies calldata to memory without function selector
                calldatacopy(0, 4, calldatasize())
                // gets address 1 & 2
                let address1 := and(0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff, mload(0x00))
                let address2 := and(0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff, mload(0x20))

                // stores block of game start & player1 to storage
                sstore(0, number())
                sstore(2, address1)

                // packs gameLength, gameInProgress, and player2 into slot 3
                let glAndGip := or(0x0000000000000000000001000000000000000000000000000000000000000000, slot3)
                sstore(3, or(glAndGip, address2))

                

            }


            // creatGame() 
              // 0xa6f979ff0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc4000000000000000000000000ab8483f64d9c6d1ecf9b849ae677dd3315835cb2
            // playGame()
            // 0x985d4ac30000000000000000000000000000000000000000000000000000000000000001
                
            // playGame(uint8)
            case 0x985d4ac3 {

                calldatacopy(0, 4, calldatasize())

                // stores move and slot varibles to stack
                let move := mload(0x00)
                let slot2 := sload(2)
                let slot3 := sload(3)
              
                
                
                // get lockGame from storage
                let lockGame := and( 0xff, shr( mul(22, 8), slot3) )
                // checks game is not locked
                if eq(lockGame, 1) {
                    revert(0,0)
                }


                // get gameInProgress from storage
                let gameInProgress := and(0xff, shr( mul( 21, 8), slot3 ) )
                // if game in progress not set, revert
                if iszero(gameInProgress) {
                    revert(0,0)
                }

                // if not enough ether sent revert
                if gt(sload(1), callvalue()) {
                    revert(0,0)
                }


                // if invalid move revert
                if lt(move, 1) {
                    revert(0,0)
                }

                // if invalid move revert
                if gt(move, 3) {
                    revert(0,0)
                }
                

                // gets player 1 move and player 2 move from storage
                let player1Move := shr( mul(20, 8), slot2 )
                let player2Move := and(0xff, shr( mul(20, 8), slot3 ) )

                // get player1 and player2 
                let player1 := and(0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff,  slot2 )
                let player2 := and(0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff,  slot3 )

            
                // checks if player1 and move made already, else sets player1Move
                if eq(caller(), player1) {
                    if gt(player1Move, 0) {
                        revert(0,0)
                    }

                    let moveShifted := shl( mul(20, 8), move)
                    sstore(2, or(moveShifted, slot2) )

                    // checks if both players have made a move
                    if gt(player2Move, 0) {

                        // lock from reentrancy
                        sstore(3, or(0x0000000000000000000100000000000000000000000000000000000000000000, sload(3) ))

                        evaluateGame()

                        // unlock from reentrancy
                        sstore(3, and(0xffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffffffff, sload(3)))

                        stop()
                    }

                }

               

                // checks if player2 and move made already, else sets player2Move
                if eq(caller(), player2) {
                    if gt(player2Move, 0)  {
                        revert(0,0)
                    }
                    
                    let moveShifted := shl( mul(20, 8), move)

                    let newSlot3Value := or(moveShifted, slot3)
                    

                    // checks if both players have made a move
                    if gt(player1Move, 0) {
                        sstore(3, or(0x0000000000000000000100000000000000000000000000000000000000000000, newSlot3Value) )
                        evaluateGame()

                        // unlock from reentrancy
                        sstore(3, and(0xffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffffffff, sload(3)))

                        stop()
                    }

                    // store new slot 3 value
                    sstore(3, newSlot3Value)
                }


            }


            case 0x97661f31 {

                // gets gameStart and gameLength from storage
                let gameStart := sload(0)
                let gameLength := shr(mul(23,8), sload(3))

                // checks if block number is greater than gameStart + gameLength, else reverts
                if iszero( gt( number(), add(gameStart, gameLength)) ) {
                    revert(0,0)
                }

                // get gameInProgress from storage
                let gameInProgress := and(0xff, shr( mul( 21, 8), sload(3) ) )

                // if game in progress not set, revert
                if iszero(gameInProgress) {
                    revert(0,0)
                }

                // loads player1 move, if the move is made, then transfer player 1 their ether back
                let player1Move := and(0xff, shr( mul(20, 8), sload(2) ) )
                if iszero( eq(player1Move, 0) )  {
                    let player1 := and(0xffffffffffffffffffffffffffffffffffffffff , sload(2))
                    pop( call(gas(), player1, selfbalance(), 0, 0, 0, 0) )
                }

                // loads player2 move, if the move is made, then transfer player 2 their ether back
                let player2Move := and(0xff, shr( mul(20, 8), sload(3) ) )
                if iszero( eq(player1Move, 0) )  {
                    let player2 := and(0xffffffffffffffffffffffffffffffffffffffff , sload(2))
                    pop( call(gas(), player2, selfbalance(), 0, 0, 0, 0) )
                }
                


                // set all game play variables to 0 except gameLength and gameCost 
                sstore(0,0)
                sstore(2, 0)
                let gameLengthShifted := shr(mul(23,8), sload(3))
                let gameLengthVal := shl(mul(23,8), gameLengthShifted)
                sstore(3, gameLengthVal)
                
            }
           

            

            default {
                revert(0,0)
            }


            // evaluate game function
            function evaluateGame() {

                let slot2 := sload(2)
                let slot3 := sload(3)

                // gets player 1 move and player 2 move from storage
                let player1Move := shr( mul(20, 8), slot2 )
                let player2Move := and(0xff, shr( mul(20, 8), slot3 ) )

                let player1 := and(0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff,  slot2 )
                let player2 := and(0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff,  slot3 )

                // if tie players split the pot
                if eq(player1Move, player2Move) {
                    pop( call(gas(), player1, div(selfbalance(), 2), 0, 0, 0, 0) )
                    pop( call(gas(), player2, selfbalance(), 0, 0, 0, 0) )
                    resetGame()
                    leave
                }

                // if player1 moves 1 and player2 moves 3, player1 wins, else player2 wins
                if eq(player1Move, 1) {
                    if eq(player2Move, 3) {
                        pop( call(gas(), player1, selfbalance(), 0, 0, 0, 0) )
                        resetGame()
                        leave
                    }
                    pop( call(gas(), player2, selfbalance(), 0, 0, 0, 0) )
                    resetGame()
                    leave
                }

                // if player1 moves 2 and player2 moves 1, player1 wins, else player2 win
                if eq(player1Move, 2) {
                    if eq(player2Move, 1) {
                        pop( call(gas(), player1, selfbalance(), 0, 0, 0, 0) )
                        resetGame()
                        leave
                    }
                    pop( call(gas(), player2, selfbalance(), 0, 0, 0, 0) )
                    resetGame()
                    leave
                }

                // if player1 moves 3 and player2 moves 2, player1 wins, else player2 win
                if eq(player1Move, 3) {
                    if eq(player2Move, 2) {
                        pop( call(gas(), player1, selfbalance(), 0, 0, 0, 0) )
                        resetGame()
                        leave
                    }
                    pop( call(gas(), player2, selfbalance(), 0, 0, 0, 0) )
                    resetGame()
                    leave
                }


            }

            // resets variables so a new game can be played
            function resetGame() {
                sstore(0,0)
                sstore(2, 0)
                let gameLengthShifted := shr(mul(23,8), sload(3))
                let gameLengthVal := shl(mul(23,8), gameLengthShifted)
                sstore(3, gameLengthVal)
            }



            function getStorage() {
                mstore(0x00, sload(0))
                mstore(0x20, sload(1))
                mstore(0x40, sload(2))
                mstore(0x60, sload(3))

                return(0x00, 0x80)
            }


            

        }


    }

}
