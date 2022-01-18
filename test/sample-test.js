const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();
    await market.deployed(); // deploy nft market contracts
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy();
    await nft.deployed(); // deploy nft contracts
    const nftContractAddress = nft.address;

    //get listing price
    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();

    // set an auction price 
    const auctionPrice = ethers.utils.parseUnits("100", "ethers");
    
    await nft.creatToken("https://www.mytokenlocation.com");
    await nft.creatToken("https://www.mytokenlocation2.com");

    // create 2 test token
    await market.creatMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice});
    // create 2 test nfts
    await market.creatMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice});

    const [_, buyerAddress] = await ethers.getSigners();

    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value: auctionPrice});

    // fetch market items
    const items = await market.fetchMarketItems();

    console.log('items:', items);



  });
});
