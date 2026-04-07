// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract AuditLog {
    struct VerificationLog {
        address verifier;
        string contentHash;
        bool result;
        uint256 timestamp;
    }

    struct ReportLog {
        address reporter;
        string contentHash;
        string reason;
        uint256 timestamp;
    }

    VerificationLog[] public logs;
    ReportLog[] public reports;

    event LogEntryCreated(
        address indexed verifier,
        string contentHash,
        bool result,
        uint256 timestamp
    );

    event ContentReported(
        address indexed reporter,
        string contentHash,
        string reason,
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

    function reportForgery(
        string memory _contentHash,
        string memory _reason
    ) external {
        ReportLog memory newReport = ReportLog({
            reporter: msg.sender,
            contentHash: _contentHash,
            reason: _reason,
            timestamp: block.timestamp
        });
        reports.push(newReport);

        emit ContentReported(msg.sender, _contentHash, _reason, block.timestamp);
    }

    function getLogs() external view returns (VerificationLog[] memory) {
        return logs;
    }

    function getAllReports() external view returns (ReportLog[] memory) {
        return reports;
    }
    
    function getLogsCount() external view returns (uint256) {
        return logs.length;
    }
}
