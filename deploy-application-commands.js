const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId } = require("./config.json");
require("dotenv").config();

const commands = [];

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(process.env.SECRET);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then((data) => console.log(data))
  .catch(console.error);
