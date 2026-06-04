const contractAddress = "0x5bcBEFd2bFf06fB1bd6a4eeEB0BCC3FCFaC884f6";

console.log("Voting app.js yüklendi");
console.log("Contract adresi:", contractAddress);
console.log("Adres tipi:", typeof contractAddress);

const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "candidates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "voteCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "candidatesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_candidateId",
        "type": "uint256"
      }
    ],
    "name": "getCandidate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_candidateId",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let provider;
let signer;
let contract;
let currentAccount;

const connectButton = document.getElementById("connectButton");
const voteButton = document.getElementById("voteButton");
const refreshButton = document.getElementById("refreshButton");

const walletAddress = document.getElementById("walletAddress");
const networkInfo = document.getElementById("networkInfo");
const candidatesList = document.getElementById("candidatesList");
const candidateInput = document.getElementById("candidateInput");
const statusText = document.getElementById("status");

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask bulunamadı. Lütfen MetaMask eklentisini kur.");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);

    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();

    currentAccount = await signer.getAddress();

    walletAddress.innerText = "Bağlı cüzdan: " + currentAccount;

    const network = await provider.getNetwork();

    if (network.chainId !== 11155111n) {
      networkInfo.innerText = "Yanlış ağdasın. Lütfen MetaMask'ta Sepolia ağına geç.";
      statusText.innerText = "Sepolia ağı gerekli.";
      return;
    }

    networkInfo.innerText = "Ağ: Sepolia";

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    statusText.innerText = "MetaMask bağlantısı başarılı.";

    await loadCandidates();
    await checkVoteStatus();

  } catch (error) {
    console.error(error);
    statusText.innerText = "Bağlantı sırasında hata oluştu.";
  }
}

async function loadCandidates() {
  try {
    if (!contract) {
      candidatesList.innerHTML = "Önce MetaMask bağla.";
      return;
    }

    const count = await contract.candidatesCount();

    candidatesList.innerHTML = "";

    for (let i = 1; i <= Number(count); i++) {
      const candidate = await contract.getCandidate(i);

      const id = candidate[0].toString();
      const name = candidate[1];
      const voteCount = candidate[2].toString();

      const candidateDiv = document.createElement("div");
      candidateDiv.className = "candidate";

      candidateDiv.innerHTML = `
        <strong>ID:</strong> ${id}<br>
        <strong>Aday:</strong> ${name}<br>
        <strong>Oy Sayısı:</strong> ${voteCount}
      `;

      candidatesList.appendChild(candidateDiv);
    }

    statusText.innerText = "Adaylar başarıyla yüklendi.";
  } catch (error) {
    console.error(error);
    statusText.innerText = "Adaylar yüklenirken hata oluştu.";
  }
}

async function vote() {
  try {
    if (!contract) {
      alert("Önce MetaMask bağla.");
      return;
    }

    const candidateId = candidateInput.value;

    if (candidateId === "") {
      alert("Lütfen aday ID gir.");
      return;
    }

    statusText.innerText = "Oy gönderiliyor. MetaMask onayı bekleniyor...";

    const tx = await contract.vote(candidateId);

    statusText.innerText = "Oy gönderildi. Blockchain onayı bekleniyor...";

    await tx.wait();

    statusText.innerText = "Oy başarıyla kaydedildi.";

    await loadCandidates();
    await checkVoteStatus();

  } catch (error) {
    console.error(error);

    if (error.reason) {
      statusText.innerText = "Hata: " + error.reason;
    } else if (error.shortMessage) {
      statusText.innerText = "Hata: " + error.shortMessage;
    } else {
      statusText.innerText = "Oy verme sırasında hata oluştu.";
    }
  }
}

async function checkVoteStatus() {
  try {
    if (!contract || !currentAccount) {
      return;
    }

    const voted = await contract.hasVoted(currentAccount);

    if (voted) {
      statusText.innerText = "Bu cüzdan daha önce oy kullandı.";
      voteButton.disabled = true;
    } else {
      voteButton.disabled = false;
    }

  } catch (error) {
    console.error(error);
  }
}

connectButton.addEventListener("click", connectWallet);
voteButton.addEventListener("click", vote);
refreshButton.addEventListener("click", loadCandidates);