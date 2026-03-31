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

## 8 Security Analysis
Ensures data integrity through cryptographic hashing, non-repudiation through immutable records, and auditability through on-chain logs.
