require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { create } = require('ipfs-http-client');
const Web3 = require('web3');
const cors = require('cors');

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Load env variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const ABI = require('./abi.json'); // Replace with your contract's ABI

// Initialize Web3
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));

// Connect to IPFS
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

// Setup contract instance
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

// Upload Image to IPFS
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = await ipfs.add(req.file.buffer);
        res.json({ fileUrl: `https://ipfs.infura.io/ipfs/${file.path}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Mint NFT
app.post('/mint-nft', async (req, res) => {
    try {
        const { fileUrl, title, description, address } = req.body;

        // Upload metadata to IPFS
        const metadata = { name: title, description, image: fileUrl };
        const { path } = await ipfs.add(JSON.stringify(metadata));
        const tokenURI = `https://ipfs.infura.io/ipfs/${path}`;

        // Mint NFT
        const nonce = await web3.eth.getTransactionCount(OWNER_ADDRESS, 'latest');
        const tx = {
            from: OWNER_ADDRESS,
            to: CONTRACT_ADDRESS,
            nonce: web3.utils.toHex(nonce),
            gas: 500000,
            data: contract.methods.mintNFT(address, tokenURI).encodeABI(),
        };

        // Sign and send transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.json({
            success: true,
            transactionHash: receipt.transactionHash,
            tokenURI,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Minting failed' });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
