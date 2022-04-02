const { guildId, Tawhoo } = require("./../config.json");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    const permissions = Tawhoo.adminIDs.map((id) => {
      return {
        id,
        type: "USER",
        permission: true,
      };
    });

    console.log(`Ready! Logged in as ${client.user.tag}`);

    const setPermission = async (commandId, permissions) => {
      const command = await client.guilds.cache
        .get(guildId)
        ?.commands.fetch(commandId);
      command.permissions.set({ permissions });
      console.log(`A ${commandId} parancs jogosultsága felülírva.`);
    };
    // DWH
    setPermission("932217809499455499", permissions);
    setPermission("932217809499455501", permissions);
    setPermission("932217809499455502", permissions);
    // WHOAnon
    /*setPermission("941036395441557520", permissions);
    setPermission("941036395441557519", permissions);
    setPermission("941036395441557517", permissions);*/
    const commands = await client.guilds.cache.get(guildId)?.commands.fetch();
    commands.forEach((command) =>
      console.log(`${command.name} - ${command.id}`)
    );
  },
};
