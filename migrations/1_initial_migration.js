const LegendsOfVenariPass = artifacts.require("LegendsOfVenariPass");

module.exports = async (deployer) => {
  await deployer.deploy(
    LegendsOfVenariPass,
    1200,
    50,
    3,
    "0xdada09daeec41155d50d2d9904d0560d609a1363ca5453ca6893c1be3a9bd750"
  );
};