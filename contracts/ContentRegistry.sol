// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ContentRegistry {
    struct Content {
        string contentHash;     // SHA-256 hash
        string perceptualHash;  // Perceptual hash for image/video
        string ipfsCID;         // IPFS Content Identifier
        address creator;        // Creator's wallet address
        uint256 timestamp;      // Registration timestamp
    }

    // Mapping from contentHash -> Content
    mapping(string => Content) public contents;
    // Mapping to check if perceptual hash exists (optional check for similarity)
    mapping(string => bool) public perceptualHashExists;
    // Mapping from perceptualHash -> contentHash
    mapping(string => string) public pHashToContentHash;

    event ContentRegistered(
        string indexed contentHash,
        string perceptualHash,
        string ipfsCID,
        address indexed creator,
        uint256 timestamp
    );

    error ContentAlreadyExists(string contentHash);

    function registerContent(
        string memory _contentHash,
        string memory _perceptualHash,
        string memory _ipfsCID
    ) external {
        if (contents[_contentHash].timestamp != 0) {
            revert ContentAlreadyExists(_contentHash);
        }

        contents[_contentHash] = Content({
            contentHash: _contentHash,
            perceptualHash: _perceptualHash,
            ipfsCID: _ipfsCID,
            creator: msg.sender,
            timestamp: block.timestamp
        });

        perceptualHashExists[_perceptualHash] = true;
        pHashToContentHash[_perceptualHash] = _contentHash;

        emit ContentRegistered(
            _contentHash,
            _perceptualHash,
            _ipfsCID,
            msg.sender,
            block.timestamp
        );
    }

    function getContent(string memory _contentHash)
        external
        view
        returns (Content memory)
    {
        return contents[_contentHash];
    }
}
