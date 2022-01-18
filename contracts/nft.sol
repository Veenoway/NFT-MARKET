//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract nft is ERC721URIStorage {
    // auto increment fieald for each token
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    //address of the nft market place

    address contractAddress;

    constructor(address marketplaceAddress) ERC721("Veeno", "VNO") {
        contractAddress = marketplaceAddress;
    }

    /// @notice create a new Token
    /// @param tokenURI : token URI
    function createToken(string memory tokenURI) public returns(uint) {
        // set a new token id for the token to be minted
        _tokenIds.increment(); // 0, 1, 2 etc...
        uint newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId); // mint the token
        _setTokenURI(newItemId, tokenURI); // generate the URI
        setApprovalForAll(contractAddress, true); // grant permission to marketplace

        //return token ID
        return newItemId; // Frontend access to itemId with web3js
    }


}