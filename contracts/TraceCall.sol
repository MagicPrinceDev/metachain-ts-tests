// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.2;

contract TraceCallee {
    uint256 public store;

    function addtwo(uint256 _value) external returns (uint256 result) {
        uint256 x = 7;
        store = _value;
        return _value + x;
    }
}

contract TraceCaller {
    TraceCallee internal callee;
    uint256 public store;

    function someAction(address _addr, uint256 _number) public {
        callee = TraceCallee(_addr);
        store = callee.addtwo(_number);
    }
}
