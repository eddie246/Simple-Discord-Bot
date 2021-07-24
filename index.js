require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client();

const cleverbot = require("cleverbot-free");
const contex = [];

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to the databse"))
  .catch((err) => console.log("Error occured connecting to database: ", err));

const commandSchema = new Schema({
  cmds: String,
});

const Command = mongoose.model("command", commandSchema);

const messageArchive = {};

let lastMessage = "";
let lastUser = "";
let msgInRowCount = 0;

client.on("ready", () => {
  console.log(`logged in as ${client.user.tag}`);
  client.user.setPresence({
    status: "online",
    activity: {
      name: "Dolpins are hot",
      type: "WATCHING",
    },
  });
});

client.on("message", async (message) => {
  if (message.author.bot) return;

  const doc = await Command.find({});
  const docParsed = JSON.parse(doc[0].cmds);

  if (message.content.includes(".")) {
    if (message.content === ".help") {
      message.reply(
        `1. .addSimpCommand: adds a simple . command | SYNTAX: .addSimpCommand <command name> <command output>
         2. .allSimpCommands: shows all simple . commands added | Syntax: .allSimpCommands 
         3. .contribute: Github repo, please help make gooder | Syntax: .contribute
         4. .simp: You a simp | Syntax: .simp
        `
      );
    }

    if (message.content.includes(".ai")) {
      cleverbot(message.content.slice(2), contex).then((response) => {
        contex.concat([message.content, response]);
        message.reply(response);

        if (contex.length >= 50) {
          contex = contex.slice(-50);
        }
      });
    }

    if (message.content === ".contribute") {
      message.reply("https://github.com/eddie246/Simple-Discord-Bot");
    }

    if (
      message.content.slice(0, 15) === ".addSimpCommand"
      // && message.member.roles.cache.find((r) => r.name.toLowerCase() === 'admin')
    ) {
      if (message.content.split(" ").length < 2) {
        message.reply(
          "Wrong Syntax, please try: .addSimpCommand <command name> <command output>"
        );

        return;
      } else {
        // Command.create({
        //   cmds: JSON.stringify({
        //     '.simp':
        //       'https://i1.sndcdn.com/artworks-i0tlutgH246RaMuh-9ip1iA-t500x500.jpg',
        //     '.inviteLink':
        //       'https://discord.com/oauth2/authorize?client_id=865441338623131668&permissions=519232&scope=bot',
        //     '.hello': 'world',
        //     '.yes': 'no',
        //   }),
        // });
        let newCommand = message.content.split(" ")[1];
        newCommand[0] === "." ? newCommand : (newCommand = "." + newCommand);
        const newCommandOutput = message.content.split(" ").slice(2).join(" ");

        docParsed[newCommand] = newCommandOutput;
        message.reply("new command added");

        await Command.updateOne(
          {},
          { $set: { cmds: JSON.stringify(docParsed) } }
        );
        return;
      }
    }

    if (message.content.includes(".msgArchive")) {
      if (message.content.split(" ").length !== 3) {
        message.reply(
          "Wrong Syntax, please try: .msgArchive <@user> <message index>"
        );
        return;
      }
      const msgArchiveRequestOriginal = message.content.split(" ")[1];
      const msgArchiveRequest = msgArchiveRequestOriginal.replace("!", "");
      const msgArchiveNumber = message.content.split(" ")[2];

      const requestUserMessages =
        messageArchive[msgArchiveRequest] || undefined;

      if (requestUserMessages) {
        message.channel.send(
          `${requestUserMessages[msgArchiveNumber]}  - ${msgArchiveRequestOriginal}`
        );
        return;
      } else {
        message.channel.send("No message found");
      }
    }

    if (message.content.includes(".allSimpCommands")) {
      let replyStr = "";
      for (const command in docParsed) {
        replyStr += ` ${command}`;
      }
      message.reply(replyStr);
      return;
    }

    if (message.content === ".wednesday") {
      let dayOfWeek = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
      });
      dayOfWeek = new Date(dayOfWeek);
      console.log(dayOfWeek.getDay());

      if (dayOfWeek.getDay() === 3) {
        message.channel.send(
          "https://i.kym-cdn.com/entries/icons/original/000/020/016/wednesdaymydudeswide.jpg"
        );
      } else {
        message.channel.send("https://i.redd.it/eqtja26y4yz61.png");
      }
      return;
    }

    if (docParsed[message.content]) {
      message.channel.send(docParsed[message.content]);
      return;
    }
  } else {
    if (message.mentions.has(client.user.id)) {
      if (
        message.content.includes("@here") ||
        message.content.includes("@everyone")
      )
        return;

      if (message.content.toLocaleLowerCase() === "fuck you") {
        message.reply(
          "i cri now u hapy? y yu alwys buly im just a robot i do wht i told y u mak me sad"
        );
      } else if (message.content.toLocaleLowerCase() === "i love you") {
        message.reply("I only think of you as a friend...");
      }
    }

    if (messageArchive[message.author]) {
      let authorMessages = messageArchive[message.author];

      authorMessages.push(message.content);

      if (authorMessages.length > 5) {
        authorMessages = authorMessages.slice(-5);
      }

      messageArchive[message.author] = authorMessages;
    } else {
      messageArchive[message.author] = [message.content];
    }

    if (
      lastMessage === message.content &&
      message.author !== lastUser &&
      message.author.bot === false
    ) {
      msgInRowCount++;

      if (msgInRowCount === 3 && lastMessage === "pp") {
        message.channel.send("P FUCKING P WOOOOOOOOOOO!!!");
        msgInRowCount = 0;
      } else if (msgInRowCount === 3) {
        message.channel.send(lastMessage.toLocaleUpperCase());
        msgInRowCount = 0;
      }
    } else {
      lastMessage = message.content;
      lastUser = message.author;
    }

    if (message.content.toLocaleLowerCase().includes("dolphin")) {
      message.channel.send(":peanuts:");
    }

    if (message.content.includes("phil")) {
      message.channel.send(":antiPhil:");
    }

    if (message.content.includes("duck")) {
      if (Math.random() * 3 > 2) {
        message.channel.send("goose");
      }
    }

    if (
      message.content.toLowerCase().includes("whos joe") ||
      message.content.toLowerCase().includes("who is joe")
    ) {
      message.channel.send("JOE MAMA");
    }

    if (
      message.content.toLocaleLowerCase().includes("bukkake", "bukake") ||
      message.content.toLocaleLowerCase().includes("bukake")
    ) {
      message.channel.send(":eggplant: :sweat_drops: :dog:");
    }

    if (message.content.toLocaleLowerCase().includes("struggle")) {
      message.reply("striggle*");
    } else if (message.content.toLocaleLowerCase().includes("struggling")) {
      message.reply("striggling*");
    }

    if (message.content.includes(" 69 ") || message.content === "69") {
      message.channel.send("nice");
    }

    if (message.content === "420") {
      message.channel.send("stay in drugs, dont do school");
    }

    if (message.content.toLowerCase().includes("ink_farts")) {
      message.channel.send(":pen_fountain: :dash:");
    }

    if (message.content.includes("kinky")) {
      message.channel.send("( ͡° ͜ʖ ͡°)");
    }
  }
});

client.login(process.env.TOKEN);
