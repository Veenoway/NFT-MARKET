//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // prevents re-entrancy attacks

contract nftMarket is ReentrancyGuard {
    using Counters for Counters.Counters;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemSold; //total number of items soldout
    
    address payable owner; // Owner of the smart contract 
    // people have to pay to buy their NFT on this marketplace
    uint listingPrice = 0.025 ether;

    constructor(){
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint  tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }

    // a way to access value of the market items struct above by passing an integer ID
    mapping(uint => MarketItem) private idMarketItem;

    // log message when item is sold
    event MarketItemCreated( 
        uint indexed itemId,
        address indexed nftContract,
        uint indexed tokenId,
        address seller,
        address owner,
        uint price,
        bool sold
    );

    /// @notice function to get listing price
    function getListingPrice() public view returns(uint) {
        return listingPrice;
    }

    function setListingPrice(uint _price) public returns(uint){
        if (msg.sender == address(this) ){
            listingPrice = _price;
        }
        return listingPrice;
    }
    

    /// @notice function to create market item
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price) public payable nonReentrant{
            require(price > 0, "Price must be above zero");
            require(msg.value == listingPrice, "Price must be equal to listing price"); // require == if (msg.value != listingPrice) { return "Price must be equal to listing price"}
            
            _itemIds.increment();
            uint256 itemID = _itemIds.current();

            idMarketItem[itemId] = MarketItem(
                itemId,
                nftContract,
                tokenId,
                payable(msg.sender), // address of the seller putting the up for sale
                payable(address(0)), // no owner yet (set oswner to empty address)
                price,
                false
            );

            // transfer ownership of the nft to the contract itself
            IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

            emit MarketItemCreated(
                itemId,   // Equivalent to console.log()
                nftContract,
                tokenId,
                msg.sender,
                address(0),
                false
            ); 

        }

        /// @notice function to create a sale from

        function createMarketSale(
            address nftcontract,
            uint256 itemId) public payable nonReentrant{
            uint price = idMarketItem[itemId].price;
            uint tokenId = idMarketItem[itemId].itemId;

            require(msg.value == price, "Please submit the asking price in order to complete pruchase");

            // pay the seller the amount
            idMarketItem[itemId].seller.transfer(msg.value);

            // transfer ownership of the nft to the contract itself to the buyer
            IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

            idMarketItem[itemId].owner = payable(msg.sender); // mark buyer as new owner
            idMarketItem[itemId].sold = true; // mark that it has been sold
            _itemsSold.increment(); // Increment the total number of Items sold by 1
            payable(owner).transfer(listingPrice); // Pay owner of contract the listing price
        }

        /// @notice total number of items unsold on our platform

        function fetchMarketItems() public view returns(marketItem[] memory ) {
            uint itemCount = _itemIds.current(); // total number of items ever created on our platform
            uint unsoldItemCount = _itemIds.current() - _itemsSold.current(); // total number of items that are unsold = total items ever created - total items unsold
            uint currentIndex = 0;

            MarketItem[] memory items = new MarketItem[](unsoldItemCount);

            //look trough all items ever created
            for(uint i=0;i<itemCount; i++) {

                //get only unsold item
                //check if item has not been sold
                //by checking if the owner field is empty
                if(idMarketItem[i+1].owner == address(0)) {

                    //yes this item has never been soldout
                    uint currentId = idMarketItem[i+1].itemId;
                    MarketItem storage currentItem = idMarketItem[currentId];
                    items[currentIndex] = currentItem;
                    currentIndex += 1;
                }
            }
            return items;
        }

        /// @notice fethc list of NFTS owned/bought by this user
        function fetchMyNfts() public view returns(MarketItem[] memory) {
            //get total number of items ever created
            uint totalItemCount = _itemIds.current();
            uint itemCount = 0;
            uint currentIntdex = 0;

            for(uint i=0;i<totalItemCount;i++){
                // get only the item that this user as bought/is the owner
                if(idMarketItem[i+1].owner == msg.sender) {
                    itemCount += 1;
                }
            }

            MarketItem[] memory items = new MarketItem[](itemCount);

            for (uint i=0;i<totalItemCount;i++){

                if(idMarketItem[i+1].owner == msg.sender) {

                    uint currentId = idMarketItem[i + 1];
                    MarketItem storage currentItem = idMarketItem[currentId];
                    items[currentIndex] = currentItem;
                    currentIndex += 1;
                }
            }
            return items;
        }

         /// @notice fetch list of NFTS created by this user
        function fetchItemsCreated() public view returns(MarketItem[] memory) {
            //get total number of items ever created
            uint totalItemCount = _itemIds.current();
            uint itemCount = 0;
            uint currentIntdex = 0;

            for(uint i=0;i<totalItemCount;i++){
                // get only the item that this user as bought/is the owner
                if(idMarketItem[i+1].seller == msg.sender) {
                    itemCount += 1;
                }
            }

            MarketItem[] memory items = new MarketItem[](itemCount);

            for (uint i=0;i<totalItemCount;i++){

                if(idMarketItem[i+1].seller == msg.sender) {
                    
                    uint currentId = idMarketItem[i + 1];
                    MarketItem storage currentItem = idMarketItem[currentId];
                    items[currentIndex] = currentItem;
                    currentIndex += 1;
                }
            }
            return items;
        }

        ///
        function
}

