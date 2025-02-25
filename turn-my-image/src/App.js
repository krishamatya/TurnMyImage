import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [nftUrl, setNftUrl] = useState('');

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Upload file to IPFS
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post('http://localhost:5000/upload', formData);
        const fileUrl = uploadRes.data.fileUrl;

        // Mint NFT
        const mintRes = await axios.post('http://localhost:5000/mint-nft', {
            fileUrl,
            title,
            description,
            address: walletAddress,
        });

        setNftUrl(mintRes.data.tokenURI);
        alert(`NFT Minted! Transaction: ${mintRes.data.transactionHash}`);
    };

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Mint Your NFT</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} required />
                <input type="text" placeholder="Title" onChange={(e) => setTitle(e.target.value)} required />
                <input type="text" placeholder="Description" onChange={(e) => setDescription(e.target.value)} required />
                <input type="text" placeholder="Wallet Address" onChange={(e) => setWalletAddress(e.target.value)} required />
                <button type="submit">Mint NFT</button>
            </form>

            {nftUrl && (
                <div>
                    <h3>Minted NFT:</h3>
                    <a href={nftUrl} target="_blank" rel="noopener noreferrer">{nftUrl}</a>
                </div>
            )}
        </div>
    );
}

export default App;
