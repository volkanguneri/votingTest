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
const {
  TASK_COMPILE_REMOVE_OBSOLETE_ARTIFACTS,
} = require("hardhat/builtin-tasks/task-names");

describe("Voting", async function () {
  let voting, owner, voter, voter2;

  // create a fixture to reload blockchain in beforeEach hooks. Attention to addVoter function additionnaly used in some of them.

  // voter 1 and voter 2 sont ils nécessaires?

  // toutes les exports en haut sont ils nécessaires?

  beforeEach(async function () {
    [owner, voter, voter2, isNotVoter] = await ethers.getSigners();
    const contract = await hre.ethers.getContractFactory("Voting");
    voting = await contract.deploy(owner);
  });

  it("Verify the owner of the contract", async function () {
    const _owner = await voting.owner();
    assert.equal(owner.address, _owner, "The owner address doesn't match");
  });

  describe("Getters", async function () {
    beforeEach(async function () {
      [owner, voter, voter2, isNotVoter] = await ethers.getSigners();
      const contract = await hre.ethers.getContractFactory("Voting");
      voting = await contract.deploy(owner);
    });

    it("should NOT get voter adresses if NOT voter ", async function () {
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

    it("should NOT get proposals if NOT voter, ", async function () {
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

    it("Voters registration session should be open to add voters", async function () {
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

    it("owner should add voters", async function () {
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

    it("should emit VoterRegistered event", async function () {
      await expect(voting.addVoter(voter.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter.address);
    });
  });

  describe("Add proposal function", async function () {
    let anyProposal;

    beforeEach(async function () {
      [owner, voter, voter2] = await ethers.getSigners();

      const contract = await hre.ethers.getContractFactory("Voting");
      voting = await contract.deploy();

      await voting.addVoter(owner.address);
    });

    it("If NOT voter, should NOT get proposals", async function () {
      anyProposal = "Any proposal but not an empty string";
      await expect(
        voting.connect(isNotVoter).addProposal(anyProposal)
      ).to.be.revertedWith("You're not a voter");
    });

    it("Proposal registration session should be open to add proposals", async function () {
      anyProposal = "Any proposal but not an empty string";
      let registeringStatus = await voting.workflowStatus();
      if (registeringStatus !== 1) {
        await expect(voting.addProposal(anyProposal)).to.be.revertedWith(
          "Proposals are not allowed yet"
        );
      }
    });

    it("Proposal can not be an empty string", async function () {
      anyProposal = "";
      await voting.startProposalsRegistering();
      await expect(voting.addProposal(anyProposal)).to.be.revertedWith(
        "Vous ne pouvez pas ne rien proposer"
      );
    });

    it("Voters can add proposals", async function () {
      anyProposal = "Any proposal but not an empty string";
      await voting.startProposalsRegistering();
      await voting.addProposal(anyProposal);
      const [description, voteCount] = await voting.getOneProposal(1);
      assert.equal(description, "Any proposal but not an empty string");
    });

    it("Should add more than one proposals"); // add like five proposals

    it("should emit ProposalRegistered event", async function () {
      anyProposal = "Any proposal but not an empty string";
      await voting.startProposalsRegistering();
      await expect(voting.addProposal(anyProposal))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(1);
    });
  });

  describe("Vote function", async function () {
    beforeEach(async function () {
      [owner, voter, voter2] = await ethers.getSigners();

      const contract = await hre.ethers.getContractFactory("Voting");
      voting = await contract.deploy();

      await voting.addVoter(owner.address);

      await voting.startProposalsRegistering();
    });

    it("shoul NOT vote if not registered as voter", async function () {
      await expect(voting.connect(isNotVoter).setVote(0)).to.be.revertedWith(
        "You're not a voter"
      );
    });

    it("Voting session has to be started", async function () {
      anyProposal = "Any proposal but not an empty string";
      let registeringStatus = await voting.workflowStatus();
      if (registeringStatus !== 2) {
        await expect(voting.setVote(0)).to.be.revertedWith(
          "Voting session havent started yet"
        );
      }
    });

    it("should NOT vote more than once", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.setVote(0);
      await expect(voting.setVote(0)).to.be.revertedWith(
        "You have already voted"
      );
    });

    it("Proposals id should NOT be more or equal to proposals length", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.setVote(1)).to.be.revertedWith("Proposal not found");
    });

    it("voters should vote for the GENESIS proposal", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.setVote(0);
      let [isRegistered, hasVoted, votedProposalId] = await voting.getVoter(
        owner.address
      );
      assert.equal(votedProposalId, 0);
    });

    it("voters should vote for an other proposal", async function () {
      anyProposal = "Any proposal but not an empty string";
      await voting.addProposal(anyProposal);
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.setVote(1);
      let [isRegistered, hasVoted, votedProposalId] = await voting.getVoter(
        owner.address
      );
      assert.equal(votedProposalId, 1);
    });

    it("should emit Voted event", async function () {
      anyProposal = "Any proposal but not an empty string";
      await voting.addProposal(anyProposal);
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.setVote(1))
        .to.emit(voting, "Voted")
        .withArgs(owner.address, 1);
    });
  });

  // describe("Vote", async function () {});
  // describe("State", async function () {});
});
