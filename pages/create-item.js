import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from 'next/router';
import Web3Modal from "web3modal";
import Image from "next/image";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

import { 
    nftaddress,nftmarketaddress
} from "../config";
import NFT from "../artifacts/contracts/nft.sol/nft.json";
    
import Market from "../artifacts/contracts/nftMarket.sol/nftMarket.json";

export default function createItem() {
    
    const [ fileUrl, setFileUrl ] = useState(null);
    const [ formInput, updateFormInput ] = useState({price: '', name: '', description: ''});
    const router = useRouter(); 

    async function onChange(e) {
        const file = e.target.files[0]
        try{ // try updating the file

            const added = await client.add(file,
            {
                progress: (prog) => console.log(`receveid:${prog}`)
            }
        )

        //file saved in the url path
        const url=`https://ipfs.infura.io/ipfs/${added.path}`
        setFileUrl(url);

        }catch(err){
            console.log(err)
        }
    }

    //1. create item (image/video) and upload to ipfs
    async function createItem() {
        const {name, description, price} = formInput; // get value from the form input

        
        if (!name|| !description || !price || !fileUrl) {
            return
        }
        
        const data = JSON.stringify({
            name, description, image: fileUrl
        });
        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            // pass the url to save eit on polygon after it has been uploaded to ipfs
            createSale(url)

        } catch(err) {
            console.log(`Error uploading file`, err)
        }
    }


    //2. List item for sale
    async function createSale(url){
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);

        // sign the transaction*
        const signer = provider.getSigner();
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer); 
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

        // get the tokenId from the transaction that occured above
        // there events array that is returned, the first it from that event 
        //is the event, third item is the token id
        console.log('Transaction : ',tx)
        console.log('Transaction events: ',tx.events[0])
        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber(); // we need to convert it a number

        // get a reference to the price entered in the form 
        const price = ethers.utils.parseUnits(formInput.price, 'ether');

        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer); 

        //get the listing price 
        let listingPrice = await contract.getListingPrice();
        listingPrice = listingPrice.toString();

        transaction = await contract.createMarketItem(
            nftaddress, tokenId, price, {value: listingPrice }
        )

        await transaction.wait();
        
        router.push('/')

    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="Asset Name"
                    className="mt-8 "
                    onChange={e => updateFormInput({...formInput, name: e.target.value})}
                    />
                <textarea
                    placeholder="Item Description"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, description: e.target.value})}
                    />
                <input
                    placeholder="Asset Price in Eth"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, price: e.target.value})}
                    />
                <input 
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                    />
                {
                    fileUrl && (
                        <Image className="rounded mt-4" width={350} height={500} src={fileUrl} alt="nft"/>
                    )
                }
                <button onClick={createItem} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">Create NFT</button>
                
            </div>
        </div>
    )

}