const LegendsOfVenariPass = artifacts.require("LegendsOfVenariPass");

module.exports = async (deployer) => {
  await deployer.deploy(
    LegendsOfVenariPass,
    1200,
    50,
    3,
    "0xb5a8801b9e22b8aa25d30cd5d5ea7d2ec35cdafbb95e85b5cac5e227afeaeb88"
  );
};
