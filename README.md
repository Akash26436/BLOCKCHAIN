# VeriChain: Blockchain-Based Content Provenance System

## 1 Abstract
The rapid advancement of artificial intelligence and generative models has enabled the creation of highly realistic digital content. While these technologies provide significant benefits, they also introduce serious risks including misinformation, identity impersonation, digital forgery, and deepfake attacks. This project proposes a decentralized, cross-platform blockchain-based provenance system for verifying digital content authenticity.

## 2 Introduction
With the emergence of generative AI models, it has become trivial to create synthetic content. Traditional fake content detection techniques are reactive and error-prone. This project adopts a proactive approach by focusing on content provenance—verifying the origin and history of content using blockchain technology.

## 3 Problem Statement
- Centralized verification systems lack transparency and trust.
- Metadata-based verification fails due to stripping during uploads.
- No universal standard for cross-platform content authenticity.
- AI-generated content can evade detection models.

## 4 Objectives
- Design a decentralized content provenance system using blockchain.
- Implement smart contracts for content registration and verification.
- Detect manipulated content through provenance validation.
- Provide immutable audit trails for content verification.

## 5 System Architecture
The system follows a hybrid architecture where the blockchain acts as the trust layer and media content is stored off-chain (IPFS).

### 5.1 Actors
- **Content Creator**: Registers fingerprints of original content.
- **Online Platform**: Verifies content authenticity against the blockchain.
- **Blockchain Network**: Provides the immutable ledger.
- **Smart Contracts**: Automate registration, verification, and auditing.
- **End User**: Verifies content provenance before consumption.

## 6 Smart Contract Design
1. **Content Registry**: Stores original content fingerprints (SHA-256 + pHash) and creator identity.
2. **Verification Contract**: Verifies uploaded content against blockchain records.
3. **Audit Log Contract**: Maintains immutable logs of all verification attempts.

## 7 Implementation
- **Smart Contracts**: Solidity (Ethereum/Hardhat)
- **Frontend**: React.js
- **Wallet**: MetaMask
- **Storage**: IPFS (off-chain)
- **Local Network**: Ganache / Hardhat Node

## 9 Realistic Demo Setup Guide
For the best project demonstration, follow these steps to simulate a production environment:

### 9.1 Local Node (Ganache)
1. Run `npx hardhat node` to start your local blockchain.
2. In the frontend dashboard, click **Connect Wallet** and select a private key from the Ganache output.

### 9.2 Off-Chain Storage (IPFS)
1. Upload a file in the **Register Original Content** section.
2. The system will automatically compute the **SHA-256** and **Perceptual Hash** locally.
3. It will then simulate an upload to **IPFS** and return a valid **CIDv1**.
4. Click **Establish Provenance** to store only the hashes and CID on the blockchain.

### 9.4 Gasless Demo Mode (Zero-Fee Experience)
For a frictionless demonstration without MetaMask popups:
1. Toggle the **DEMO MODE** switch in the top header.
2. The indicator will turn blue and show **Relayer Active**.
3. All transactions (Register/Verify) will now be signed instantly by a local relayer account.
4. This creates a "gasless" feel where the user never sees a transaction fee prompt.

✅ **Setup complete. The system is ready for a professional, zero-friction provenance demonstration.**
