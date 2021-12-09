const LegendsOfVenariPass = artifacts.require("LegendsOfVenariPass");
const { arrayify } = require("@ethersproject/bytes");
const { Wallet } = require("ethers");
const truffleAssert = require('truffle-assertions');

contract("Legends Of Venari Pass", (accounts) => {
  let legendsOfVenariPass;

  const privateKey =
    "b3e4ae58bfc2131bbef35166ab4227a512d39f3efa2bc227ca2796409061019d";

  beforeEach(async () => {
    // Initialize the constructer with mint supply of 10 per faction, team supply of 5 per faction
    // and max mint of 3 for easier testing
    legendsOfVenariPass = await LegendsOfVenariPass.new(10, 5, 3, "0x61ca1749e84bc539f9d0f99bd3ef4ee24da7209adb0d940912abc7c3b4c560c9");

    this.wallet = new Wallet(privateKey);

    await legendsOfVenariPass.setSignVerifier(this.wallet.address);
  });

  it("should set presale state only as owner", async () => {
    // Fails if not the owner
    truffleAssert.fails(
      legendsOfVenariPass.flipPresaleState({
      from: accounts[1]
    })
    );

    await legendsOfVenariPass.flipPresaleState();
    assert.equal(await legendsOfVenariPass.getPreSaleState(), true);
  });

  it("should return false if a user hasn't minted in the presale", async () => {
    assert.equal(await legendsOfVenariPass.getPresaleClaimed(accounts[0]), false);
  });

  it("should set sale state only as owner", async () => {
    // Fails if not the owner
    truffleAssert.fails(
      legendsOfVenariPass.flipSaleState({
      from: accounts[1]
    })
    );

    await legendsOfVenariPass.flipSaleState();
    assert.equal(await legendsOfVenariPass.getSaleState(), true);
  });

  it("should fail to redeem a presale mint if presale is not turned on", async () => {
    const sigHash = await legendsOfVenariPass.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    truffleAssert.fails(
      legendsOfVenariPass.mintPresale(1, 6, 0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if faction is not valid", async () => {
    const sig = await this.wallet.signMessage(arrayify(sigHash));
    truffleAssert.fails(
      legendsOfVenariPass.mintPresale(1, 6, 3, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if tokenCount is greater than limit", async () => {
    const sigHash = await legendsOfVenariPass.getPresaleSigningHash(
      accounts[0],
      8,
      6,
      1
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    truffleAssert.fails(
      legendsOfVenariPass.mintPresale(8, 6, 1, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if incorrect eth value", async () => {
    const sigHash = await legendsOfVenariPass.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      1
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    await legendsOfVenariPass.flipPresaleState();
    truffleAssert.fails(
      legendsOfVenariPass.mintPresale(1, 6, 1, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.0", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint if incorrect address", async () => {
    const sigHash = await legendsOfVenariPass.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      1
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));
    await legendsOfVenariPass.flipPresaleState();
    truffleAssert.fails(
      legendsOfVenariPass.mintPresale(1, 6, 1, sig, {
      from: accounts[1],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to redeem a presale mint when main sale is turned on", async () => {
    const sigHash = await legendsOfVenariPass.getPresaleSigningHash(
      accounts[0],
      1,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.flipPresaleState();
    truffleAssert.fails(
      legendsOfVenariPass.mintPresale(1, 6, 1, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should redeem 20 partner mints", async () => {
    const sigHash = await legendsOfVenariPass.getPartnerSigningHash(
      accounts[0],
      [0,1,2,0,1,2,0,1,2,0,0,1,2,0,1,2,0,1,2,0],
      [accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0]],
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.partnerMint(
      [0,1,2,0,1,2,0,1,2,0,0,1,2,0,1,2,0,1,2,0], 
      [accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0]],
      0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("3.76", "ether"),
    });

    assert.equal(await legendsOfVenariPass.ownerOf(0), accounts[0]);
    assert.equal(await legendsOfVenariPass.ownerOf(19), accounts[0]);
  });

  it("should fail to redeem after already submitting the same sig", async () => {
    const sigHash = await legendsOfVenariPass.getPartnerSigningHash(
      accounts[0],
      [0,1,2,0,1,2,0,1,2,0,0,1,2,0,1,2,0,1,2,0],
      [accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0]],
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.partnerMint(
      [0,1,2,0,1,2,0,1,2,0,0,1,2,0,1,2,0,1,2,0], 
      [accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0]],
      0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("3.76", "ether"),
    });

    assert.equal(await legendsOfVenariPass.ownerOf(0), accounts[0]);
    assert.equal(await legendsOfVenariPass.ownerOf(19), accounts[0]);

    truffleAssert.fails(
      legendsOfVenariPass.partnerMint(
        [0,1,2,0,1,2,0,1,2,0,0,1,2,0,1,2,0,1,2,0], 
        [accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0],accounts[0]],
        0, sig, {
        from: accounts[0],
        value: web3.utils.toWei("3.76", "ether"),
      })
    );
  });

  it("should redeem a presale mint", async () => {
    await legendsOfVenariPass.flipPresaleState();

    await legendsOfVenariPass.presaleMint(
      1827,
      ["0x237ca6abbdf8397134f594910fb7bab4623b553a34939740dc6ddd7f8c582fed",
        "0x1da550fe8eb0b87a1d335d857a3f11cf06b37fc7bad1b6dc02b9e6db2d207de6",
        "0x56de264a64f201a638a0bed17b89d7986c82266562df24a1a87fa5a5ce5bc622",
        "0xb0232b5874808009d70c0412a6cbaced59254cfc3d6998ba22d68a5823778ef3",
        "0xe6e5b9e264a283dd55dcec0a69cb0d271942e1d8d79a9b4050f2fde678ac471d"],
      1, {
        from: this.wallet,
        value: web3.utils.toWei("0.188", "ether")
      });

    assert.equal(await legendsOfVenariPass.ownerOf(0), this.wallet);
  });

  it("should redeem 6 presale mints", async () => {
    const sigHash = await legendsOfVenariPass.getPresaleSigningHash(
      accounts[0],
      6,
      6,
      0
    );

    const sig = await this.wallet.signMessage(arrayify(sigHash));

    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.mintPresale(6, 6, 0, sig, {
      from: accounts[0],
      value: web3.utils.toWei("0.528", "ether"),
    });

    assert.equal(await legendsOfVenariPass.ownerOf(0), accounts[0]);
    assert.equal(await legendsOfVenariPass.ownerOf(5), accounts[0]);
  });

  it("should redeem when main sale is turned on even though presale is on", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();
    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    assert.equal(await legendsOfVenariPass.ownerOf(0), accounts[0]);
  });

  it("should fail to mint in main sale if minting more than limit", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    truffleAssert.fails(
      legendsOfVenariPass.mint(6, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.528", "ether"),
    })
    );
  });

  it("should fail to mint in main sale if sending less ETH than required", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    truffleAssert.fails(
      legendsOfVenariPass.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.088", "ether"),
    })
    );
  });

  it("should fail to mint in main sale if total exceeds required mint", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    truffleAssert.fails(
      legendsOfVenariPass.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    })
    );
  });

  it("should fail to mint in main sale if sale has been sold out", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await legendsOfVenariPass.mint(4, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.352", "ether"),
    });

    truffleAssert.fails(
      legendsOfVenariPass.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    })
    );
  });

  it("should mint to max limit", async () => {
    // Can only mint 10 of faction 0

    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(1, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.188", "ether"),
    });
  });

  it("should fail if minting to staff while sale is ongoing", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    truffleAssert.fails(
      legendsOfVenariPass.mintToAddress(accounts[2], 1, 0, {
      from: accounts[0]
    })
    );
  });

  it("should allow minting to staff if sale is finished", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(1, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.188", "ether"),
    });

    await legendsOfVenariPass.mintToAddress(accounts[3], 1, 0);
  });

  it("should allow minting of staff up to the limit", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(1, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.188", "ether"),
    });

    await legendsOfVenariPass.mintToAddress(accounts[3], 4, 0);
    await legendsOfVenariPass.mintToAddress(accounts[3], 4, 1);
  });

  it("should allow fail minting for staff past the limit", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.564", "ether"),
    });

    await legendsOfVenariPass.mint(4, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[1],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await legendsOfVenariPass.mint(4, 1, {
      from: accounts[1],
      value: web3.utils.toWei("0.352", "ether"),
    });

    await legendsOfVenariPass.mintToAddress(accounts[3], 4, 0);
    await legendsOfVenariPass.mintToAddress(accounts[3], 4, 1);

    truffleAssert.fails(
      legendsOfVenariPass.mintToAddress(accounts[3], 1, 0)
    );
  });

  it("should fail to mint in main sale if sale has been sold out", async () => {
    await legendsOfVenariPass.flipPresaleState();
    await legendsOfVenariPass.flipSaleState();

    await legendsOfVenariPass.mint(3, 0, {
      from: accounts[0],
      value: web3.utils.toWei("0.264", "ether"),
    });

    await legendsOfVenariPass.setBaseURI("https://api.legendsofvenari.com/game-pass/");

    assert.equal(await legendsOfVenariPass.tokenURI(0), "https://api.legendsofvenari.com/game-pass/0");
  });
});
