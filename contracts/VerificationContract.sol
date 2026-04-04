// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./ContentRegistry.sol";
import "./AuditLog.sol";

contract VerificationContract {
    ContentRegistry public contentRegistry;
    AuditLog public auditLog;

    event VerificationResult(
        address indexed verifier,
        string contentHash,
        bool isAuthentic,
        uint256 timestamp
    );

    constructor(address _contentRegistryAddress, address _auditLogAddress) {
        contentRegistry = ContentRegistry(_contentRegistryAddress);
        auditLog = AuditLog(_auditLogAddress);
    }

    function verifyContent(string memory _contentHash) external returns (bool) {
        // Retrieve content from registry
        ContentRegistry.Content memory content = contentRegistry.getContent(_contentHash);

        bool isAuthentic = (content.timestamp != 0);

        // Log the verification attempt
        auditLog.logVerification(msg.sender, _contentHash, isAuthentic);

        emit VerificationResult(msg.sender, _contentHash, isAuthentic, block.timestamp);

        return isAuthentic;
    }

    function verifyByPHash(string memory _pHash) external returns (bool) {
        string memory contentHash = contentRegistry.pHashToContentHash(_pHash);
        
        bool isAuthentic = (bytes(contentHash).length > 0);

        // Log using the pHash since that was the search query
        auditLog.logVerification(msg.sender, _pHash, isAuthentic);

        emit VerificationResult(msg.sender, _pHash, isAuthentic, block.timestamp);

        return isAuthentic;
    }
}
