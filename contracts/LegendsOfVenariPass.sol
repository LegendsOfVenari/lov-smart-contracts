// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Token contract for Legends of Venari Alpha Passes
 * @dev This contract allows the distribution of
 * Legends of Venari Passes in the form of a presale and main sale.
 *
 * Users can mint from Talaw, Vestal, or Azule in either sales.
 *
 *
 * Smart contract work done by lenopix.eth
 */
contract LegendsOfVenariPass is
  ERC721Enumerable,
  Ownable,
  ReentrancyGuard
{
  using ECDSA for bytes32;
  using Address for address;

  event Mint(
    address indexed to,
    uint256 indexed tokenId,
    uint256 indexed factionId
  );

  // Faction Ids
  uint256 public constant TALAW_ID = 0;
  uint256 public constant VESTAL_ID = 1;
  uint256 public constant AZULE_ID = 2;

  // Minting constants
  uint256 public maxMintPerTransaction;
  uint256 public MINT_SUPPLY;
  uint256 public TEAM_SUPPLY;

  // 0.188 ETH
  uint256 public constant MINT_PRICE = 188000000000000000;

  // Keep track of supply
  uint256 public talawMintCount = 0;
  uint256 public vestalMintCount = 0;
  uint256 public azuleMintCount = 0;

  // Sale toggles
  bool private _isPresaleActive = false;
  bool private _isSaleActive = false;

  // Tracks the faction for a token
  mapping(uint256 => uint256) factionForToken;

  // Presale
  mapping(address => bool) private presaleClaimed; // Everyone who got in on the presale can only claim once.
  address private signVerifier = 0xd974C841FF9ad100a992555F4587CA61c838E6Aa;

  // Base URI
  string private _uri;

  // Last Token Id
  uint256 lastTokenId = 0;

  // Merkle Root
  bytes32 immutable public root;

  constructor(
    uint256 mintSupply,
    uint256 teamSupply,
    uint256 maxMint,
    bytes32 merkleroot
  ) ERC721("Legends of Venari Pass", "LVP") {
    MINT_SUPPLY = mintSupply;
    TEAM_SUPPLY = teamSupply;
    maxMintPerTransaction = maxMint;
    root = merkleroot;
  }

  // @dev Returns the faction of the token id
  function getFaction(uint256 tokenId) external view returns (uint256) {
    require(_exists(tokenId), "Query for nonexistent token id");
    return factionForToken[tokenId];
  }

  // @dev Returns whether a user has claimed from presale
  function getPresaleClaimed(address user) external view returns (bool) {
    return presaleClaimed[user];
  }

  // @dev Returns the enabled/disabled status for presale
  function getPreSaleState() external view returns (bool) {
    return _isPresaleActive;
  }

  // @dev Returns the enabled/disabled status for minting
  function getSaleState() external view returns (bool) {
    return _isSaleActive;
  }

  // @dev Allows to set the baseURI dynamically
  // @param uri The base uri for the metadata store
  function setBaseURI(string memory uri) external onlyOwner {
    _uri = uri;
  }

  // @dev Sets a new signature verifier
  function setSignVerifier(address verifier) external onlyOwner {
    signVerifier = verifier;
  }

  // @dev Dynamically set the max mints a user can do in the main sale
  function setMaxMintPerTransaction(uint256 maxMint) external onlyOwner {
    maxMintPerTransaction = maxMint;
  }

  // Presale
  function presaleMint(
    address account,
    uint256 tokenId,
    bytes32[] calldata proof,
    uint256 factionId
  ) external payable {
    require(_verify(_leaf(account, tokenId), proof), "Invalid merkle proof");
    require(!presaleClaimed[msg.sender], "Already claimed with this address");
    require(_isPresaleActive, "Presale not active");
    require(!_isSaleActive, "Cannot mint while main sale is active");
    require(_isValidFactionId(factionId), "Faction is not valid");
    require(MINT_PRICE == msg.value, "ETH sent does not match required payment");
    presaleClaimed[msg.sender] = true;

    _handleFactionMint(1, factionId, msg.sender, MINT_SUPPLY);
  }

  function _leaf(address account, uint256 tokenId) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(tokenId, account));
  }

  function _verify(bytes32 leaf, bytes32[] memory proof) internal view returns (bool) {
    return MerkleProof.verify(proof, root, leaf);
  }

  mapping(uint256 => bool) partnerNonceUsed;
  mapping(address => uint256) basePassNonce;

  // @dev Partner Mint - For partners on the whitelist who want to batch mint
  // @param factionIds The factions associated with the tokens
  // @param addresses The addresses that the tokens will be distributed to
  // @param sig Server side signature authorizing user to use the presale
  function partnerMint(
    uint256[] memory factionIds,
    address[] memory addresses,
    uint256 nonce,
    bytes memory sig
  ) external payable nonReentrant {
    require(_isPresaleActive, "Presale not active");
    require(
      (MINT_PRICE * factionIds.length) == msg.value,
      "ETH sent does not match required payment"
    );
    require(factionIds.length == addresses.length, "Faction ids much have the same length as addresses");
    require(!partnerNonceUsed[nonce], "Nonce already used.");

    // Verify signature
    bytes32 message = getPartnerSigningHash(
      msg.sender,
      factionIds,
      addresses,
      nonce
    ).toEthSignedMessageHash();
    require(
      ECDSA.recover(message, sig) == signVerifier,
      "Permission to call this function failed"
    );

    partnerNonceUsed[nonce] = true;

    // Mint
    for (uint256 i = 0; i < factionIds.length; i++) {
        uint256 factionId = factionIds[i];
        require(_isValidFactionId(factionId), "Faction is not valid");
        _handleFactionMint(1, factionId, addresses[i], MINT_SUPPLY);
    }
  }

  // @dev Main sale mint
  // @param tokensCount The tokens a user wants to purchase
  // @param factionId Talaw: 1, Vestal: 2, Azule: 3
  function mint(uint256 tokenCount, uint256 factionId)
    external
    payable
    nonReentrant
  {
    require(_isValidFactionId(factionId), "Faction is not valid");
    require(_isSaleActive, "Sale not active");
    require(tokenCount > 0, "Must mint at least 1 token");
    require(tokenCount <= maxMintPerTransaction, "Token count exceeds limit");
    require(
      (MINT_PRICE * tokenCount) == msg.value,
      "ETH sent does not match required payment"
    );

      _handleFactionMint(tokenCount, factionId, msg.sender, MINT_SUPPLY);
  }

  // @dev Private mint function reserved for company.
  // 50 of each faction is reserved.
  // @param recipient The user receiving the tokens
  // @param tokenCount The number of tokens to distribute
  // @param factionId Community: 0 and Theos: 1
  function mintToAddress(
    address recipient,
    uint256 tokenCount,
    uint256 factionId
  ) external onlyOwner {
    require(_isValidFactionId(factionId), "Faction does not exist");
    require(tokenCount > 0, "You can only mint more than 0 tokens");

    _handleFactionMint(tokenCount, factionId, recipient, MINT_SUPPLY + TEAM_SUPPLY);
  }

  function redeemBasePass(
    uint256 factionId,
    bytes memory sig
  ) external {
    require(_isValidFactionId(factionId), "Faction does not exist");

    // Verify signature
    bytes32 message = getBasePassSigningHash(
      msg.sender,
      factionId
    ).toEthSignedMessageHash();
    require(
      ECDSA.recover(message, sig) == signVerifier,
      "Permission to call this function failed"
    );

    basePassNonce[msg.sender]++;

    if (factionId == TALAW_ID) {
      talawMintCount++;
    } else if (factionId == VESTAL_ID) {
      vestalMintCount++;
    } else if (factionId == AZULE_ID) {
      azuleMintCount++;
    }

    _mint(msg.sender, 1, factionId);
  }

  // @dev Allows to enable/disable minting of presale
  function flipPresaleState() external onlyOwner {
    _isPresaleActive = !_isPresaleActive;
  }

  // @dev Allows to enable/disable minting of main sale
  function flipSaleState() external onlyOwner {
    _isSaleActive = !_isSaleActive;
  }

  function withdraw() external onlyOwner {
    uint256 balance = address(this).balance;
    payable(msg.sender).transfer(balance);
  }

  function getPartnerSigningHash(
    address sender,
    uint256[] memory factionIds,
    address[] memory addresses,
    uint256 nonce
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(sender, factionIds, addresses, nonce)
      );
  }

  function getBasePassSigningHash(
    address sender,
    uint256 factionId
  ) public view returns (bytes32) {
    return 
      keccak256(
        abi.encodePacked(sender, factionId, basePassNonce[sender])
      );
  }

  function _baseURI() internal view override returns (string memory) {
    return _uri;
  }

  function _handleFactionMint(
    uint256 tokenCount,
    uint256 factionId,
    address recipient,
    uint256 totalSupply
  ) private {
    if (factionId == TALAW_ID) {
      require(talawMintCount < totalSupply, "This faction has been fully minted");
      require((talawMintCount + tokenCount) <= totalSupply, "Cannot purchase more than the available supply");
      talawMintCount += tokenCount;
    } else if (factionId == VESTAL_ID) {
      require(vestalMintCount < totalSupply, "This faction has been fully minted");
      require((vestalMintCount + tokenCount) <= totalSupply, "Cannot purchase more than the available supply");
      vestalMintCount += tokenCount;
    } else if (factionId == AZULE_ID) {
      require(azuleMintCount < totalSupply, "This faction has been fully minted");
      require((azuleMintCount + tokenCount) <= totalSupply, "Cannot purchase more than the available supply");
      azuleMintCount += tokenCount;
    }

    _mint(recipient, tokenCount, factionId);
  }

  function _mint(
    address recipient,
    uint256 tokenCount,
    uint256 factionId
  ) private {
    for (uint256 i = 0; i < tokenCount; i++) {
      uint256 tokenId = lastTokenId + i;
      factionForToken[tokenId] = factionId;
      emit Mint(recipient, tokenId, factionId);
      _safeMint(recipient, tokenId);
      lastTokenId++;
    }
  }

  function _isValidFactionId(uint256 factionId) private pure returns (bool) {
    return factionId == TALAW_ID || factionId == AZULE_ID || factionId == VESTAL_ID;
  }
}
