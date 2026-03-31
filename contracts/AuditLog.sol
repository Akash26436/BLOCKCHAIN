// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AuditLog {
    struct VerificationLog {
        address verifier;
        string contentHash;
        bool result;
        uint256 timestamp;
    }

    VerificationLog[] public logs;

    event LogEntryCreated(
        address indexed verifier,
        string contentHash,
        bool result,
        uint256 timestamp
    );

    function logVerification(
        address _verifier,
        string memory _contentHash,
        bool _result
    ) external {
        logs.push(VerificationLog({
            verifier: _verifier,
            contentHash: _contentHash,
            result: _result,
            timestamp: block.timestamp
        }));

        emit LogEntryCreated(_verifier, _contentHash, _result, block.timestamp);
    }

    function getLogs() external view returns (VerificationLog[] memory) {
        return logs;
    }
    
    function getLogsCount() external view returns (uint256) {
        return logs.length;
    }
}
