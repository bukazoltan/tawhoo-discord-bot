const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

const db = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tcardset")
    .setDescription("A kártya szettek kezelése.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Egy kártyaszett hozzáadása.")
        .addStringOption((option) =>
          option
            .setName("név")
            .setDescription("Az új szett neve")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("check").setDescription("A kártya szettek kezelése.")
    )
    .setDefaultPermission(false),
  async execute(interaction) {
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    if (interaction.options.getSubcommand() === "add") {
      const setName = interaction.options.getString("név");

      db.Tawhoo.find({}, function (err, result) {
        let tagArrays = result.map((t) => t.tags);
        let usedTags = tagArrays.flat().filter(onlyUnique);
        let embed = new MessageEmbed()
          .setColor("RANDOM")
          .setTitle(`Új kártyaszett hozzáadása: ${setName}`)
          .setDescription(
            `Az alábbi tagekkel vannak tawhoo kártyák: ${usedTags.join(", ")}`
          )
          .addField(
            `Adj meg egy szett szabályt, pl.:`,
            " general, newwho, bigfinish NEM seven"
          );
        interaction.reply({ embeds: [embed] });

        const filter = (response) => {
          return response.author.id === interaction.user.id;
        };
        interaction.channel
          .awaitMessages({
            filter,
            max: 1,
            time: 30000,
            errors: ["time"],
          })
          .then((collected) => {
            let splitString = collected.first().content.split(" NEM ");

            let output =
              splitString.length == 1
                ? { pos: splitString[0].split(", ") }
                : {
                    pos: splitString[0].split(", "),
                    neg: splitString[1].split(", "),
                  };

            let followupEmbed = new MessageEmbed()
              .setColor("RANDOM")
              .setTitle(`Értettem! Új kártyaszett hozzáadása: ${setName}`)
              .setDescription("Az alábbi szettet akarod hozzáadni?")
              .addField(
                `Engedélyezve a szettben:`,
                `${output["pos"].join(", ")}`
              )
              .addField(
                `Tiltva a szettben:`,
                `${output["neg"] ? output["neg"].join(", ") : "Nincsen"}`
              );
            const row = new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setCustomId("card-set-yes")
                  .setLabel("Igen")
                  .setStyle("SUCCESS")
              )
              .addComponents(
                new MessageButton()
                  .setCustomId("card-set-no")
                  .setLabel("Nem")
                  .setStyle("DANGER")
              );
            interaction.followUp({
              embeds: [followupEmbed],
              components: [row],
            });
            const btnFilter = (i) =>
              i.customId.includes("card-set-") &&
              i.user.id === interaction.user.id;

            const collector =
              interaction.channel.createMessageComponentCollector({
                filter: btnFilter,
                time: 15000,
                max: 1,
              });

            collector.on("collect", async (i) => {
              if (i.customId === "card-set-yes") {
                const newCardSet = new db.TawhooCardSet({
                  name: setName,
                  positive: output["pos"],
                  negative: output["neg"] ? output["neg"] : [],
                });

                newCardSet
                  .save()
                  .then(() =>
                    i.update({
                      components: [],
                      embeds: [
                        {
                          color: 0x0099ff,
                          title: "Létrehoztam a kártyaszettet!",
                        },
                      ],
                    })
                  )
                  .catch((err) => {
                    if (err.code === 11000) {
                      i.update({
                        components: [],
                        embeds: [
                          {
                            color: 0x0099ff,
                            title: "Hiba! Ezzel a névvel már van szett!",
                          },
                        ],
                      });
                    }
                  });
              } else {
                await i.update({
                  components: [],
                  embeds: [
                    {
                      color: 0x0099ff,
                      title: "Kártyalétrehozás visszavonva!",
                    },
                  ],
                });
              }
            });
          });
      });
    } else if (interaction.options.getSubcommand() === "check") {
      db.TawhooCardSet.find({}, (err, cardSets) => {
        if (cardSets.length == 0) {
          interaction.reply("Nem találtam egy szettet sem!");
        } else {
          let cardSetObjects = cardSets.map((set) => {
            return {
              name: `${set.name} (${set._id})`,
              value: `${set.positive.join(", ")} ${
                set.negative.length > 0 ? "NEM" : ""
              } ${set.negative.join(", ")}`,
            };
          });
          const cardSetInfoEmbed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("A jelenlegi kártyaszettek:")
            .addFields(cardSetObjects)
            .setTimestamp();
          interaction.reply({ embeds: [cardSetInfoEmbed] });
        }
      });
    }
  },
};
