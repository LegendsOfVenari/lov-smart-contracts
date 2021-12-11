const LegendsOfVenariAlphaPass = artifacts.require("LegendsOfVenariAlphaPass");

module.exports = async (deployer) => {
  await deployer.deploy(
    LegendsOfVenariAlphaPass,
    950,
    100,
    20,
    "0x1470cae2b60547e89b44b1c061b3a0c38b6ecdf7cbd3ffb194a925830eebde29"
  );
};