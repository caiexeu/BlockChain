pragma solidity ^0.5.0;

contract Marketplace {
    address[50] public buyers;
    address[50] public sellers;

    constructor() public {
        for (uint256 i = 0; i < 12; i++) {
            sellers[i] = 0x98DF35D3e2165Cd2EF4B3d5aA15478f3BEad9497;
        }
    }

    function getBuyers() public view returns (address[50] memory) {
        return buyers;
    }

    function getSellers() public view returns (address[50] memory) {
        return sellers;
    }

    function buy(uint256 productId) public returns (uint256) {
        require(productId >= 0 && productId <= buyers.length);

        buyers[productId] = msg.sender;

        return productId;
    }

    function addProduct(uint256 productId) public returns (uint256) {
        require(productId >= 0 && productId <= buyers.length);

        sellers[productId] = msg.sender;

        return productId;
    }
}
