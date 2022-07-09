// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Voting {
   uint public constant MAX_VOTES_PER_VOTER = 1;
  struct Candidate {
    uint id;
    string fname;
    string lname;
    uint votes;
  }
  event Voted ();
  event NewCandidate ();
   mapping(uint => Candidate) public candidates;
  uint public candidatesCount;

  mapping(address => uint) public votes;

  constructor() {
    candidatesCount = 0;
  }

  function vote(uint _candidateID) public {
    require(votes[msg.sender] < MAX_VOTES_PER_VOTER, "Voter has no votes left.");
    require(_candidateID > 0 && _candidateID <= candidatesCount, "Candidate ID is out of range.");

    votes[msg.sender]++;
    candidates[_candidateID].votes++;

    emit Voted();
  }

  function addCandidate(string memory _fname, string memory _lname) public {
    candidatesCount++;

    Candidate memory candidate = Candidate(candidatesCount, _fname, _lname, 0);
    candidates[candidatesCount] = candidate;

    emit NewCandidate();
    vote(candidatesCount);
  }
}
