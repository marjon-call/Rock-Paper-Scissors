const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

async function mineNBlocks(n) {
  for (let index = 0; index < n; index++) {
    await ethers.provider.send('evm_mine');
  }
}


describe("RPS-Solidity", function () {
  async function deployRPSSolid() {

    const [owner, addy1, addy2] = await ethers.getSigners()

    const Solid = await ethers.getContractFactory("RockPaperScissorsSolid");
    const solid = await Solid.deploy();
    await solid.deployed();

   

    return { solid, owner, addy1, addy2 } 
  }


  it("RPS-Solidity: Game must be started to play", async function () {
    const { solid, owner, addy1, addy2 } = await loadFixture(deployRPSSolid);

    

    try {
      await solid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    } catch(e) {
      expect(e.message.includes("Game not in progress.")).to.equal(true)
    }
    

  });


  it("RPS-Solidity: Game start successfull", async function () {
    const { solid, owner, addy1, addy2 } = await loadFixture(deployRPSSolid);

    await solid.createGame(owner.address, addy1.address)

    const gameStart = await solid.gameInProgress()
    const player1 = await solid.player1()
    const player2 = await solid.player2()


    expect(gameStart).to.equal(true)
    expect(player1).to.equal(owner.address)
    expect(player2).to.equal(addy1.address)
    
  });




  it("RPS-Solidity: Player can make only one move for correct price", async function () {
    const { solid, owner, addy1, addy2 } = await loadFixture(deployRPSSolid);

    await solid.createGame(owner.address, addy1.address)

    try {
      await solid.playGame(2, {value: ethers.utils.parseEther("0.03")})
    } catch(e) {
      expect(e.message.includes("Player has not sent enough ether to play.")).to.equal(true)
    }

    await solid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    const slot2 = await ethers.provider.getStorageAt(solid.address , 2)
    const player1Move = ethers.BigNumber.from(slot2.slice(24, 26))
    expect(player1Move).to.equal(2)

    try {
      await solid.playGame(1, {value: ethers.utils.parseEther("0.05")})
    } catch(e) {
      expect(e.message.includes("User not authorized to make move.")).to.equal(true)
    }


    
  });


  it("RPS-Solidity: Outside player can't make a move", async function () {
    const { solid, owner, addy1, addy2 } = await loadFixture(deployRPSSolid);

    await solid.createGame(owner.address, addy1.address)

    try {
      await solid.connect(addy2).playGame(2, {value: ethers.utils.parseEther("0.05")})
    } catch(e) {
      expect(e.message.includes("User not authorized to make move.")).to.equal(true)
    }

  });


  it("RPS-Solidity: Only one game at a time", async function () {
    const { solid, owner, addy1, addy2 } = await loadFixture(deployRPSSolid);

    await solid.createGame(owner.address, addy1.address)



    try {
      await solid.createGame(owner.address, addy1.address)
    } catch(e) {
      expect(e.message.includes("Game still in progress.")).to.equal(true)
    }

  });


  it("RPS-Solidity: Proper game evalutaion", async function () {
    const { solid, owner, addy1, addy2 } = await loadFixture(deployRPSSolid);


    // checks tie
    let preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    let preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await solid.createGame(owner.address, addy1.address)
    await solid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    await solid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})

    let postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    let postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    let evalP1 = Math.round(preP1 - postP1)
    let evalP2 = Math.round(preP2 - postP2)

    let eval = evalP1 == evalP2

    expect(eval).to.equal(true)


    // check p1 rock, p2 scissors
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await solid.createGame(owner.address, addy1.address)
    await solid.playGame(1, {value: ethers.utils.parseEther("0.05")})
    await solid.connect(addy1).playGame(3, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 > evalP2

    expect(eval).to.equal(true)


    // check p1 paper, p2 rock
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await solid.createGame(owner.address, addy1.address)
    await solid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    await solid.connect(addy1).playGame(1, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 > evalP2

    expect(eval).to.equal(true)



    
    // check p1 scissors, p2 paper
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await solid.createGame(owner.address, addy1.address)
    await solid.playGame(3, {value: ethers.utils.parseEther("0.05")})
    await solid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 > evalP2

    expect(eval).to.equal(true)


    // check p2 rock, p1 scissors
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await solid.createGame(owner.address, addy1.address)
    await solid.playGame(3, {value: ethers.utils.parseEther("0.05")})
    await solid.connect(addy1).playGame(1, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 < evalP2

    expect(eval).to.equal(true)


    // check p2 paper, p1 rock
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await solid.createGame(owner.address, addy1.address)
    await solid.playGame(1, {value: ethers.utils.parseEther("0.05")})
    await solid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 < evalP2

    expect(eval).to.equal(true)


    // check p2 scissors, p1 paper
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await solid.createGame(owner.address, addy1.address)
    await solid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    await solid.connect(addy1).playGame(3, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 < evalP2

    expect(eval).to.equal(true)

  });


  it("RPS-Solidity: Terminate game works", async function () {
    const { solid, owner, addy1, addy2 } = await loadFixture(deployRPSSolid);

    await solid.createGame(owner.address, addy1.address)

    // cant cancel game in progress
    try {
      await solid.terminateGame()
    } catch(e) {
      expect(e.message.includes("Game has time left.")).to.equal(true)
    }

    // cancels when allowed success
    await mineNBlocks(await solid.gameLength() + 1)

    await solid.terminateGame()


    const gameStart = await solid.gameInProgress()
    const player1 = ethers.BigNumber.from(await solid.player1())
    const player2 = ethers.BigNumber.from(await solid.player2())

    expect(gameStart).to.equal(false)
    expect(player1).to.equal(0)
    expect(player2).to.equal(0)


    // check player 1 gets refund
    await solid.createGame(owner.address, addy1.address)

    await solid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    let postSent = await ethers.provider.getBalance(owner.address)

    await mineNBlocks(await solid.gameLength() + 1)
    await solid.terminateGame()

    let postEnd = await ethers.provider.getBalance(owner.address)

    let refund = postEnd > postSent

    expect(refund).to.equal(true)


    // check player 2 gets refund
    await solid.createGame(owner.address, addy1.address)

    await solid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})
    postSent = await ethers.provider.getBalance(addy1.address)

    await mineNBlocks(await solid.gameLength() + 1)
    await solid.terminateGame()

    postEnd = await ethers.provider.getBalance(addy1.address)

    refund = postEnd > postSent

    expect(refund).to.equal(true)


  });


});




