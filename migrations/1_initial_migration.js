const LegendsOfVenariAlphaPass = artifacts.require("LegendsOfVenariAlphaPass");

module.exports = async (deployer) => {
  await deployer.deploy(
    LegendsOfVenariAlphaPass,
    900,
    150,
    20,
    "0xdada09daeec41155d50d2d9904d0560d609a1363ca5453ca6893c1be3a9bd750"
  );
};