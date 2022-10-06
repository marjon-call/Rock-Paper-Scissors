// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [owner, addy1] = await ethers.getSigners()
  const Solid = await ethers.getContractFactory("RockPaperScissorsSolid");
  const solid = await Solid.deploy();
  await solid.deployed();

  await solid.createGame(owner.address, addy1.address)

  await solid.playGame(2, {value: ethers.utils.parseEther("0.05")})
  // reads the packed variable from storage slot 2
  const slot2 = await ethers.provider.getStorageAt(solid.address , 2)
  const player1Move = ethers.BigNumber.from(slot2.slice(24, 26))

  console.log(`Game1 Player1 move: ${player1Move}`)

  await solid.connect(addy1).playGame(2, {value: ethers.utils.parseEther("0.05")})


  
  await solid.createGame(owner.address, addy1.address)

  await solid.connect(addy1).playGame(1, {value: ethers.utils.parseEther("0.05")})
  // reads the packed variable from storage slot 3
  const slot3 = await ethers.provider.getStorageAt(solid.address, 3)
  const player2Move = ethers.BigNumber.from(slot3.slice(24, 26))

  console.log(`Game2 Player2 move: ${player2Move}`)

  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
