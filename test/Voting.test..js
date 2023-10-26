const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("Voting", async function () {
  let voting, owner, voter1, voter2;

  describe("Getters", async function () {
    beforeEach(async function () {
      [owner, voter1, voter2, isNotVoter] = await ethers.getSigners();
      const contract = await hre.ethers.getContractFactory("Voting");
      voting = await contract.deploy(owner);
    });

    it("Verify the owner of the contract", async function () {
      const _owner = await voting.owner();
      assert.equal(owner.address, _owner, "The owner address doesn't match");
    });

    it("If NOT voter should not get voter adresses", async function () {
      await expect(
        voting.connect(isNotVoter).getVoter(owner.address)
      ).to.be.revertedWith("You're not a voter");
    });

    it("Voters should get adresses", async function () {
      await voting.connect(owner).addVoter(voter1.address);
      expect(voting.connect(voter1).getVoter(owner.address));
    });

    // it("voters should get proposals", async function () {
    //   let anyProposal;
    //   await voting.connect(owner).addProposal(anyProposal);
    //   expect(voting.connect(owner).getOneProposal()[0]); //.to.be.revertedWith("You're not a voter");
    // });

    it("voters should get proposals", async function () {
      let anyProposal;

      // Add a proposal and capture the proposal ID
      let proposalId = await voting.connect(owner).addProposal(anyProposal);

      // Retrieve the proposal with the captured proposal ID
      let proposal = await voting.connect(owner).getOneProposal(proposalId);

      // Now, you can make assertions about the retrieved proposal
      expect(proposal[0]).to.equal("Your Expected Proposal Data");
    });
  });

  // describe("Registration", async function () {
  //   beforeEach(async function () {
  //     [owner, voter1, voter2] = await ethers.getSigners();

  //     const contract = await hre.ethers.getContractFactory("Voting");
  //     voting = await contract.deploy();
  //   });

  //   // it("Check if the registration session is open", async function () {});

  // it("Only the owner should add voters", async function () {
  //   await expect(
  //     voting.connect(voter1).addVoter(voter2.address)
  //   ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
  // });

  //   it("Check if the owner can add voters", async function () {
  //     await voting.connect(owner.address).addVoter(voter2.address);
  //     const _voter2 = await voting.getVoter(voter2.address);
  //     expect(_voter2.isRegistered).to.equal(true);
  //   });

  //   // it("");
  // });
  // describe("Proposal", async function () {});
  // describe("Vote", async function () {});
  // describe("State", async function () {});
});
