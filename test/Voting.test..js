const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("VOTING", async function () {
  let voting, owner, voter1, voter2;

  async function initilizeBlockchain() {
    [owner, voter1, voter2] = await ethers.getSigners();
    const contract = await hre.ethers.getContractFactory("Voting");
    voting = await contract.deploy(owner);

    return { owner, voter1, voter2, voting };
  }

  beforeEach(async function () {
    ({ owner, voter1, voter2, voting } = await loadFixture(
      initilizeBlockchain
    ));
  });

  it("Verify the owner of the contract", async function () {
    const _owner = await voting.owner();
    assert.equal(owner.address, _owner, "The owner addresses don't match");
  });

  // :::::::::::::::::::::GETTERS:::::::::::::::::::::::::::::::::::::::

  describe("GETTERS", async function () {
    beforeEach(async function () {
      ({ owner, voter1, voter2, voting } = await loadFixture(
        initilizeBlockchain
      ));
    });

    it("Should NOT get voter information if NOT voter ", async function () {
      await expect(
        voting.connect(voter1).getVoter(owner.address)
      ).to.be.revertedWith("You're not a voter");
    });

    it("Should NOT get proposals if NOT voter1, ", async function () {
      await expect(voting.connect(voter1).getOneProposal(0)).to.be.revertedWith(
        "You're not a voter"
      );
    });

    it("Voters should get proposals", async function () {
      await voting.addVoter(owner.address);
      await voting.startProposalsRegistering();
      const [description, voteCount] = await voting
        .connect(owner)
        .getOneProposal(0);
      expect(description).to.equal("GENESIS");
    });
  });

  // :::::::::::::::::::::VOTER REGIESTERING:::::::::::::::::::::::::::::::::::::::

  describe("VOTER REGISTERING", async function () {
    beforeEach(async function () {
      ({ owner, voter1, voter2, voting } = await loadFixture(
        initilizeBlockchain
      ));
    });

    it("Voters registration session should be open to add voters", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.addVoter(voter1.address)).to.be.revertedWith(
        "Voters registration is not open yet"
      );
    });

    it("if NOT owner, should NOT add voters", async function () {
      await expect(
        voting.connect(voter1).addVoter(voter1.address)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("Owner should add himself as a voter", async function () {
      await voting.addVoter(owner.address);

      const voterInfo_Owner = await voting.getVoter(owner.address);
      expect(voterInfo_Owner.isRegistered).to.equal(true);
    });

    it("Owner should add voter1", async function () {
      await voting.addVoter(owner.address);
      await voting.addVoter(voter1.address);
      const voterInfo_voter1 = await voting.getVoter(voter1.address);
      expect(voterInfo_voter1.isRegistered).to.equal(true);
    });

    it("Owner should add voter2", async function () {
      await voting.addVoter(owner.address);
      await voting.addVoter(voter2.address);
      const voterInfo_voter2 = await voting.getVoter(voter2.address);
      expect(voterInfo_voter2.isRegistered).to.equal(true);
    });

    it("Owner should NOT register himself more than once", async function () {
      await voting.addVoter(owner.address);
      await expect(voting.addVoter(owner.address)).to.be.revertedWith(
        "Already registered"
      );
    });

    it("Owner should NOT register voter1 more than once", async function () {
      await voting.addVoter(owner.address);
      await voting.addVoter(voter1.address);
      await expect(voting.addVoter(voter1.address)).to.be.revertedWith(
        "Already registered"
      );
    });

    it("Owner should NOT register voter2 more than once", async function () {
      await voting.addVoter(owner.address);
      await voting.addVoter(voter2.address);
      await expect(voting.addVoter(voter2.address)).to.be.revertedWith(
        "Already registered"
      );
    });

    it("Should emit voterRegistered event", async function () {
      await expect(voting.addVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
    });
  });

  // :::::::::::::::::::::ADD PROPOSAL FUNCTION:::::::::::::::::::::::::::::::::::::::

  describe("ADD PROPOSAL FUNCTION", async function () {
    beforeEach(async function () {
      ({ owner, voter1, voter2, voting } = await loadFixture(
        initilizeBlockchain
      ));

      // Owner should add himself as a voter to access to addProposal function because of onlyVoters modifier
      await voting.addVoter(owner.address);
    });

    it("If NOT voter, should NOT get proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await expect(
        voting.connect(voter1).addProposal(anyProposal)
      ).to.be.revertedWith("You're not a voter");
    });

    it("Proposal registration session should be open to add proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      // Workflow status is initially 0, refering to voter registration
      await expect(voting.addProposal(anyProposal)).to.be.revertedWith(
        "Proposals are not allowed yet"
      );
    });

    it("Proposal can not be an empty string", async function () {
      const anyProposal = "";
      await voting.startProposalsRegistering();
      await expect(voting.addProposal(anyProposal)).to.be.revertedWith(
        "Vous ne pouvez pas ne rien proposer"
      );
    });

    it("Owner who registered himself as a voter should add proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await voting.startProposalsRegistering();
      await voting.addProposal(anyProposal);
      const [description, voteCount] = await voting.getOneProposal(1);
      assert.equal(description, "Any proposal but not an empty string");
    });

    it("Voter registered by the owner should add proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await voting.addVoter(voter1.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal(anyProposal);
      const [description, voteCount] = await voting.getOneProposal(1);
      assert.equal(description, "Any proposal but not an empty string");
    });

    it("A voter should add more than one proposal: 2 proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      const anotherProposal = "This is another proposal";
      await voting.startProposalsRegistering();
      await voting.addProposal(anyProposal);
      await voting.addProposal(anotherProposal);
      const [description_01, voteCount_01] = await voting.getOneProposal(1);
      assert.equal(description_01, "Any proposal but not an empty string");
      const [description_02, voteCount_02] = await voting.getOneProposal(2);
      assert.equal(description_02, "This is another proposal");
    });

    it("A voter should add more than one proposal: 3 proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      const anotherProposal_01 = "This is another proposal";
      const anotherProposal_02 = "This is also another proposal";
      await voting.startProposalsRegistering();
      await voting.addProposal(anyProposal);
      await voting.addProposal(anotherProposal_01);
      await voting.addProposal(anotherProposal_02);
      const [description_01, voteCount_01] = await voting.getOneProposal(1);
      assert.equal(description_01, "Any proposal but not an empty string");
      const [description_02, voteCount_02] = await voting.getOneProposal(2);
      assert.equal(description_02, "This is another proposal");
      const [description_03, voteCount_03] = await voting.getOneProposal(3);
      assert.equal(description_03, "This is also another proposal");
    });

    it("Should emit ProposalRegistered event", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await voting.startProposalsRegistering();
      await expect(voting.addProposal(anyProposal))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(1);
    });

    it("Should emit ProposalRegistered event more than once if more than one proposal registered by a voter: 2 proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      const anotherProposal = "This is another proposal";
      await voting.startProposalsRegistering();
      await expect(voting.addProposal(anyProposal))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(1);
      await expect(voting.addProposal(anotherProposal))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(2);
    });

    it("Should emit ProposalRegistered event more than once if more than one proposal registered by the owner: 3 proposals", async function () {
      const anyProposal = "Any proposal but not an empty string";
      const anotherProposal_01 = "This is another proposal";
      const anotherProposal_02 = "This is also another proposal";
      await voting.startProposalsRegistering();
      await expect(voting.addProposal(anyProposal))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(1);
      await expect(voting.addProposal(anotherProposal_01))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(2);
      await expect(voting.addProposal(anotherProposal_02))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(3);
    });
  });

  it("Proposal registered by a voter but not the owner should should also trigger Proposal Registered event", async function () {
    const anyProposal = "Any proposal but not an empty string";
    await voting.addVoter(voter1.address);
    await voting.startProposalsRegistering();
    await expect(voting.connect(voter1).addProposal(anyProposal))
      .to.emit(voting, "ProposalRegistered")
      .withArgs(1);
  });

  it("More than one proposals registered by a voter but not the owner should should also trigger Proposal Registered event as much as proposals number", async function () {
    const anyProposal_01 = "Any proposal but not an empty string";
    const anyProposal_02 = "This is another proposal";
    const anyProposal_03 = "This is also another proposal";
    await voting.addVoter(voter1.address);
    await voting.startProposalsRegistering();
    await expect(voting.connect(voter1).addProposal(anyProposal_01))
      .to.emit(voting, "ProposalRegistered")
      .withArgs(1);
    await expect(voting.connect(voter1).addProposal(anyProposal_02))
      .to.emit(voting, "ProposalRegistered")
      .withArgs(2);
    await expect(voting.connect(voter1).addProposal(anyProposal_03))
      .to.emit(voting, "ProposalRegistered")
      .withArgs(3);
  });

  // :::::::::::::::::::::VOTE FUNCTION:::::::::::::::::::::::::::::::::::::::

  describe("VOTE FUNCTION", async function () {
    beforeEach(async function () {
      ({ owner, voter1, voter2, voting } = await loadFixture(
        initilizeBlockchain
      ));

      await voting.addVoter(owner.address);
      await voting.startProposalsRegistering();
    });

    it("Should NOT vote if not registered as voter", async function () {
      // 0 is the index of 'GENESIS' proposal;
      await expect(voting.connect(voter1).setVote(0)).to.be.revertedWith(
        "You're not a voter"
      );
    });

    it("Voting session has to be started", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await expect(voting.setVote(0)).to.be.revertedWith(
        "Voting session havent started yet"
      );
    });

    it("Should NOT vote more than once", async function () {
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

    it("Voters should vote for the GENESIS proposal", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.setVote(0);
      let [isRegistered, hasVoted, votedProposalId] = await voting.getVoter(
        owner.address
      );
      assert.equal(votedProposalId, 0);
    });

    it("Voters should vote for an other proposal", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await voting.addProposal(anyProposal);
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.setVote(1);
      let [isRegistered, hasVoted, votedProposalId] = await voting.getVoter(
        owner.address
      );
      assert.equal(votedProposalId, 1);
    });

    // it("More than one voter should vote for the same proposal", async function () {
    //   const anyProposal_01 = "Any proposal but not an empty string";
    //   const anyProposal_02 = "Any other proposal but not an empty string";
    //   await voting.addProposal(anyProposal_01);
    //   await voting.addProposal(anyProposal_02);
    //   await voting.endProposalsRegistering();
    //   await voting.startVotingSession();
    //   await voting.setVote(1);
    //   await voting.connect(voter1).setVote(1);
    //   let [isRegistered, hasVoted, votedProposalId] = await voting.getVoter(
    //     owner.address
    //   );
    //   assert.equal(votedProposalId, 1);
    // });

    it("Should emit Voted event", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await voting.addProposal(anyProposal);
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await expect(voting.setVote(1))
        .to.emit(voting, "Voted")
        .withArgs(owner.address, 1);
    });
  });

  describe("TALLY VOTES FUNCTION", async function () {
    beforeEach(async function () {
      ({ owner, voter1, voter2, voting } = await loadFixture(
        initilizeBlockchain
      ));

      await voting.addVoter(owner.address);
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startProposalsRegistering();
      const anyProposal_01 = "Proposal1";
      const anyProposal_02 = "Proposal2";
      const anyProposal_03 = "Proposal3";
      await voting.addProposal(anyProposal_01);
      await voting.connect(voter1).addProposal(anyProposal_02);
      await voting.connect(voter2).addProposal(anyProposal_03);
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
    });

    it("Voting session should be ended", async function () {
      const anyProposal = "Any proposal but not an empty string";
      await expect(voting.tallyVotes()).to.be.revertedWith(
        "Current status is not voting session ended"
      );
    });

    it("Should not tally votes if not owner", async function () {
      await expect(
        voting.connect(voter1).tallyVotes()
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("Should tally votes", async function () {
      await voting.setVote(1);
      await voting.connect(voter1).setVote(2);
      await voting.connect(voter2).setVote(2);
      await voting.endVotingSession();
      // await voting.tallyVotes();
      // expect(winningProposalId).to.equal(2);

      expect(await voting.tallyVotes()).to.equal("Proposal2");
    });
  });
});
