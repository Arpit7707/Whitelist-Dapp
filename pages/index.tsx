import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import Web3Modal from "web3modal";
import { useState, useEffect, useRef } from 'react'
import { Contract, providers } from 'ethers';
import {abi, WHITELIST_CONTRACT_ADDRESS } from '../constants/index'

export default function Home() {
  
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // numberOfWhitelisted tracks the number of addresses's whitelisted
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
   const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  
  const [str, setStr] = useState()

  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3Modalref = useRef()


  const getProviderOrSigner = async (needSigner = false)=>{
   try{
       // Connect to Metamask
       // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
       const provider = await web3Modalref.current.connect() //this line returns provider and we're storing it in provider variable
       // variable provider is just an object, we can't do anything by it
       //by wrapping around it by Web3Provider object we can perform many operation like getting chain ID etc
       const web3Provider = new providers.Web3Provider(provider) 
 
       const {chainId} = await web3Provider.getNetwork()
       if(chainId !== 5){
          window.alert("Change the network to Goerli")
          throw new Error("Change network to Goerli")
       }

       //Get signer also if needSigner is true
       if(needSigner){
        const signer =  web3Provider.getSigner()
        return signer
       }
       return web3Provider
   }catch(err){
    console.error(err)
   }
  }

  const addAddressToWhitelist = async()=>{
      try{
           const signer = await  getProviderOrSigner(true)
           const whitelistContract = new Contract(
            WHITELIST_CONTRACT_ADDRESS ,
            abi,
            signer
           )
           const tx = await whitelistContract.addAddressToWhitelist()
           setLoading(true)
           await tx.wait()
           setLoading(false)
           await getNumberofWhitelisted()
           setJoinedWhitelist(true)
      }catch(err){
        console.error(err)
      }
  }

  const checkIfAddressWhitelisted = async ()=>{
     try{
      // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place
        const signer = await getProviderOrSigner(true)
        const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS ,
          abi,
          signer
        )
        const address = await signer.getAddress()
        const _joinedWhitelist = await whitelistContract.whitelistedAddresses(address)
        setJoinedWhitelist(_joinedWhitelist)
        }catch(err){
      console.error(err)
     }
   }
  
  const getNumberofWhitelisted = async ()=>{
    try{
       const provider = await getProviderOrSigner()
       const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS ,
        abi,
        provider
       )
       const _numOfWhitelisted = await whitelistContract.numAddressesWhitelisted()
       setNumberOfWhitelisted(_numOfWhitelisted)
      
    }catch(err){
      console.error(err)
    }
  }


  const connectWallet = async ()=>{
   try{
     // Get the provider from web3Modal, which in our case is MetaMask
     // When used for the first time, it prompts the user to connect their wallet
     await getProviderOrSigner()
     setWalletConnected(true)
     checkIfAddressWhitelisted()
     getNumberofWhitelisted()
   }catch(err){
    console.error(err)
   }
  }

  
  const renderButton =  ()=>{
    // const [renderbutton, setrenderbutton] = useState([])
    if(walletConnected){

      if(joinedWhitelist){
        return(
          <div className={styles.description}>
            Thanks for joining Whitelist!
          </div>
        )
      }else if(loading){
        return(
         <button className={styles.button}>
           Loading...
         </button>
        )
        
      }
      else{
        return(
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join The Whitelist
          </button>
        )
      }
     
    }  else{
      return(
        <button onClick={connectWallet} className={styles.button}>
           Connect Your Wallet
        </button>
      )
    }
  }

//  useEffect(()=>{
//   let editable = document.getElementsByClassName("editable")
//   if(walletConnected){

//     if(joinedWhitelist){
      
      
//     }else if(loading){
     
      
      
//     }
//     else{
   
//     }
   
//   }  else{
  
//   }
//  }, [walletConnected,joinedWhitelist, loading])  


  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(()=>{
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
   if(!walletConnected){
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
     web3Modalref.current = new Web3Modal({
      network: "goerli",
      providerOptions: {},
      disableInjectedProvider: false,
    })
    connectWallet()
   }

   
  },[walletConnected])

  return (
    
    <div>
      <Head>
       <title>Whitelist dApp</title>
       <meta name="description" content="Whitelist-Dapp" />
      </Head>
      
        <div className={styles.main}>
          <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
          {numberOfWhitelisted} have already joined the Whitelist
          </div>
            {renderButton()}
         </div> 
         <div >
           <img  className={styles.image} src="./crypto-devs.svg" />
         </div>
        </div>

   
      <footer className={styles.footer}>
      Made with &#10084;  by Arpit Jethava

      </footer>
    </div>
    
  )
}
