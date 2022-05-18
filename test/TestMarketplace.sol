pragma solidity >=0.4.21 <0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Marketplace.sol";

contract TestMarketplace {
    Marketplace marketplace = Marketplace(DeployedAddresses.Marketplace());

    uint256 expectedProductId = 8;

    address expectedBuyerId = address(this);

    function testUserCanBuy() public {
        uint256 returnedId = marketplace.buy(expectedProductId);

        Assert.equal(
            returnedId,
            expectedProductId,
            "returned id must be equal to the inserted id"
        );
    }
}
