# Voting Smart Contract and Tests

This project contains a smart contract for conducting voting processes and a set of tests to ensure the contract's functionality.

## Overview

The "Voting" smart contract is designed to facilitate the voting process, allowing voters to register, propose items, and cast their votes. The contract is equipped with various features to handle the voting workflow, including:

- Voter registration.
- Proposal registration.
- Voting sessions.
- Tallying votes.

The provided test suite ensures that the smart contract operates as expected, covering various aspects of its functionality and edge cases.

## Smart Contract

The smart contract is written in Solidity and includes functions for managing the voting process. Here's a brief overview of its main functionalities:

- **Voter Registration**: Voters can register themselves to participate in the voting process.

- **Proposal Registration**: Proposals can be added to the voting session.

- **Voting**: Registered voters can cast their votes for the available proposals.

- **Tallying Votes**: The contract determines the winning proposal based on the votes cast by the registered voters.

## Test Suite

The test suite, implemented using the [Hardhat](https://hardhat.org/) testing framework, covers the following aspects of the smart contract:

- Verifying the owner of the contract.
- Testing various getters for voter information and proposals.
- Voter registration and proposal registration processes.
- Casting votes and tallying votes.

The tests are designed to ensure that the smart contract functions correctly and handles various scenarios, including errors and edge cases.

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/voting-smart-contract.git
   cd voting-smart-contract
   ```
