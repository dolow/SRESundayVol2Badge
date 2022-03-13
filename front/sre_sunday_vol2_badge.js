(function() {
    const config = {
        defaultContractAddress: "0xBA83E3b5625DC0D402135D64f26123E62F9a82D7",
    };

    const state = {
        document: null,
        blockchain: null,
        web3: null,
        contractAddress: config.defaultContractAddress,
    };
    // window.state = state;

    const domSelector = Object.freeze({
        contractAddressInput: () => state.document.getElementById("contractaddress-input-text"),
        contractOwnerLabel: () => state.document.getElementById("contractowner-label"),
        tokenIdsListContainerId: "tokenid-label",
        mintRecipientInput: () => state.document.getElementById("mint-recipient-input-text"),
        mintButton: () => state.document.getElementById("mint-button"),
        transferFromInput: () => state.document.getElementById("transfer-from-input-text"),
        transferToInput: () => state.document.getElementById("transfer-to-input-text"),
        transferButton: () => state.document.getElementById("transfer-button"),
        burnTokenIdInput: () => state.document.getElementById("burn-tokenid-input-text"),
        burnButton: () => state.document.getElementById("burn-button"),
        searchTokenIdInput: () => state.document.getElementById("search-tokenid-input-text"),
        searchTokenIdResult: () => state.document.getElementById("search-tokenid-result-label"),
        searchTokenIdButton: () => state.document.getElementById("search-tokenid-button"),
        searchAddressInput: () => state.document.getElementById("search-address-input-text"),
        searchAddressResult: () => state.document.getElementById("search-address-result-label"),
        searchAddressButton: () => state.document.getElementById("search-address-button"),

        mintBatchRecipientInputs: () => state.document.getElementsByClassName("mint-match-recipients-input-text"),
        mintBatchButton: () => state.document.getElementById("mint-batch-button"),

        tokenNameLabels: () => state.document.getElementsByClassName("tokenname-label"),
        tokenSymbolLabels: () => state.document.getElementsByClassName("tokensymbol-label"),
        tokenUriLabels: () => state.document.getElementsByClassName("tokenuri-label"),
    });

    const api = {
        contract: null,
        operator: null,

        onTransfer: (from, to, tokenId) => {
            console.log(from);
            console.log(to);
            console.log(tokenId);
        },

        name: () => api.contract.name().call({from: api.operator}),
        symbol: () => api.contract.symbol().call({from: api.operator}),
        owner: () => api.contract.owner().call({from: api.operator}),
        ownerOf: (tokenId) => {
            return api.contract.ownerOf(tokenId).call({from: api.operator});
        },
        tokenURI: (tokenId) => api.contract.tokenURI(tokenId).call({from: api.operator}),

        transferFrom: async (from, to) => {
            const tokenId = await api.tokenOf(from);
            return api.contract.transferFrom(from, to, tokenId).send({from: api.operator});
        },

        getNextTokenId: async () => {
            const tokenIdBN = await api.contract.getNextTokenId().call({from: api.operator});
            return state.web3.utils.fromWei(tokenIdBN, 'ether');
        },
        mint: (recipient) => api.contract.mint(recipient).send({from: api.operator}),
        mintBatch: (recipients) => api.contract.mintBatch(recipients).send({from: api.operator}),
        burn: (tokenId) => api.contract.burn(tokenId).send({from: api.operator}),
        tokenOf: async (address) => await api.contract.tokenOf(address).call({from: api.operator}),
    };

    const initDomEvent = () => {
        domSelector.contractAddressInput().onchange = () => {
            state.contractAddress = domSelector.contractAddressInput().value;
        };
        domSelector.mintButton().onclick = async () => {
            const recipient = domSelector.mintRecipientInput().value;
            await api.mint(recipient);
        };
        domSelector.mintBatchButton().onclick = async () => {
            const inputs = domSelector.mintBatchRecipientInputs();
            const recipients = [];
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                if (/^0x[0-9a-zA-Z]{40}$/.test(input.value)) {
                    recipients.push(input.value);
                }
            }
            await api.mintBatch(recipients);
        };
        domSelector.transferButton().onclick = async () => {
            const from = domSelector.transferFromInput().value;
            const to = domSelector.transferToInput().value;
            try {
                await api.transferFrom(from, to);
            } catch(e) {
                console.error(e);
            }
        };
        domSelector.burnButton().onclick = async () => {
            const tokenId = domSelector.burnTokenIdInput().value;
            await api.burn(tokenId);
        };
        domSelector.searchTokenIdButton().onclick = async () => {
            const tokenId = domSelector.searchTokenIdInput().value;
            if (/^[0-9]+$/.test(tokenId)) {
                let address;
                try {
                    address = await api.ownerOf(tokenId);
                } catch(e) {
                    domSelector.searchTokenIdResult().innerText = `token id ${tokenId} may not exist or be owned.`;
                    return;
                }
                domSelector.searchTokenIdResult().innerText = address;
            } else {
                domSelector.searchTokenIdResult().innerText = "invalid token id";
            }
        };
        domSelector.searchAddressButton().onclick = async () => {
            const address = domSelector.searchAddressInput().value;
            if (/^0x[0-9a-zA-Z]{40}$/.test(address)) {
                const tokenId = await api.tokenOf(address);
                if (tokenId === '0') {
                    domSelector.searchAddressResult().innerText = "address not own any token";
                } else {
                    domSelector.searchAddressResult().innerText = tokenId;
                }
            } else {
                domSelector.searchAddressResult().innerText = "invalid address";
            }
        };
    };

    const initBlockchain = async (name) => {
        if (name === "ethereum") {
            state.blockchain = window.ethereum;
        } else {
            throw new Error(`not supported network: ${name}`);
        }

        state.web3 = new Web3(state.blockchain);
        state.blockchain.on('accountsChanged', (accounts) => render());
        state.blockchain.on('chainChanged', (accounts) => render());
    };

    const refreshContract = () => {
        return state.blockchain
            .request({ method: 'eth_requestAccounts' })
            .catch((error) => {
                // EIP-1193 https://eips.ethereum.org/EIPS/eip-1193
                if (error.code === 4001) {
                    // User Rejected Request
                    // The user rejected the request.
                    console.log('Please connect to Wallet.');
                } else if (error.code === 4100){
                    // Unauthorized
                    console.log('The requested method and/or account has not been authorized by the user.');
                } else if (error.code === 4200){
                    // Unsupported Method
                    console.log('The Provider does not support the requested method.');
                } else if (error.code === 4900){
                    // Disconnected
                    console.log('The Provider is disconnected from all chains.');
                } else if (error.code === 4901){
                    // Chain Disconnected
                    console.log('The Provider is not connected to the requested chain.');
                } else if (error.code === -32002){
                    // already processing
                    console.log('already processing, please wait.');
                } else {
                    console.error(error);
                }
            })
            .then(accounts => {
                const abi = window.sreSundayVol2BadgeEnabledAbi();
                const contract = new state.web3.eth.Contract(abi, state.contractAddress);

                api.contract = contract.methods;
                contract.events.Transfer({}, (from, to, tokenId) => api.onTransfer(from, to, tokenId));
                api.operator = accounts[0];
            });
    };

    const render = async () => {
        refreshContract()
            .then(async () => {
                domSelector.transferFromInput().value = api.operator;

                const name = await api.name();
                const symbol = await api.symbol();
                const userTokenId = await api.tokenOf(api.operator);
                const owner = await api.owner();

                domSelector.contractOwnerLabel().innerText = owner;

                const nameElems = domSelector.tokenNameLabels();
                for (let i = 0; i < nameElems.length; i += 1) {
                    nameElems[i].innerText = name;
                }
                const symbolElems = domSelector.tokenSymbolLabels();
                for (let i = 0; i < symbolElems.length; i += 1) {
                    symbolElems[i].innerText = symbol;
                }

                if (userTokenId !== '0') {
                    const tokenUrl = await api.tokenURI(userTokenId);
                    const elems = domSelector.tokenUriLabels();
                    for (let i = 0; i < elems.length; i++) {
                        elems[i].innerText = tokenUrl;
                    }
                }
            });
    };

    window.onload = async () => {
        state.document = window.document;
        initDomEvent();
        domSelector.contractAddressInput().value = config.defaultContractAddress;
        await initBlockchain("ethereum");
        await render();
    };
})();
