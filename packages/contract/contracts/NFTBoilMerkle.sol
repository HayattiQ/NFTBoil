// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/// @title: NFTBoil
/// @author: HayattiQ
/// @dev: This contract using NFTBoil (https://github.com/HayattiQ/NFTBoil)


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";


contract NFTBoilMerkle is ERC721Enumerable, ERC2981, Ownable, Pausable {
    using Strings for uint256;

    string public baseURI = "";
    uint256 public preCost = 0.01 ether;
    uint256 public publicCost = 0.02 ether;

    bool public revealed;
    bool public presale;
    string public notRevealedUri;

    address public royaltyAddress;
    uint96 public royaltyFee = 500;


    uint256 constant public MAX_SUPPLY = 5000;
    uint256 constant public PUBLIC_MAX_PER_TX = 10;
    uint256 constant public PRESALE_MAX_PER_WALLET = 5;
    string constant public BASE_EXTENSION = ".json";
    bytes32 public merkleRoot;

    mapping(address => uint256) private whiteListClaimed;

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        revealed = false;
        presale = true;
        _setDefaultRoyalty(msg.sender, royaltyFee);
    }

    // internal
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // public mint
    function publicMint(uint256 _mintAmount) public payable whenNotPaused {
        uint256 supply = totalSupply();
        uint256 cost = publicCost * _mintAmount;
        mintCheck(_mintAmount, supply, cost);
        require(!presale, "Presale is active.");
        require(
            _mintAmount <= PUBLIC_MAX_PER_TX,
            "Mint amount over"
        );

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
        }
    }

    function preMint(uint256 _mintAmount, bytes32[] calldata _merkleProof)
        public
        payable
        whenNotPaused
    {
        uint256 supply = totalSupply();
        uint256 cost = preCost * _mintAmount;
        mintCheck(_mintAmount, supply, cost);
        require(presale, "Presale is not active.");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Merkle Proof"
        );

        require(
            whiteListClaimed[msg.sender] + _mintAmount <= PRESALE_MAX_PER_WALLET,
            "Already claimed max"
        );

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
            whiteListClaimed[msg.sender]++;
        }
    }

    function mintCheck(
        uint256 _mintAmount,
        uint256 supply,
        uint256 cost
    ) private view {
        require(_mintAmount > 0, "Mint amount cannot be zero");
        require(
            supply + _mintAmount <= MAX_SUPPLY,
            "MAXSUPPLY over"
        );
        require(msg.value >= cost, "Not enough funds");
    }

    function ownerMint(address _address, uint256 count) public onlyOwner {
        uint256 supply = totalSupply();

        for (uint256 i = 1; i <= count; i++) {
            _safeMint(msg.sender, supply + i);
            safeTransferFrom(msg.sender, _address, supply + i);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "URI query for nonexistent token"
        );

        if (revealed == false) {
            return notRevealedUri;
        }

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        BASE_EXTENSION
                    )
                )
                : "";
    }

    function reveal() public onlyOwner {
        revealed = true;
    }

    function setPresale(bool _state) public onlyOwner {
        presale = _state;
    }

    function setPreCost(uint256 _preCost) public onlyOwner {
        preCost = _preCost;
    }

    function setPublicCost(uint256 _publicCost) public onlyOwner {
        publicCost = _publicCost;
    }

    function getCurrentCost() public view returns (uint256) {
        if (presale) {
            return preCost;
        } else {
            return publicCost;
        }
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner {
        Address.sendValue(payable(owner()), address(this).balance);
    }

    /**
     * @notice Set the merkle root for the allow list mint
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    /**
     * @notice Change the royalty fee for the collection
     */
    function setRoyaltyFee(uint96 _feeNumerator) external onlyOwner {
        royaltyFee = _feeNumerator;
        _setDefaultRoyalty(royaltyAddress, royaltyFee);
    }

    /**
     * @notice Change the royalty address where royalty payouts are sent
     */
    function setRoyaltyAddress(address _royaltyAddress) external onlyOwner {
        royaltyAddress = _royaltyAddress;
        _setDefaultRoyalty(royaltyAddress, royaltyFee);
    }

  function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }


}
