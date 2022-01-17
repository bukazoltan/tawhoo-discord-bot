const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} = require("discord.js");

const wait = require("util").promisify(setTimeout);

const { SlashCommandBuilder } = require("@discordjs/builders");
const { Tawhoo } = require("./../config.json");
const db = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tsession")
    .setDescription("A tawhoosession beállításai.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Egy tawhoo session elindítása.")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("end").setDescription("Egy tawhoo session leálítása.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Játékosok hozzáadása egy futó sessionhöz.")
    )
    .setDefaultPermission(false),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "start") {
      db.TawhooSession.find({ ongoing: true }).then((data) => {
        if (data.length !== 0) {
          interaction.reply(
            "Már fut egy tawhoo session! Új játékosokat az 'add' alparanccsal tudsz hozzáadni."
          );
        } else {
          const filter = (response) => {
            return (
              response.author.id === interaction.user.id &&
              response.mentions.users.size > 0
            );
          };
          interaction
            .reply("Tageld be a játékosokat!", { fetchReply: true })
            .then(async () => {
              interaction.channel
                .awaitMessages({
                  filter,
                  max: 1,
                  time: 1000000,
                  errors: ["time"],
                })
                .then((collected) => {
                  let tag_msg = collected.first();
                  tag_msg.mentions.users.forEach((user) => console.log(user));
                  let players = tag_msg.mentions.users.map((user) => {
                    return {
                      name: user.username,
                      discordID: user.id,
                      score: 0,
                    };
                  });
                  const newTawhoo = new db.TawhooSession({
                    players,
                    date: Date.now(),
                    ongoing: true,
                  });
                  tag_msg.delete();
                  interaction.editReply("Tawhoo session:");

                  db.TawhooCardSet.find({}, async (error, result) => {
                    let selectOptions = result.map((set) => {
                      return {
                        label: `${set.name}`,
                        value: `${set.id}`,
                      };
                    });
                    selectOptions.unshift({
                      label: `Nincs filter`,
                      description: "Játék indítása filter nélkül",
                      value: "no_filter",
                    });

                    const selectRow = new MessageActionRow().addComponents(
                      new MessageSelectMenu()
                        .setCustomId("select")
                        .setPlaceholder("Nincs filter")
                        .addOptions(selectOptions)
                    );

                    let embed = new MessageEmbed()
                      .setColor("RANDOM")
                      .setTitle(`Új tawhoo session fog indulni!`)
                      .setDescription(
                        `A résztvevő játékosok neve: **${newTawhoo.players
                          .map((player) => player.name)
                          .join(", ")}**`
                      )
                      .addField(
                        `Session ID-ja: ${newTawhoo._id}`,
                        "Válaszd ki a filtert a játékhoz:"
                      );

                    let msg = await interaction.editReply({
                      embeds: [embed],
                      components: [selectRow],
                    });

                    const filter = (i) => {
                      i.deferUpdate();
                      return i.user.id === interaction.user.id;
                    };

                    const collector =
                      interaction.channel.createMessageComponentCollector({
                        filter,
                        time: 9999999,
                        componentType: "SELECT_MENU",
                      });

                    collector.on("collect", async (i) => {
                      console.log(selectOptions);
                      let selectedFilter = selectOptions.filter(
                        (item) => item.value == i.values[0]
                      );
                      console.log(selectedFilter);
                      newTawhoo.cardSet = i.values[0];
                      let finalEmbed = new MessageEmbed()
                        .setColor("RANDOM")
                        .setTitle(`Új tawhoo session indult! Jó szórakozást!`)
                        .setDescription(
                          `A résztvevő játékosok neve: **${newTawhoo.players
                            .map((player) => player.name)
                            .join(", ")}**`
                        )
                        .addField(
                          `A következő paranccsal nézheted meg az állást:`,
                          "/tpoints2"
                        )
                        .addField(
                          `Session ID-ja: ${newTawhoo._id}`,
                          `Session filter: ${selectedFilter[0].label}`
                        );
                      newTawhoo.save().then(() => {
                        interaction.editReply({
                          embeds: [finalEmbed],
                          components: [],
                        });
                      });
                    });
                    // newTawhoo.save();
                  });
                })
                .catch(() => {
                  interaction.followUp(
                    "Nem kaptam választ, parancs leállítva."
                  );
                });
            });
        }
      });
    } else if (interaction.options.getSubcommand() === "end") {
      db.TawhooSession.find({ ongoing: true }).then((data) => {
        if (data.length === 0) {
          interaction.reply("Jelenleg nem fut egy tawhoo session sem!");
        } else {
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
          console.log(sortedScore);
          const findCurrentWinner = (arr) => {
            if (arr[0].value === 0 || arr.length === 1) {
              return `Úgy könnyű nyerni, ${arr[0].name}, ha egyedül játszol. Így vagy úgy, itt egy győzelmi GIF.`;
            }
            return `Gratulálok, ${arr[0].name}! Íme a győzelmi GIF-ed:`;
          };
          const embed = {
            color: 0x0099ff,
            title: "Le akarod zárni a futó sessiont?",
            description: `A session id-je: ${session._id}`,
            fields: sortedScore,
          };
          const row = new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId("tawhoo-end-yes")
                .setLabel("Igen")
                .setStyle("SUCCESS")
            )
            .addComponents(
              new MessageButton()
                .setCustomId("tawhoo-end-no")
                .setLabel("Nem")
                .setStyle("DANGER")
            );

          interaction.reply({ embeds: [embed], components: [row] });

          console.log(interaction);

          const filter = (i) =>
            i.customId.includes("tawhoo-end-") &&
            i.user.id === interaction.user.id;

          const collector = interaction.channel.createMessageComponentCollector(
            { filter, time: 15000, max: 1 }
          );

          collector.on("collect", async (i) => {
            if (i.customId === "tawhoo-end-yes") {
              let gifURL =
                Tawhoo.victoryGifs[
                  Math.floor(Math.random() * Tawhoo.victoryGifs.length)
                ];
              db.TawhooSession.updateOne(
                { _id: session._id },
                { ongoing: false }
              ).then(() =>
                i.update({
                  components: [],
                  embeds: [
                    {
                      color: 0x0099ff,
                      title: "A session véget ért!",
                      description: `${findCurrentWinner(sortedScore)}`,
                      image: {
                        url: gifURL,
                      },
                    },
                  ],
                })
              );
            } else {
              await i.update({
                components: [],
                embeds: [
                  {
                    color: 0x0099ff,
                    title: "Session lezárás visszavonva!",
                  },
                ],
              });
            }
          });
        }
      });
    } else if (interaction.options.getSubcommand() === "add") {
      db.TawhooSession.find({ ongoing: true }).then((data) => {
        if (data.length === 0) {
          interaction.reply("Jelenleg nem fut egy tawhoo session sem!");
        } else {
          const filter = (response) => {
            return (
              response.author.id === interaction.user.id &&
              response.mentions.users.size > 0
            );
          };

          interaction
            .reply("Tageld be a hozzáadandó játékos(oka)t!", {
              fetchReply: true,
            })
            .then(() => {
              interaction.channel
                .awaitMessages({
                  filter,
                  max: 1,
                  time: 30000,
                  errors: ["time"],
                })
                .then((collected) => {
                  let session = data[0];
                  let tag_msg = collected.first();
                  console.log(tag_msg);
                  let newPlayers = tag_msg.mentions.users.filter((member) => {
                    return !session.players.some(
                      (player) => player.discordID === member.id
                    );
                  });

                  console.log(newPlayers);

                  let playerInfo = newPlayers.map((member) => {
                    return {
                      name: member.username,
                      discordID: member.id,
                      score: 0,
                    };
                  });

                  console.log(playerInfo);

                  if (playerInfo.length > 0) {
                    let updatedPlayers = session.players.concat(playerInfo);
                    db.TawhooSession.updateOne(
                      { _id: session._id },
                      { players: updatedPlayers }
                    ).then(() => {
                      tag_msg.reply(
                        `Hozzáadtam az éppen futó sessionhöz a következő játékos${
                          updatedPlayers.length > 1 ? "oka" : ""
                        }t: ${newPlayers
                          .map((member) => member.username)
                          .join(", ")}`
                      );
                    });
                  } else {
                    return tag_msg.reply(
                      "Ez(ek) a játékos(ok) már a sessionben van!"
                    );
                  }
                })
                .catch((e) => {
                  console.log(e);
                  interaction.followUp(
                    "Nem kaptam választ, parancs leállítva."
                  );
                });
            });
        }
      });
    }
  },
};
