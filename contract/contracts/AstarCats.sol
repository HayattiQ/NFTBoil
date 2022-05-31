// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract AstarCats is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string baseURI = "";
    string public baseExtension = ".json";
    uint256 private preCost = 2 ether;
    uint256 private publicCost = 3 ether;
    uint256 public maxSupply = 7777;
    uint256 public publicMaxPerTx = 10;
    bool public paused = true;
    bool public revealed = false;
    bool public presale = true;
    string public notRevealedUri;
    uint256 private whiteListCount = 0;
    mapping(address => uint256) private whiteLists;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initNotRevealedUri
    ) ERC721(_name, _symbol) {
        setNotRevealedURI(_initNotRevealedUri);
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // public mint
    function publicMint(uint256 _mintAmount) public payable {
        uint256 supply = totalSupply();
        uint256 cost = publicCost * _mintAmount;
        mintCheck(_mintAmount, supply, cost);
        require(!presale, "Public mint is paused while Presale is active.");
        require(
            _mintAmount <= publicMaxPerTx,
            "Mint amount cannot exceed 10 per Tx."
        );

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
        }
    }

    // catlist mint
    function preMint(uint256 _mintAmount) public payable {
        uint256 supply = totalSupply();
        uint256 cost = preCost * _mintAmount;
        mintCheck(_mintAmount, supply, cost);
        require(presale, "Presale is not active.");
        require(
            whiteLists[msg.sender] >= _mintAmount,
            "CL: Five cats max per address in Catlist."
        );

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
            whiteLists[msg.sender]--;
        }
    }

    function mintCheck(
        uint256 _mintAmount,
        uint256 supply,
        uint256 cost
    ) private view {
        require(!paused, "Mint is not active.");
        require(_mintAmount > 0, "Mint amount cannot be zero");
        require(
            supply + _mintAmount <= maxSupply,
            "Total supply cannot exceed maxSupply"
        );
        require(msg.value >= cost, "Not enough funds provided for mint");
    }

    function ownerMint(uint256 count) public onlyOwner {
        uint256 supply = totalSupply();

        for (uint256 i = 1; i <= count; i++) {
            _safeMint(msg.sender, supply + i);
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
            "ERC721Metadata: URI query for nonexistent token"
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
                        baseExtension
                    )
                )
                : "";
    }

    function reveal() public onlyOwner {
        revealed = true;
    }

    function is_revealed() public view returns (bool) {
        return revealed;
    }

    function setPresale(bool _state) public onlyOwner {
        presale = _state;
    }

    function is_presaleActive() public view returns (bool) {
        return presale;
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

    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyOwner
    {
        baseExtension = _newBaseExtension;
    }

    function pause(bool _state) public onlyOwner {
        paused = _state;
    }

    function is_paused() public view returns (bool) {
        return paused;
    }

    function deleteWL(address addr) public virtual onlyOwner {
        whiteListCount = whiteListCount - whiteLists[addr];
        delete (whiteLists[addr]);
    }

    function updateWL(address addr, uint256 maxMint) public virtual onlyOwner {
        whiteListCount = whiteListCount - whiteLists[addr];
        whiteLists[addr] = maxMint;
        whiteListCount = whiteListCount + maxMint;
    }

    function pushMultiWL(address[] memory list) public virtual onlyOwner {
        for (uint256 i = 0; i < list.length; i++) {
            whiteLists[list[i]]++;
            whiteListCount++;
        }
    }

    function getWhiteListCount() public view returns (uint256) {
        return whiteListCount;
    }

    function withdraw() public virtual {
        // DAO account 0xa7295305596a3e4953271585a8cb44dffd069c24
        (bool dao, ) = payable(0xa7295305596a3E4953271585A8cB44DFfD069c24).call{
            value: (address(this).balance * 30) / 100
        }("");
        require(dao);

        // TEAM account 0x7D7C9681342DdB120D4239C82f4603D09dA67F01
        (bool team, ) = payable(0x7D7C9681342DdB120D4239C82f4603D09dA67F01)
            .call{value: address(this).balance}("");
        require(team);
    }

    function whiteListCountOfOwner(address owner)
        public
        view
        returns (uint256)
    {
        return whiteLists[owner];
    }
}