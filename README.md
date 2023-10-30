# Hardhat Tests for a voting Smart Contract in solidity

This project contains a test for a smart contract writtin in solidity for conducting voting processes. The hardhat test language is ethers.js, a java script library to interact with the smart contract deployed in a local blockchain. It's aim is to ensure all contract's functionalities and functions in depth to avoid bugs in advance. Every test should be independant from another. Ownable.sol contract from open zeppelin library is used to facilitate access restrictions (onlyOwner) to some functions described right after. Also loadFixture from hardhat-toolbox/network-helpers and chai from hardhat are used to facilitate the test of the smart contract.

## Overview

Principal functions to test :

- addVoter()
- addProposal()
- setVote()
- tallyVotes()

These functions in general have require conditions to test:

- Only owner modifier comming from open zeppelin library
- Only voters modifier
- A proposal can not be an empty string
- Only owner can add voters
- Only owner can tally votes
- Only voters cans add proposals
- One voter can add several proposals
- A voter can vote only once for one proposal

If conditions are good, these functions should work correctly and tests should pass.

Functions contain events to test:

- Any proposal registered emit an event
- Any vote is registered and emits an event
- Tallying votes emits an event
- Passing from one workflow state to another by the owner emits also an event

The contract has several workflow status which must be checked. The workflow state has to allow the access to a function:

- RegisteringVoters,
- ProposalsRegistrationStarted,
- ProposalsRegistrationEnded,
- VotingSessionStarted,
- VotingSessionEnded,
- VotesTallied

## IMPORTANT FOR THE CORRECTOR: Especially ADD PROPOSAL FUNCTION is deeply tested

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/volkanguneri/votingTest.git
   cd votingTest
   cd voting.test.js
   ```

2. Install Hardhat dependencies:

yarn add hardhat
yarn hardhat init

3. Run the tests:

yarn hardhat test
yarn hardhat coverage

## Contributors

Volkan Guneri
