import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {ethers} from "ethers"
import { useEffect, useState } from "react"
import axios from "axios"
import web3Modal from "web3modal"
import { nftaddress, nftmarketaddress } from "../config";
import NFT from "../artifacts/contracts/nft.sol/nft.json";
import Market from "../artifacts/contracts/nftMarket.sol/nftMarket.json";

export default function Home() {

  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {

    async function loadNfts() {

      const provider = new ethers.providers.JsonRpcProvider()
      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
      const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider);

      // return an array of unsold items
      const data = await marketContract.fetchMarketItems();

      const items = await Promise.all(data.map(async i => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenURI);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price, 
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.image,
          description: meta.data.description,
        }

        return item;

      }));

      setNfts(items);
      setLoadingState('loaded');
      
    }

    async function buyNFT(nft) {

      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);

      //sign the transaction 
      const signer = provider.getSigner();
      const contract = ethers.Contract(nftmarketaddress, Market.abi, signer);

      //set the price
      const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

      //make the sale
      const transaction = await contract.createMarketSale(nftaddress, nft, tokenId, {
        value:price
      });
      await transaction.wait();
      loadNfts()
    }

    if (loadingState === 'loaded' && !nfts.length) return (
      <h1 className="px-20 py-10 text-3xl">No items in markertplace</h1>
    )


  }, [])


  return (
    <div className={styles.container}>
      <h1>Welcome to home !</h1>
    </div>
  )
}
