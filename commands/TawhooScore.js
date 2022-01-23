const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteractionOptionResolver } = require("discord.js");
const db = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tscore")
    .setDescription("Megváltoztatja valaki tawhoo pontszámát!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Pont(ok) hozzáadása.")
        .addUserOption((option) =>
          option
            .setName("játékos")
            .setDescription("Játékos neve")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName("pontok").setDescription("Pontok száma")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Pont(ok) levonása.")
        .addUserOption((option) =>
          option
            .setName("játékos")
            .setDescription("Játékos neve")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName("pontok").setDescription("Pontok száma")
        )
    )

    .setDefaultPermission(false),
  async execute(interaction) {
    const number = interaction.options.getInteger("pontok") || 1;
    const targetPlayer = interaction.options.getUser("játékos");
    console.log(targetPlayer);
    db.TawhooSession.find({ ongoing: true }).then((data) => {
      if (data.length === 0) {
        return interaction.reply("Nincs aktív session!");
      } else {
        let players = data[0].players;
        const userInSession = (userID, arr) => {
          return arr.some(function (el) {
            return el.discordID === userID;
          });
        };

        if (!userInSession(targetPlayer.id, players))
          return interaction.reply("Ez a felhasználó nincs a sessionben!");

        let updatedPoints = players.map((player) => {
          let newScore =
            interaction.options.getSubcommand() === "add"
              ? player.score + number
              : player.score - number;
          if (player.discordID === targetPlayer.id) {
            return {
              name: player.name,
              discordID: player.discordID,
              score: newScore,
            };
          } else {
            return {
              name: player.name,
              discordID: player.discordID,
              score: player.score,
            };
          }
        });
        console.log(updatedPoints);
        db.TawhooSession.updateOne(
          { ongoing: true },
          { players: updatedPoints }
        ).then(() => {
          db.TawhooSession.find({ ongoing: true }).then((data) => {
            let session = data[0];
            let scoreObj = session.players.map((player) => {
              return {
                name: player.name,
                value: player.score.toString(),
                inline: true,
              };
            });
            let orderByScore = function compare(a, b) {
              let a_val = parseInt(a.value);
              let b_val = parseInt(b.value);
              if (a_val < b_val) return 1;
              if (b_val < a_val) return -1;
              return 0;
            };
            let sortedScore = scoreObj.sort(orderByScore);
            const embed = {
              color: 0x0099ff,
              title: "A tawhoo session jelenlegi állása:",
              description: `**${targetPlayer.username}** ${
                interaction.options.getSubcommand() === "add"
                  ? "kapott"
                  : "elveszített"
              } ${number} pontot.`,
              fields: sortedScore,
            };
            interaction.reply({ embeds: [embed] });
          });
        });
      }
    });
  },
};
