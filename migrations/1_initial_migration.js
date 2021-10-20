const LegendsOfVenariPass = artifacts.require("LegendsOfVenariPass");

module.exports = async (deployer) => {
  await deployer.deploy(
    LegendsOfVenariPass,
    1200,
    50,
    3,
    "0x772c3239695d15da4716c3096c78366249fe1055c144c1bd95cede2cfbb8fe07"
  );
};
