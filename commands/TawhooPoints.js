const { SlashCommandBuilder } = require("@discordjs/builders");
const db = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tpoints")
    .setDescription("Kiírja a jelenlegi állást, ha van aktív tawhoo session."),
  async execute(interaction) {
    db.TawhooSession.find({ ongoing: true }).then((data) => {
      if (data.length === 0) {
        return interaction.reply(
          "Nincs folymatban lévő session. Egy tawhoo moderátor a /tsession2 paranccsal indíthat egyet."
        );
      }
      let session = data[0];
      let scoreObj = session.players.map((player) => {
        return {
          name: player.name,
          value: player.score.toString(),
          inline: true,
        };
      });
      let orderByScore = function compare(a, b) {
        if (a.value < b.value) return 1;
        if (b.value < a.value) return -1;
        return 0;
      };
      let sortedScore = scoreObj.sort(orderByScore);
      const embed = {
        color: 0x0099ff,
        title: "A tawhoo session jelenlegi állása:",
        description: `A session id-je: ${session._id}, aktív filter: ${
          session.cardSet ? session.cardSet : "nincs"
        }`,
        fields: sortedScore,
      };
      interaction.reply({ embeds: [embed] });
    });
  },
};
