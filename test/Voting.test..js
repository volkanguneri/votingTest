const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const { LogDescription } = require("ethers");

describe("Voting", async function () {
  let voting, owner, voter, voter2;

  describe("Getters", async function () {
    beforeEach(async function () {
      [owner, voter, voter2, isNotVoter] = await ethers.getSigners();
      const contract = await hre.ethers.getContractFactory("Voting");
      voting = await contract.deploy(owner);
    });

    it("Verify the owner of the contract", async function () {
      const _owner = await voting.owner();
      assert.equal(owner.address, _owner, "The owner address doesn't match");
    });

    it("If NOT voter should NOT get voter adresses", async function () {
      await expect(
        voting.connect(isNotVoter).getVoter(owner.address)
      ).to.be.revertedWith("You're not a voter");
    });

    it("Voters should get adresses", async function () {
      await voting.addVoter(voter.address);
      expect(voting.connect(voter).getVoter(owner.address));
    });

    it("voters should get proposals", async function () {
      await voting.addVoter(owner.address);
      await voting.startProposalsRegistering();
      const [description, voteCount] = await voting
        .connect(owner)
        .getOneProposal(0);
      expect(description).to.equal("GENESIS");
    });

    it("If NOT voter, should NOT get proposals", async function () {
      await expect(
        voting.connect(isNotVoter).getOneProposal(0)
      ).to.be.revertedWith("You're not a voter");
    });
  });

  describe("Registration", async function () {
    beforeEach(async function () {
      [owner, voter, voter2] = await ethers.getSigners();

      const contract = await hre.ethers.getContractFactory("Voting");
      voting = await contract.deploy();
    });

    it("Registration session should be open to add voters", async function () {
      await voting.startProposalsRegistering();
      let registeringStatus = await voting.workflowStatus();
      if (registeringStatus !== 0) {
        await expect(voting.addVoter(isNotVoter.address)).to.be.revertedWith(
          "Voters registration is not open yet"
        );
      }
    });

    it("if NOT owner, should NOT add voters", async function () {
      await expect(
        voting.connect(isNotVoter).addVoter(voter.address)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("if owner and registeration session's open, owner should add voters", async function () {
      await voting.addVoter(owner.address);
      await voting.addVoter(voter.address);
      const voterInfo = await voting.getVoter(voter.address);
      expect(voterInfo.isRegistered).to.equal(true);
    });

    it("already registered as voter should NOT be registered twice", async function () {
      await voting.addVoter(owner.address);
      await voting.addVoter(voter.address);
      await expect(voting.addVoter(voter.address)).to.be.revertedWith(
        "Already registered"
      );
    });

    // it("should emit an event if the owner deposits ethers", async function () {
    //   let etherQuantity = ethers.parseEther("0.1");
    //   await expect(bank.deposit({ value: etherQuantity }))
    //     .to.emit(bank, "Deposit")
    //     .withArgs(owner.address, etherQuantity);

    //   let balanceOfBank = await ethers.provider.getBalance(bank.target);
    //   assert.equal(balanceOfBank.toString(), 100000000000000000);
    // });

    it("should emit VoterRegistered event", async function () {
      await expect(voting.addVoter(voter.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter.address);
    });
  });

  // describe("Proposal", async function () {});
  // describe("Vote", async function () {});
  // describe("State", async function () {});
});
