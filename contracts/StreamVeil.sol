// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title StreamVeil
/// @author StreamVeil
/// @notice Confidential payment streaming for DAOs on Zama's fhEVM.
/// @dev Design notes (the "migration decisions"):
///
///      * PRIVACY MODEL: amounts are encrypted (deposit, per-second rate, claimed),
///        while the *schedule* (start/stop/pause timestamps) is plaintext. This lets all
///        temporal/branching logic stay in normal Solidity (cheap, no FHE branching) and
///        keeps only money confidential — the right tradeoff for payroll.
///
///      * TEMPORAL ACCRUAL: continuous streaming is approximated with block timestamps.
///        We track `secondsStreamed` (active seconds banked at the last checkpoint) plus a
///        live `lastCheckpoint`. accrued = min(rate * activeSeconds, deposit). Pausing simply
///        banks active seconds; resuming shifts `stopTime` forward by the paused gap so the
///        full deposit still streams, just later.
///
///      * PRECISION: rate = deposit / duration via FHE scalar division. Integer truncation
///        means rate*duration <= deposit, so the min() cap is exact and never overpays; any
///        dust remains refundable to the sender on cancel.
///
///      * PERMISSIONS: every encrypted field is granted (FHE.allow) to the contract, the
///        sender and the recipient. A sender may additionally authorize an auditor address
///        for programmable compliance. Parties decrypt their own data client-side via the
///        relayer SDK; the contract itself never learns plaintext.
contract StreamVeil is ZamaEthereumConfig {
    // ----------------------------------------------------------------------------------
    //                                      TYPES
    // ----------------------------------------------------------------------------------

    enum Status {
        Active,
        Paused,
        Canceled
    }

    struct Stream {
        uint256 id;
        uint256 orgId;
        address sender;
        address recipient;
        address token;
        address auditor; // address(0) until a sender opts into auditor reveal
        // --- schedule (plaintext) ---
        uint64 startTime;
        uint64 stopTime;
        uint64 secondsStreamed; // active seconds banked at lastCheckpoint
        uint64 lastCheckpoint; // timestamp accrual last (re)started
        uint64 pausedAt; // timestamp the stream was last paused
        Status status;
        // --- accounting (encrypted) ---
        euint64 deposit; // total funded (net of cancel refund)
        euint64 rate; // tokens per second
        euint64 claimed; // total withdrawn by recipient
    }

    struct Organization {
        uint256 id;
        address admin;
        string name;
        uint64 createdAt;
    }

    /// @dev Lightweight, ABI-friendly view of a stream (encrypted fields surface as bytes32 handles).
    struct StreamView {
        uint256 id;
        uint256 orgId;
        address sender;
        address recipient;
        address token;
        address auditor;
        uint64 startTime;
        uint64 stopTime;
        uint64 activeSeconds; // current active seconds (live)
        Status status;
        euint64 deposit;
        euint64 rate;
        euint64 claimed;
    }

    // ----------------------------------------------------------------------------------
    //                                     STORAGE
    // ----------------------------------------------------------------------------------

    uint256 public streamCount;
    uint256 public orgCount;

    mapping(uint256 streamId => Stream) private _streams;
    mapping(uint256 orgId => Organization) private _orgs;

    mapping(address account => uint256[]) private _streamsBySender;
    mapping(address account => uint256[]) private _streamsByRecipient;
    mapping(uint256 orgId => uint256[]) private _streamsByOrg;

    // ----------------------------------------------------------------------------------
    //                                     EVENTS
    // ----------------------------------------------------------------------------------

    event OrganizationRegistered(uint256 indexed orgId, address indexed admin, string name);
    event StreamCreated(
        uint256 indexed streamId,
        uint256 indexed orgId,
        address indexed sender,
        address recipient,
        address token,
        uint64 startTime,
        uint64 stopTime
    );
    event StreamPaused(uint256 indexed streamId, uint64 atTime);
    event StreamResumed(uint256 indexed streamId, uint64 atTime, uint64 newStopTime);
    event StreamToppedUp(uint256 indexed streamId, uint64 newStopTime);
    event StreamCanceled(uint256 indexed streamId, uint64 atTime);
    event Claimed(uint256 indexed streamId, address indexed recipient, uint64 atTime);
    event AuditorSet(uint256 indexed streamId, address indexed auditor);

    // ----------------------------------------------------------------------------------
    //                                     ERRORS
    // ----------------------------------------------------------------------------------

    error StreamNotFound(uint256 streamId);
    error OrganizationNotFound(uint256 orgId);
    error NotStreamSender(uint256 streamId);
    error NotStreamRecipient(uint256 streamId);
    error InvalidTimeRange(uint64 startTime, uint64 stopTime);
    error InvalidRecipient();
    error InvalidToken();
    error StreamNotActive(uint256 streamId);
    error StreamNotPaused(uint256 streamId);
    error StreamAlreadyCanceled(uint256 streamId);

    // ----------------------------------------------------------------------------------
    //                                    MODIFIERS
    // ----------------------------------------------------------------------------------

    modifier streamExists(uint256 streamId) {
        if (streamId == 0 || streamId > streamCount) revert StreamNotFound(streamId);
        _;
    }

    modifier onlySender(uint256 streamId) {
        if (_streams[streamId].sender != msg.sender) revert NotStreamSender(streamId);
        _;
    }

    modifier onlyRecipient(uint256 streamId) {
        if (_streams[streamId].recipient != msg.sender) revert NotStreamRecipient(streamId);
        _;
    }

    // ----------------------------------------------------------------------------------
    //                                  ORGANIZATIONS
    // ----------------------------------------------------------------------------------

    /// @notice Register a DAO / organization that streams can be grouped under.
    function registerOrganization(string calldata name) external returns (uint256 orgId) {
        orgId = ++orgCount;
        _orgs[orgId] = Organization({
            id: orgId,
            admin: msg.sender,
            name: name,
            createdAt: uint64(block.timestamp)
        });
        emit OrganizationRegistered(orgId, msg.sender, name);
    }

    // ----------------------------------------------------------------------------------
    //                                CREATE / FUND STREAM
    // ----------------------------------------------------------------------------------

    /// @notice Open a confidential stream funded by the caller.
    /// @dev Caller MUST first approve this contract as an ERC-7984 operator on `token`
    ///      (`token.setOperator(streamVeil, until)`), and the encrypted deposit MUST be
    ///      produced for the TOKEN's address (the token runs `fromExternal`).
    /// @param orgId organization the stream belongs to (must exist).
    /// @param recipient the payee.
    /// @param token the ERC-7984 confidential token to stream.
    /// @param startTime stream start (unix seconds). Use block.timestamp for "now".
    /// @param stopTime stream end (must be > startTime).
    /// @param encryptedDeposit client-encrypted total deposit (for the token address).
    /// @param inputProof proof bundled with the encrypted deposit.
    function createStream(
        uint256 orgId,
        address recipient,
        address token,
        uint64 startTime,
        uint64 stopTime,
        externalEuint64 encryptedDeposit,
        bytes calldata inputProof
    ) external returns (uint256 streamId) {
        if (orgId == 0 || orgId > orgCount) revert OrganizationNotFound(orgId);
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        if (token == address(0)) revert InvalidToken();
        if (stopTime <= startTime) revert InvalidTimeRange(startTime, stopTime);

        uint64 duration = stopTime - startTime;

        // Verify the client-encrypted input against THIS contract + the caller, then let the
        // token operate on it transiently. The returned ciphertext is the *actual* amount moved
        // (capped at the sender's balance) and is already ACL-granted to this contract.
        euint64 requested = FHE.fromExternal(encryptedDeposit, inputProof);
        FHE.allowTransient(requested, token);
        euint64 deposit = IERC7984(token).confidentialTransferFrom(msg.sender, address(this), requested);

        euint64 rate = FHE.div(deposit, duration);
        euint64 claimed = FHE.asEuint64(0);

        streamId = ++streamCount;
        Stream storage s = _streams[streamId];
        s.id = streamId;
        s.orgId = orgId;
        s.sender = msg.sender;
        s.recipient = recipient;
        s.token = token;
        s.startTime = startTime;
        s.stopTime = stopTime;
        s.lastCheckpoint = startTime;
        s.status = Status.Active;
        s.deposit = deposit;
        s.rate = rate;
        s.claimed = claimed;

        _streamsBySender[msg.sender].push(streamId);
        _streamsByRecipient[recipient].push(streamId);
        _streamsByOrg[orgId].push(streamId);

        _grantAll(s);

        emit StreamCreated(streamId, orgId, msg.sender, recipient, token, startTime, stopTime);
    }

    /// @notice Add more funds to a live stream and extend its end time accordingly.
    /// @param extendSeconds how much later the stream should end (≈ topUpAmount / rate).
    function topUp(
        uint256 streamId,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        uint64 extendSeconds
    ) external streamExists(streamId) onlySender(streamId) {
        Stream storage s = _streams[streamId];
        if (s.status == Status.Canceled) revert StreamAlreadyCanceled(streamId);

        euint64 requested = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allowTransient(requested, s.token);
        euint64 added = IERC7984(s.token).confidentialTransferFrom(msg.sender, address(this), requested);
        s.deposit = FHE.add(s.deposit, added);
        s.stopTime += extendSeconds;

        _grantAll(s);
        emit StreamToppedUp(streamId, s.stopTime);
    }

    // ----------------------------------------------------------------------------------
    //                               PAUSE / RESUME / CANCEL
    // ----------------------------------------------------------------------------------

    /// @notice Freeze accrual. Active seconds are banked; no FHE writes needed.
    function pause(uint256 streamId) external streamExists(streamId) onlySender(streamId) {
        Stream storage s = _streams[streamId];
        if (s.status != Status.Active) revert StreamNotActive(streamId);

        uint64 nowT = uint64(block.timestamp);
        s.secondsStreamed = _activeSeconds(s);
        s.pausedAt = nowT > s.stopTime ? s.stopTime : nowT;
        s.status = Status.Paused;

        emit StreamPaused(streamId, nowT);
    }

    /// @notice Resume accrual, shifting the end time forward by the paused gap.
    function resume(uint256 streamId) external streamExists(streamId) onlySender(streamId) {
        Stream storage s = _streams[streamId];
        if (s.status != Status.Paused) revert StreamNotPaused(streamId);

        uint64 nowT = uint64(block.timestamp);
        uint64 gap = nowT > s.pausedAt ? nowT - s.pausedAt : 0;
        s.stopTime += gap;
        s.lastCheckpoint = nowT;
        s.status = Status.Active;

        emit StreamResumed(streamId, nowT, s.stopTime);
    }

    /// @notice Cancel a stream: refund the unstreamed remainder to the sender. The recipient
    ///         can still claim everything accrued up to cancellation.
    function cancel(uint256 streamId) external streamExists(streamId) onlySender(streamId) {
        Stream storage s = _streams[streamId];
        if (s.status == Status.Canceled) revert StreamAlreadyCanceled(streamId);

        // Freeze accrual at the current active-seconds mark.
        s.secondsStreamed = _activeSeconds(s);
        s.status = Status.Canceled;

        euint64 accrued = FHE.min(FHE.mul(s.rate, s.secondsStreamed), s.deposit);
        euint64 refund = FHE.sub(s.deposit, accrued);

        FHE.allowTransient(refund, s.token);
        euint64 refunded = IERC7984(s.token).confidentialTransfer(s.sender, refund);

        // Deposit now equals the amount owed to the recipient (accrued), keeping claim math exact.
        s.deposit = FHE.sub(s.deposit, refunded);

        _grantAll(s);
        emit StreamCanceled(streamId, uint64(block.timestamp));
    }

    // ----------------------------------------------------------------------------------
    //                                       CLAIM
    // ----------------------------------------------------------------------------------

    /// @notice Withdraw everything accrued-but-unclaimed to the recipient.
    function claim(uint256 streamId) external streamExists(streamId) onlyRecipient(streamId) {
        Stream storage s = _streams[streamId];

        euint64 accrued = _accrued(s);
        euint64 claimable = FHE.sub(accrued, s.claimed); // invariant: accrued >= claimed

        FHE.allowTransient(claimable, s.token);
        euint64 transferred = IERC7984(s.token).confidentialTransfer(s.recipient, claimable);

        s.claimed = FHE.add(s.claimed, transferred);

        _grantAll(s);
        emit Claimed(streamId, s.recipient, uint64(block.timestamp));
    }

    // ----------------------------------------------------------------------------------
    //                                  AUDITOR REVEAL
    // ----------------------------------------------------------------------------------

    /// @notice Authorize an auditor to decrypt this stream's encrypted figures (compliance).
    /// @dev Pass address(0) is rejected; to revoke, ACL revocation is not supported on-chain,
    ///      so choose auditors deliberately.
    function setAuditor(uint256 streamId, address auditor)
        external
        streamExists(streamId)
        onlySender(streamId)
    {
        if (auditor == address(0)) revert InvalidRecipient();
        Stream storage s = _streams[streamId];
        s.auditor = auditor;

        FHE.allow(s.deposit, auditor);
        FHE.allow(s.rate, auditor);
        FHE.allow(s.claimed, auditor);

        emit AuditorSet(streamId, auditor);
    }

    // ----------------------------------------------------------------------------------
    //                                      VIEWS
    // ----------------------------------------------------------------------------------

    function getStream(uint256 streamId) external view streamExists(streamId) returns (StreamView memory) {
        Stream storage s = _streams[streamId];
        return
            StreamView({
                id: s.id,
                orgId: s.orgId,
                sender: s.sender,
                recipient: s.recipient,
                token: s.token,
                auditor: s.auditor,
                startTime: s.startTime,
                stopTime: s.stopTime,
                activeSeconds: _activeSeconds(s),
                status: s.status,
                deposit: s.deposit,
                rate: s.rate,
                claimed: s.claimed
            });
    }

    function getOrganization(uint256 orgId) external view returns (Organization memory) {
        if (orgId == 0 || orgId > orgCount) revert OrganizationNotFound(orgId);
        return _orgs[orgId];
    }

    function streamsBySender(address account) external view returns (uint256[] memory) {
        return _streamsBySender[account];
    }

    function streamsByRecipient(address account) external view returns (uint256[] memory) {
        return _streamsByRecipient[account];
    }

    function streamsByOrg(uint256 orgId) external view returns (uint256[] memory) {
        return _streamsByOrg[orgId];
    }

    /// @notice Current active (accruing) seconds for a stream — handy for client-side animation.
    function activeSecondsOf(uint256 streamId) external view streamExists(streamId) returns (uint64) {
        return _activeSeconds(_streams[streamId]);
    }

    // ----------------------------------------------------------------------------------
    //                                  INTERNAL HELPERS
    // ----------------------------------------------------------------------------------

    /// @dev Plaintext active-seconds, clamped to the stream window and to the current status.
    function _activeSeconds(Stream storage s) internal view returns (uint64) {
        if (s.status != Status.Active) {
            return s.secondsStreamed; // paused or canceled => frozen
        }
        uint64 nowT = uint64(block.timestamp);
        uint64 end = nowT > s.stopTime ? s.stopTime : nowT;
        if (end <= s.lastCheckpoint) {
            return s.secondsStreamed; // not started yet, or nothing new
        }
        return s.secondsStreamed + (end - s.lastCheckpoint);
    }

    /// @dev Encrypted accrued amount = min(rate * activeSeconds, deposit).
    function _accrued(Stream storage s) internal returns (euint64) {
        euint64 raw = FHE.mul(s.rate, _activeSeconds(s));
        return FHE.min(raw, s.deposit);
    }

    /// @dev (Re)grant ACL on every encrypted field to the contract, sender, recipient, auditor.
    function _grantAll(Stream storage s) internal {
        FHE.allowThis(s.deposit);
        FHE.allowThis(s.rate);
        FHE.allowThis(s.claimed);

        FHE.allow(s.deposit, s.sender);
        FHE.allow(s.rate, s.sender);
        FHE.allow(s.claimed, s.sender);

        FHE.allow(s.deposit, s.recipient);
        FHE.allow(s.rate, s.recipient);
        FHE.allow(s.claimed, s.recipient);

        if (s.auditor != address(0)) {
            FHE.allow(s.deposit, s.auditor);
            FHE.allow(s.rate, s.auditor);
            FHE.allow(s.claimed, s.auditor);
        }
    }
}
