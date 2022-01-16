const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Says hi to a specific user!")
    .addUserOption((option) =>
      option.setName("felhasználó").setDescription("Kinek köszönjek?")
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("target");
    await interaction.reply(`Hello ${user.username}!`);
  },
};