//  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//  |                                                        |
//  |                                                        |
//  |                   HYBRID TEST                          |
//  |                                                        |
//  |                                                        |
//  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!




describe("RPS-Hybrid", function () {
  async function deployRPSHybrid() {

    const [owner, addy1, addy2] = await ethers.getSigners()

    const Hybrid = await ethers.getContractFactory("RockPaperScissorsHybrid");
    const hybrid = await Hybrid.deploy();
    await hybrid.deployed();

   

    return { hybrid, owner, addy1, addy2 } 
  }


  it("RPS-Hybrid: Game must be started to play", async function () {
    const { hybrid, owner, addy1, addy2 } = await loadFixture(deployRPSHybrid);

    

    try {
      await hybrid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    } catch(e) {
      expect(e.message.includes("Game not in progress.")).to.equal(true)
    }
    

  });


  it("RPS-Hybrid: Game start successfull", async function () {
    const { hybrid, owner, addy1, addy2 } = await loadFixture(deployRPSHybrid);

    await hybrid.createGame(owner.address, addy1.address)

    const gameStart = await hybrid.gameInProgress()
    const player1 = await hybrid.player1()
    const player2 = await hybrid.player2()


    expect(gameStart).to.equal(true)
    expect(player1).to.equal(owner.address)
    expect(player2).to.equal(addy1.address)
    
  });




  it("RPS-Hybrid: Player can make only one move for correct price", async function () {
    const { hybrid, owner, addy1, addy2 } = await loadFixture(deployRPSHybrid);

    await hybrid.createGame(owner.address, addy1.address)

    try {
      await hybrid.playGame(2, {value: ethers.utils.parseEther("0.03")})
    } catch(e) {
      expect(e.message.includes("Player has not sent enough ether to play.")).to.equal(true)
    }

    await hybrid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    const slot2 = await ethers.provider.getStorageAt(hybrid.address , 2)
    const player1Move = ethers.BigNumber.from(slot2.slice(24, 26))
    expect(player1Move).to.equal(2)

    try {
      await hybrid.playGame(1, {value: ethers.utils.parseEther("0.05")})
    } catch(e) {
      expect(e.message.includes("User not authorized to make move.")).to.equal(true)
    }


    
  });


  it("RPS-Hybrid: Outside player can't make a move", async function () {
    const { hybrid, owner, addy1, addy2 } = await loadFixture(deployRPSHybrid);

    await hybrid.createGame(owner.address, addy1.address)

    try {
      await hybrid.connect(addy2).playGame(2, {value: ethers.utils.parseEther("0.05")})
    } catch(e) {
      expect(e.message.includes("User not authorized to make move.")).to.equal(true)
    }

  });


  it("RPS-Hybrid: Only one game at a time", async function () {
    const { hybrid, owner, addy1, addy2 } = await loadFixture(deployRPSHybrid);

    await hybrid.createGame(owner.address, addy1.address)



    try {
      await hybrid.createGame(owner.address, addy1.address)
    } catch(e) {
      expect(e.message.includes("Game still in progress.")).to.equal(true)
    }

  });


  it("RPS-Hybrid: Proper game evalutaion", async function () {
    const { hybrid, owner, addy1, addy2 } = await loadFixture(deployRPSHybrid);


    // checks tie
    let preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    let preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await hybrid.createGame(owner.address, addy1.address)
    await hybrid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    await hybrid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})

    let postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    let postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    let evalP1 = Math.round(preP1 - postP1)
    let evalP2 = Math.round(preP2 - postP2)

    let eval = evalP1 == evalP2

    expect(eval).to.equal(true)


    // check p1 rock, p2 scissors
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await hybrid.createGame(owner.address, addy1.address)
    await hybrid.playGame(1, {value: ethers.utils.parseEther("0.05")})
    await hybrid.connect(addy1).playGame(3, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 > evalP2

    expect(eval).to.equal(true)


    // check p1 paper, p2 rock
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await hybrid.createGame(owner.address, addy1.address)
    await hybrid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    await hybrid.connect(addy1).playGame(1, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 > evalP2

    expect(eval).to.equal(true)



    
    // check p1 scissors, p2 paper
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await hybrid.createGame(owner.address, addy1.address)
    await hybrid.playGame(3, {value: ethers.utils.parseEther("0.05")})
    await hybrid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 > evalP2

    expect(eval).to.equal(true)


    // check p2 rock, p1 scissors
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await hybrid.createGame(owner.address, addy1.address)
    await hybrid.playGame(3, {value: ethers.utils.parseEther("0.05")})
    await hybrid.connect(addy1).playGame(1, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 < evalP2

    expect(eval).to.equal(true)


    // check p2 paper, p1 rock
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await hybrid.createGame(owner.address, addy1.address)
    await hybrid.playGame(1, {value: ethers.utils.parseEther("0.05")})
    await hybrid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 < evalP2

    expect(eval).to.equal(true)


    // check p2 scissors, p1 paper
    preP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    preP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    await hybrid.createGame(owner.address, addy1.address)
    await hybrid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    await hybrid.connect(addy1).playGame(3, {value: ethers.utils.parseEther("0.05")})

    postP1 = ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))
    postP2 = ethers.utils.formatEther(await ethers.provider.getBalance(addy1.address))

    evalP1 = postP1 - preP1
    evalP2 = postP2 - preP2

    eval = evalP1 < evalP2

    expect(eval).to.equal(true)

  });


  it("RPS-Hybrid: Terminate game works", async function () {
    const { hybrid, owner, addy1, addy2 } = await loadFixture(deployRPSHybrid);
   
    await hybrid.createGame(owner.address, addy1.address)
    
    // cant cancel game in progress
    try {
      await hybrid.terminateGame()

    } catch(e) {
      expect(e.message.includes("Game has time left.")).to.equal(true)
    }

    

    // cancels when allowed success
    await mineNBlocks(await hybrid.gameLength() + 1)


    await hybrid.terminateGame()

    const gameStart = await hybrid.gameInProgress()
    const player1 = ethers.BigNumber.from(await hybrid.player1())
    const player2 = ethers.BigNumber.from(await hybrid.player2())

    expect(gameStart).to.equal(false)
    expect(player1).to.equal(0)
    expect(player2).to.equal(0)


    // check player 1 gets refund
    await hybrid.createGame(owner.address, addy1.address)


    await hybrid.playGame(2, {value: ethers.utils.parseEther("0.05")})
    let postSent = await ethers.provider.getBalance(owner.address)

    await mineNBlocks(await hybrid.gameLength() + 1)
    await hybrid.terminateGame()

    let postEnd = await ethers.provider.getBalance(owner.address)

    let refund = postEnd > postSent

    expect(refund).to.equal(true)


    // check player 2 gets refund
    await hybrid.createGame(owner.address, addy1.address)

    await hybrid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})
    postSent = await ethers.provider.getBalance(addy1.address)

    await mineNBlocks(await hybrid.gameLength() + 1)
    await hybrid.terminateGame()

    postEnd = await ethers.provider.getBalance(addy1.address)

    refund = postEnd > postSent

    expect(refund).to.equal(true)


  });


});

