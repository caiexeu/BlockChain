pragma solidity ^0.5.0;

contract Marketplace {
    address[16] public buyers;

    function buy(uint256 productId) public returns (uint256) {
        require(productId >= 0 && productId <= 15);

        buyers[productId] = msg.sender;

        return productId;
    }

    function getBuyers() public view returns (address[16] memory) {
        return buyers;
    }

    function addProduct() {
        buyers.push(msg.sender);

        return productId;
    }
}