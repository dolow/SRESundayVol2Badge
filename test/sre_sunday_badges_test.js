const SRESundayVol2Badge = artifacts.require("SRESundayVol2Badge");

contract("SRESundayVol2Badge", (accounts) => {
    SRESundayVol2Badge.defaults({
        gasPrice: 0,
    });
    async function burnToken(contract, tokenId) {
        await contract.burn(tokenId, { from: accounts[0] });
    }
    async function burnLastToken(contract) {
        const nextTokenId = await contract.getNextTokenId.call({ from: accounts[0] });
        burnToken(contract, parseInt(nextTokenId.toString(), 10) - 1);
    }

    it ("has been deployed succcessfully", async () => {
        const deployed = await SRESundayVol2Badge.deployed();
        assert(deployed, "contract not deployed");
    });

    context("mint", async () => {
        const contractOwner = accounts[0];
        const notContractOwner = accounts[1];

        it ("should be called only by contract owner", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            try {
                await erc721.mint(accounts[0], { from: contractOwner });
            } catch (e) {
                assert.fail("should not occur error");
                return;
            }

            burnLastToken(erc721);

            try {
                await erc721.mint(accounts[0], { from: notContractOwner });
            } catch (e) {
                return;
            }

            assert.fail("should occur error");
        });

        it ("should give ownership to given address", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();
            const newOwner = accounts[0];
            const nextTokenId = await erc721.getNextTokenId.call({ from: contractOwner });

            try {
                await erc721.mint(newOwner, { from: contractOwner });
            } catch (e) {
                console.log(e);
                assert.fail("should not occur error");
                return;
            }

            const owner = await erc721.ownerOf.call(parseInt(nextTokenId.toString(), 10));
            assert.equal(newOwner, owner);

            burnLastToken(erc721);
        });

        it ("should increment token id", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();
            const recipient = accounts[0];
            const firstTokenId = await erc721.getNextTokenId.call({ from: contractOwner });

            try {
                await erc721.mint(recipient, { from: contractOwner });
            } catch (e) {
                assert.fail("should not occur error");
                return;
            }

            const secondTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
            assert.equal(
                parseInt(firstTokenId.toString(), 10) + 1,
                parseInt(secondTokenId.toString(), 10)
            );

            burnLastToken(erc721);
        });

        it ("should not mint to address that already own oken", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();
            const recipient = accounts[0];

            try {
                await erc721.mint(recipient, { from: contractOwner });
            } catch (e) {
                assert.fail("should not occur error");
                return;
            }

            try {
                await erc721.mint(recipient, { from: contractOwner });
            } catch (e) {
                burnLastToken(erc721);
                return;
            }

            assert.fail("should occur error");
        });
    });
    context("mintBatch", async () => {
        const contractOwner = accounts[0];
        const notContractOwner = accounts[1];

        it ("should be called only by contract owner", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            try {
                await erc721.mintBatch([contractOwner], { from: contractOwner });
            } catch(e) {
                assert.fail("should not occur error");
            }

            try {
                await erc721.mintBatch([notContractOwner], { from: notContractOwner });
            } catch(e) {
                burnLastToken(erc721);
                return;
            }

            assert.fail("should occur error");
        });

        it ("should mint to all given addresses", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();
            const initialTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
            const initialTokenIdNum = parseInt(initialTokenId.toString(), 10);
            const recipients = [contractOwner, notContractOwner];

            await erc721.mintBatch(recipients, { from: contractOwner });

            for (let i = initialTokenIdNum; i < initialTokenIdNum + recipients.length; i++) {
                const tokenId = i;
                const owner = await erc721.ownerOf.call(parseInt(tokenId.toString(), 10));
                assert.equal(recipients[i - initialTokenIdNum], owner);
            }

            for (let i = initialTokenIdNum; i < initialTokenIdNum + recipients.length; i++) {
                burnToken(erc721, i);
            }
        });

        context("whene address in the mid of argument already owns token", async () => {
            const recipients = [accounts[0], accounts[1], accounts[2]];
            const alreadyOwner = recipients[1];

            it ("should not mint to all addresses", async () => {
                const erc721 = await SRESundayVol2Badge.deployed();
                const initialTokenId = await erc721.getNextTokenId.call({ from: contractOwner });

                await erc721.mint(alreadyOwner, { from: contractOwner });

                const batchInitialTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
                const batchInitialTokenIdNum = parseInt(batchInitialTokenId,toString(), 10);

                try {
                    await erc721.mintBatch(recipients, { from: contractOwner });
                } catch(e) {
                }

                const zeroAddress = "0x0000000000000000000000000000000000000000";
                for (let i = 0; i < recipients.length; i++) {
                    try {
                        await erc721.ownerOf.call(batchInitialTokenIdNum + i);
                    } catch(e) {
                        continue;
                    }
                    assert.fail("should occur error");
                }

                burnToken(erc721, initialTokenId);
            });
            it ("should not update next token id", async () => {
                const erc721 = await SRESundayVol2Badge.deployed();
                const initialTokenId = await erc721.getNextTokenId.call({ from: contractOwner });

                await erc721.mint(alreadyOwner, { from: contractOwner });

                const batchInitialTokenId = await erc721.getNextTokenId.call({ from: contractOwner });

                try {
                    await erc721.mintBatch(recipients, { from: contractOwner });
                } catch(e) {
                    const batchNextTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
                    assert.equal(batchInitialTokenId.toString(), batchNextTokenId.toString());
                    burnToken(erc721, initialTokenId);
                    return;
                }

                assert.fail("should occur error");
            });

            it ("should occur error", async () => {
                const erc721 = await SRESundayVol2Badge.deployed();
                const initialTokenId = await erc721.getNextTokenId.call({ from: contractOwner });

                await erc721.mint(alreadyOwner, { from: contractOwner });

                try {
                    await erc721.mintBatch(recipients, { from: contractOwner });
                } catch(e) {
                    burnToken(erc721, initialTokenId);
                    return;
                }

                assert.fail("should occur error");
            });
        });
    });

    context("updateBaseURI", async () => {
        const contractOwner = accounts[0];
        const notContractOwner = accounts[1];

        it ("should be called only by contract owner", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            try {
                await erc721.updateBaseURI("https://example.com", { from: contractOwner });
            } catch(e) {
                assert.fail("should not occur error");
            }

            try {
                await erc721.updateBaseURI("https://example.com", { from: notContractOwner });
            } catch(e) {
                return;
            }

            assert.fail("should occur error");
        });

        it("should update url string", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();
            const tokenId = await erc721.getNextTokenId.call({ from: contractOwner });
            await erc721.mint(accounts[0], { from: contractOwner });

            const uri = await erc721.tokenURI.call(tokenId.toString());
            await erc721.updateBaseURI(uri + "?updated=1", { from: contractOwner });

            assert.notEqual(uri, await erc721.tokenURI.call(tokenId));

            burnLastToken(erc721);
        });
    });

    context("tokenOf", () => {
        const contractOwner = accounts[0];
        const notContractOwner = accounts[1];

        it ("should be called only by anyone", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            try {
                await erc721.tokenOf.call(contractOwner, { from: contractOwner });
                await erc721.tokenOf.call(notContractOwner, { from: notContractOwner });
            } catch(e) {
                assert.fail("should not occur error");
            }
        });
        context("when address owns token", () => {
            it ("should return owned token id", async () => {
                const erc721 = await SRESundayVol2Badge.deployed();
                const tokenId = await erc721.getNextTokenId.call({ from: contractOwner });

                const recipient = accounts[0];
                await erc721.mint(recipient, { from: contractOwner });

                const ownedTokenId = await erc721.tokenOf.call(recipient, { from: contractOwner });

                assert.notEqual(0, parseInt(ownedTokenId.toString(), 10));

                burnLastToken(erc721);
            });
        });

        context("when address not owns token", () => {
            it ("should return empty array", async () => {
                const erc721 = await SRESundayVol2Badge.deployed();

                const zeroAddress = "0x0000000000000000000000000000000000000000";
                const ownedTokenId = await erc721.tokenOf.call(zeroAddress, { from: contractOwner });

                assert.equal(0, parseInt(ownedTokenId.toString(), 10));
            });
        });
    });

    context("transfer", () => {
        const contractOwner = accounts[0];
        const notContractOwner = accounts[1];

        const newOwner1 = accounts[2];
        const newOwner2 = accounts[3];

        it ("should be called by anyone who owns token", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            const firstTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
            await erc721.mint(contractOwner, { from: contractOwner });

            const secondTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
            await erc721.mint(notContractOwner, { from: contractOwner });

            try {
                await erc721.transferFrom(contractOwner, newOwner1, firstTokenId, { from: contractOwner });
                await erc721.transferFrom(notContractOwner, newOwner2, secondTokenId, { from: notContractOwner });
            } catch(e) {
                assert.fail("should not occur error");
            }

            burnToken(erc721, firstTokenId)
            burnToken(erc721, secondTokenId)
        });

        it ("should update tokenOf result", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            const tokenId = await erc721.getNextTokenId.call({ from: contractOwner });

            const initialOwner = accounts[0];
            const newOwner = accounts[1];
            await erc721.mint(initialOwner, { from: contractOwner });

            let initialOwnerTokenId = await erc721.tokenOf.call(initialOwner, { from: contractOwner });
            assert.notEqual(0, parseInt(initialOwnerTokenId.toString(), 10));

            await erc721.transferFrom(initialOwner, newOwner, tokenId, { from: initialOwner });

            initialOwnerTokenId = await erc721.tokenOf.call(initialOwner, { from: contractOwner });
            const newOwnerTokenId = await erc721.tokenOf.call(newOwner, { from: contractOwner });

            assert.equal(0, parseInt(initialOwnerTokenId.toString(), 10));
            assert(parseInt(newOwnerTokenId.toString(), 10) >= 0);

            burnLastToken(erc721);
        });
    });
    context("burn", () => {
        const contractOwner = accounts[0];
        const notContractOwner = accounts[1];

        it ("should be called only by contract owner", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            const firstTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
            await erc721.mint(contractOwner, { from: contractOwner });

            const secondTokenId = await erc721.getNextTokenId.call({ from: contractOwner });
            await erc721.mint(notContractOwner, { from: contractOwner });

            try {
                await erc721.burn(firstTokenId, { from: contractOwner })
            } catch(e) {
                assert.fail("should not occur error");
            }

            try {
                await erc721.burn(secondTokenId, { from: notContractOwner })
            } catch(e) {
                burnToken(erc721, secondTokenId);
                return;
            }

            assert.fail("should occur error");
        });

        it ("should update tokenOf result", async () => {
            const erc721 = await SRESundayVol2Badge.deployed();

            const owner = accounts[1];
            await erc721.mint(owner, { from: contractOwner });

            let ownedTokenId = await erc721.tokenOf.call(owner, { from: contractOwner });
            assert.notEqual(0, parseInt(ownedTokenId.toString(), 10));

            await erc721.burn(ownedTokenId, { from: contractOwner });

            ownedTokenId = await erc721.tokenOf.call(owner, { from: contractOwner });
            assert.equal(0, parseInt(ownedTokenId.toString(), 10));
        });
    });
});
