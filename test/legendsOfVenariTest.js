const LegendsOfVenariPass = artifacts.require("LegendsOfVenariPass");
const { arrayify } = require("@ethersproject/bytes");
const { Wallet } = require("ethers");
const truffleAssert = require('truffle-assertions');

contract("Legends Of Venari Pass", (accounts) => {
  let legendsOfVenariPass;

  const privateKey =
    "208065a247edbe5df4d86fbdc0171303f23a76961be9f6013850dd2bdc759bbb";

  beforeEach(async () => {
    // Initialize the constructer with mint supply of 8, team supply of 4
    // and staff supply of 10 for easier testing
    legendsOfVenariPass = await LegendsOfVenariPass.new(10, 5, 4, 4, 4);
    secretModule = await SecretModule.new(savageDroids.address);

    this.wallet = new Wallet(privateKey);

    await savageDroids.setSignVerifier(this.wallet.address);
  });

  it("should set presale state only as owner", async () => {
    // Fails if not the owner
    truffleAssert.fails(
      savageDroids.flipPresaleState({
      from: accounts[1]
    })
    );

    await savageDroids.flipPresaleState();
    assert.equal(await savageDroids.getPreSaleState(), true);
  });

  it("should return false if a user hasn't minted in the presale", async () => {
    assert.equal(await savageDroids.getPresaleClaimed(accounts[0]), false);
  });

  it("should set sale state only as owner", async () => {
    // Fails if not the owner
    truffleAssert.fails(
      savageDroids.flipSaleState({
      from: accounts[1]
    })
    );

    await savageDroids.flipSaleState();
    assert.equal(await savageDroids.getSaleState(), true);
  });

  it("should fail to redeem a presale mint if presale is not turned on", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    truffleAssert.fails(
      savageDroids.mintPresale(1, 6, 0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if faction is not valid", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      3
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    truffleAssert.fails(
      savageDroids.mintPresale(1, 6, 3, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if tokenCount is greater than limit", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      8,
      6,
      1
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    truffleAssert.fails(
      savageDroids.mintPresale(8, 6, 1, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if incorrect eth value", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      1
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    await savageDroids.flipPresaleState();
    truffleAssert.fails(
      savageDroids.mintPresale(1, 6, 1, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.0", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if incorrect address", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      1
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    await savageDroids.flipPresaleState();
    truffleAssert.fails(
      savageDroids.mintPresale(1, 6, 1, sig, {
      from: accounts[1],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint when main sale is turned on", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.flipPresaleState();
    truffleAssert.fails(
      savageDroids.mintPresale(1, 6, 1, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a duplicate presale mint", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await savageDroids.flipPresaleState();
    await savageDroids.mintPresale(1, 6, 0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    });

    assert.equal(await savageDroids.ownerOf(0), accounts[0]);

    truffleAssert.fails(
      savageDroids.mintPresale(1, 6, 1, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should redeem a presale mint", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await savageDroids.flipPresaleState();
    await savageDroids.mintPresale(1, 6, 0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    });

    assert.equal(await savageDroids.ownerOf(0), accounts[0]);
  });

  it("should redeem 6 presale mints", async () => {
    const sigHash = await savageDroids.getPresaleSigningHash(
      accounts[0],
      6,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await savageDroids.flipPresaleState();
    await savageDroids.mintPresale(6, 6, 0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.528", "ether"),
    });

    assert.equal(await savageDroids.ownerOf(0), accounts[0]);
    assert.equal(await savageDroids.ownerOf(5), accounts[0]);
  });

  it("should redeem when main sale is turned on even though presale is on", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();
    await savageDroids.mint(4, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.352", "ether"),
    });

    assert.equal(await savageDroids.ownerOf(0), accounts[0]);
  });

  it("should fail to mint in main sale if minting more than limit", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    truffleAssert.fails(
      savageDroids.mint(6, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.528", "ether"),
    })
    );
  });

  it("should fail to mint in main sale if sending less ETH than required", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    truffleAssert.fails(
      savageDroids.mint(4, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to mint in main sale if total exceeds required mint", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    truffleAssert.fails(
      savageDroids.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    })
    );
  });

  it("should fail to mint in main sale if sale has been sold out", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(4, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.352", "ether"),
    });

    truffleAssert.fails(
      savageDroids.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    })
    );
  });

  it("should mint to max limit", async () => {
    // Can only mint 7 of faction 0

    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(1, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    });
  });

  it("should fail if minting to staff while sale is ongoing", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    truffleAssert.fails(
      savageDroids.mintToAddress(accounts[2], 1, 0, {
      from: accounts[0]
    })
    );
  });

  it("should allow minting to staff if sale is finished", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(4, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await savageDroids.mint(3, 1, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(4, 1, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await savageDroids.mintToAddress(accounts[3], 1, 0);
  });

  it("should allow minting of staff up to the limit", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(4, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await savageDroids.mint(3, 1, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(4, 1, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await savageDroids.mintToAddress(accounts[3], 4, 0);
    await savageDroids.mintToAddress(accounts[3], 4, 1);
  });

  it("should allow fail minting for staff past the limit", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(4, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await savageDroids.mint(3, 1, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.mint(4, 1, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await savageDroids.mintToAddress(accounts[3], 4, 0);
    await savageDroids.mintToAddress(accounts[3], 4, 1);

    truffleAssert.fails(
      savageDroids.mintToAddress(accounts[3], 1, 0)
    );
  });

  it("should fail to mint in main sale if sale has been sold out", async () => {
    await savageDroids.flipPresaleState();
    await savageDroids.flipSaleState();

    await savageDroids.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await savageDroids.setBaseURI("https://savagedroids.com/api/");

    assert.equal(await savageDroids.tokenURI(0), "https://savagedroids.com/api/0");
  });
});
