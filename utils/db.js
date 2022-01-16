let mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3oqjy.mongodb.net/k9?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", function () {
  console.log("Csatlakoztam az adatbázishoz.");
});

const userSchema = new mongoose.Schema({
  discordID: { type: String, unique: true },
  username: String,
  points: Number,
  joinedTimestamp: Number,
});

const tawhooSchema = new mongoose.Schema(
  {
    wordToGuess: String,
    taboos: Array,
    imgURL: String,
    called: Number,
    tags: Array,
  },
  { strict: false }
);

const reactionRoleSchema = new mongoose.Schema(
  {
    name: String,
    messageID: String,
    roleID: String,
    channelID: String,
    channelName: String,
  },
  { strict: false }
);

const tawhooSessionSchema = new mongoose.Schema(
  {
    players: [
      {
        name: String,
        discordID: String,
        score: Number,
      },
    ],
    date: Date,
    ongoing: Boolean,
    cardSet: String,
  },
  { strict: false }
);

const tawhooCardSetSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    positive: Array,
    negative: Array,
  },
  { strict: false }
);

const dwCardSchema = new mongoose.Schema({
  names: Array,
  description: String,
  imgURL: String,
  rarity: Number,
  set: Array,
});

const dwCardInstanceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  card: { type: mongoose.Schema.Types.ObjectId, ref: "DWCard" },
  active: Boolean,
});

const monitoredChannelSchema = new mongoose.Schema(
  {
    name: String,
    channelID: String,
    lastMessageAuthorID: String,
    lastMessageDate: Date,
  },
  { strict: false }
);

const DiscordUser = mongoose.model("DiscordUser", userSchema);
const Tawhoo = mongoose.model("Tawhoo", tawhooSchema);
const TawhooSession = mongoose.model("TawhooSession", tawhooSessionSchema);
const ReactionRole = mongoose.model("ReactionRole", reactionRoleSchema);
const DWCard = mongoose.model("DWCard", dwCardSchema);
const DWCardInstance = mongoose.model("DWCardInstance", dwCardInstanceSchema);
const MonitoredChannel = mongoose.model(
  "monitoredChannel",
  monitoredChannelSchema
);
const TawhooCardSet = mongoose.model("TawhooCardSet", tawhooCardSetSchema);

module.exports.User = DiscordUser;
module.exports.Tawhoo = Tawhoo;
module.exports.TawhooSession = TawhooSession;
module.exports.ReactionRole = ReactionRole;
module.exports.DWCard = DWCard;
module.exports.DWCardInstance = DWCardInstance;
module.exports.MonitoredChannel = MonitoredChannel;
module.exports.TawhooCardSet = TawhooCardSet;
