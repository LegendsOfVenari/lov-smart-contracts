const LegendsOfVenariPass = artifacts.require("LegendsOfVenariPass");

module.exports = async (deployer) => {
  await deployer.deploy(
    LegendsOfVenariPass,
    3600,
    150,
    3,
    "0xb8d3654631ce397299c12071128bb5462d89e5e17a29e3be7d86e1d7012b72c1"
  );
};
