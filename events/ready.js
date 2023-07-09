const { guildId, Tawhoo } = require("./../config.json");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
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
