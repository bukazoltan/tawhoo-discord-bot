const { MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("question")
    .setDescription("Asks a question from the user"),
  async execute(interaction) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("yes")
          .setLabel("Igen")
          .setStyle("SUCCESS")
      )
      .addComponents(
        new MessageButton().setCustomId("no").setLabel("Nem").setStyle("DANGER")
      );

    await interaction.reply({
      content: "K9 a legjobb?",
      components: [row],
    });

    const filter = (i) => i.customId === "yes" || i.customId === "no";

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "yes") {
        await i.update({ content: "Helyes válasz", components: [] });
      } else if (i.customId === "no") {
        await i.update({ content: "Téves!", components: [] });
      }
    });

    collector.on("end", (collected) =>
      console.log(`Collected ${collected.size} items`)
    );
  },
};
