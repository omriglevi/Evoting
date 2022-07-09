const addRow = (id, fname, lname, votes, canVote) => {
    const element = document.createElement('tr');
    element.innerHTML = `
    <tr>
      <td class="px-6 py-4">${fname }</td>
      <td class="px-6 py-4">${lname }</td>
      <td class="px-6 py-4">${votes}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        ${
          canVote
          ? `<a data-id="${id}" href="#" class="btn-vote text-indigo-600 hover:text-indigo-900">Vote!</a>`
          : 'no votes left'
        }
      </td>
    </tr>
    `;
  
    document.getElementById("candidates").appendChild(element);
  }


  App = {
    account: null,
    web3Provider: null,
    contracts: {},
  
    init: async function() {
        if (window.ethereum) {
          // Modern dapp browsers
          App.web3Provider = window.ethereum;
    
          try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts'});
          } catch (error) {
            console.error('User denied account access');
          }
        } else if (window.web3) {
          // Look out for injected web3.js
          App.web3Provider = window.web3.currentProvider;
        } else {
          // If no injected web3 instance is detected, fall back to Ganache
          App.web3Provider = new Web3.providers.HttpProvider(ganacheURL);
        }
    
        web3 = new Web3(App.web3Provider);
    
        let accounts = await web3.eth.getAccounts();
        App.account = accounts[0];
    
        await App.initContract();
      },
  
      initContract: async function() {
        const response = await fetch('Voting.json');
        const data = await response.json();
    
        App.contracts.Voting = TruffleContract(data);
        App.contracts.Voting.setProvider(App.web3Provider);
    
        await App.render();
        await App.listenOnEvents();
      },
  
      bindEvents: async function() {
        const newCandidateForm = document.getElementById('form-new-candidate');
        newCandidateForm.addEventListener('submit', App.handleAddCandidate);
    
        const voteButtons = document.getElementsByClassName('btn-vote');
        for(var i = 0; i < voteButtons.length; i++){
          voteButtons[i].addEventListener('click', App.handleVote);
        }
      },
  
      listenOnEvents: async function() {
        const instance = await App.contracts.Voting.deployed();
    
        instance.Voted({ fromBlock: 0 }).on('data', function(event){
            App.render();
        }).on('error', console.error);
    
        instance.NewCandidate({ fromBlock: 0 }).on('data', function(event){
            console.log("new candidate added");
        }).on('error', console.error);
      },
  
      render: async function() {
        document.getElementById("candidates").innerHTML = "";
    
        const instance = await App.contracts.Voting.deployed();
        const candidatesCount = (await instance.candidatesCount.call()).toNumber();
        const userVotes = (await instance.votes(App.account)).toNumber();
        const maxVotesPerUser = (await instance.MAX_VOTES_PER_VOTER.call()).toNumber();
    
        for (let i = 1; i <= candidatesCount; i++) {
          const candidate = await instance.candidates.call(i);
          const candidateID = candidate[0].toNumber();
          const userCanVote = userVotes < maxVotesPerUser;
    
          addRow(
            candidateID,  // ID
            candidate[1].toString(),  // Title
            candidate[2].toString(),  // Cover
            candidate[3].toNumber(),  // Votes
            userCanVote,
          );
    
          if (!userCanVote) {
            document.getElementById("form-new-candidate").remove()
          }
        }
    
        await App.bindEvents();
      },
  
    
  handleVote: function(event) {
    event.preventDefault();

    const candidateID = parseInt(event.target.dataset.id);

    App.contracts.Voting.deployed().then(function(instance) {
      instance.vote(candidateID, { from: App.account }).then(function(address) {
        console.log(`Successfully voted on ${candidateID}`, address);
      }).catch(function(err) {
        console.error(err);
      });
    });

    return false;
  },

  handleAddCandidate: function(event) {
    event.preventDefault();

    const inputs = event.target.elements;
    const fname = inputs['fname'].value;
    const lname = inputs['lnameUrl'].value;

    App.contracts.Voting.deployed().then(function(instance) {
      instance.addCandidate(fname, lname, { from: App.account }).then(function() {
        console.log(`Successfully added candidate ${fname}`);
        event.target.reset();
      }).catch(function(err) {
        console.error(err);
      });
    }).catch(function(err) {
      console.error(err);
    });

    return false;
  }
  };
  
  window.addEventListener('load', function (event) {
    App.init();
  });