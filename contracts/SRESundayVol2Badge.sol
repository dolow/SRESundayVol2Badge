// SPDX-License-Identifier: MIT

pragma solidity >= 0.8.0 <= 0.8.10;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import 'openzeppelin-solidity/contracts/access/Ownable.sol';

/**
 * Sre Sunday Vol.2 Badge can be -
 * - minted only by contract owner
 * - burned only by contract owner
 * - transfered only by contract owner or owner of given token id
 *
 * other features
 * - token id is incremental
 * - single address can own only single token id
 * - base uri can be updated only by contract owner
 */
contract SRESundayVol2Badge is ERC721, Ownable {
    string private _uri = "https://dolow.github.io/nft/sre_sunday/sre_sunday_vol2_badge.png?token_id=";
    uint256 private _nextTokenId;
    mapping(address => uint256) private _tokens;

    constructor() ERC721("Drecom SRE Sunday Vol.2 Badge", "DSS2") Ownable() {
        _nextTokenId = 1;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _uri;
    }

    function _transfer(address from, address to, uint256 tokenId) internal override {
        require(_tokens[from] >= 0, "SRESundayVol2Badge: sender does not have token with given id");
        // some thing is wrong if it is happened
        require(_tokens[to] == 0, "SRESundayVol2Badge: receiver already have token with given id");

        super._transfer(from, to, tokenId);

        _tokens[from] = 0;
        _tokens[to] = tokenId;
    }

    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    function tokenOf(address owner) public view returns (uint256) {
        return _tokens[owner];
    }

    function updateBaseURI(string calldata uri) onlyOwner public {
        _uri = uri;
    }

    function mint(address recipient) onlyOwner public returns (uint256) {
        require(_tokens[recipient] == 0, "SRESundayVol2Badge: recipient already owns token");

        _safeMint(recipient, _nextTokenId);
        _tokens[recipient] = _nextTokenId;

        uint256 issuedTokenId = _nextTokenId;

        _nextTokenId++;

        return issuedTokenId;
    }

    // rolling up minting
    function mintBatch(address[] calldata recipients) onlyOwner public {
        for (uint i = 0; i < recipients.length; i++) {
            mint(recipients[i]);
        }
    }

    // only entry point for _burn
    function burn(uint256 tokenId) onlyOwner public {
        address owner = ownerOf(tokenId);
        require(_tokens[owner] >= 0, "SRESundayVol2Badge: sender does not have token with given id");

        _burn(tokenId);
        _tokens[owner] = 0;
    }
}
