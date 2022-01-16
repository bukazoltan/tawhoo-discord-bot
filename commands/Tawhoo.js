const { SlashCommandBuilder } = require("@discordjs/builders");
const db = require("../utils/db");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tawhoo")
    .setDescription("Tawhoo feladvány lehívása"),
  async execute(interaction) {
    const pickByRarity = (array, randomToGenerate) => {
      let randomMatches = [];
      for (let index = 0; index < randomToGenerate; index++) {
        randomMatches.push(array[Math.floor(Math.random() * array.length)]);
      }
      let comparisonFuntion = function compare(a, b) {
        if (a.called > b.called) return 1;
        if (b.called > a.called) return -1;
        return 0;
      };
      let sortedMatches = randomMatches.sort(comparisonFuntion);
      return sortedMatches[0];
    };

    const findCommonElements = (arr1, arr2) => {
      return arr1.some((item) => arr2.includes(item));
    };

    const sendTawhoo = (t, i) => {
      let embed = new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(t.wordToGuess)
        .setImage(t.imgURL)
        .setDescription(
          "Írd le ezt a Doctor Who fogalmat az alábbi szavak kihagyásával:"
        )
        .addField("Taboo szavak", t.taboos.join(","));
      i.user.send({ embeds: [embed] });
      db.Tawhoo.updateOne(
        { _id: t._id },
        { $inc: { called: 1 } },
        function (err) {
          console.log(err);
        }
      );
      i.reply("Elküldtem a feladványt!");
    };
    db.Tawhoo.find({}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        db.TawhooSession.find({ ongoing: true }).then((data) => {
          if (data.length) {
            db.TawhooCardSet.find({ _id: data[0].cardSet }).then((d) => {
              let positive = d[0].positive;
              let negative = d[0].negative;
              const filterFunction = (e) => {
                return (
                  findCommonElements(e.tags, positive) &&
                  !findCommonElements(e.tags, negative)
                );
              };

              let filtered = result.filter(filterFunction);
              console.log("filtered", filtered.length);
              console.log("nonfiltered", result.length);
              let pickedTawhoo = pickByRarity(filtered, 3);
              sendTawhoo(pickedTawhoo, interaction);
            });
          } else {
            let pickedTawhoo = pickByRarity(result, 3);
            sendTawhoo(pickedTawhoo, interaction);
          }
        });
      }
    });
  },
};
