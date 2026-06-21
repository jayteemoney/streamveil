// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ConfidentialToken
/// @notice An ERC-7984 confidential fungible token used as the streamed asset in StreamVeil.
/// @dev Balances, transfers and supply are end-to-end encrypted (euint64) via Zama's fhEVM.
///      A public faucet is included to make the demo self-serve on a testnet.
contract ConfidentialToken is ERC7984, ZamaEthereumConfig, Ownable {
    /// @notice Fixed faucet drip, expressed in token base units (6 decimals -> 1,000 tokens).
    uint64 public constant FAUCET_AMOUNT = 1_000_000_000;

    /// @notice Cooldown between faucet calls per address (0 = unlimited, handy for demos).
    uint256 public faucetCooldown;

    /// @notice Last faucet timestamp per address.
    mapping(address account => uint256 timestamp) public lastFaucetAt;

    error FaucetCooldownActive(uint256 availableAt);

    event FaucetDripped(address indexed to);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) ERC7984(name_, symbol_, tokenURI_) Ownable(msg.sender) {}

    /// @notice Mint a fixed encrypted amount of test tokens to the caller.
    /// @dev The drip value is public (it is a faucet), but it lands as an encrypted balance,
    ///      so downstream transfers and stream amounts remain confidential.
    function faucet() external returns (euint64 transferred) {
        uint256 last = lastFaucetAt[msg.sender];
        if (faucetCooldown != 0 && last != 0 && block.timestamp < last + faucetCooldown) {
            revert FaucetCooldownActive(last + faucetCooldown);
        }
        lastFaucetAt[msg.sender] = block.timestamp;

        euint64 amount = FHE.asEuint64(FAUCET_AMOUNT);
        transferred = _mint(msg.sender, amount);
        emit FaucetDripped(msg.sender);
    }

    /// @notice Owner mint with a client-encrypted amount (e.g. to fund a DAO treasury privately).
    /// @param to recipient of the freshly minted encrypted balance.
    /// @param encryptedAmount external encrypted amount, produced for THIS token's address.
    /// @param inputProof zero-knowledge proof bundled with the encrypted input.
    function mint(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwner returns (euint64 transferred) {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        transferred = _mint(to, amount);
    }

    /// @notice Owner can tune the faucet cooldown (seconds).
    function setFaucetCooldown(uint256 cooldownSeconds) external onlyOwner {
        faucetCooldown = cooldownSeconds;
    }
}
