pragma solidity ^0.5.0;

contract Marketplace{
    address[16] public buyers;

    function buy(uint productId) public returns (uint){
        require(productId >= 0 && productId <= 15);

        buyers[productId] = msg.sender;

        return productId;
    }

    function getBuyers() public view returns (address[16] memory){
        return buyers;
    }
}