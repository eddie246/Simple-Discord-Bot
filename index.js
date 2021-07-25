//node stuff
const fs = require('fs');
require('dotenv').config();
const btoa = require('btoa');
const atob = require('atob');

//discord stuff
const Discord = require('discord.js');
const client = new Discord.Client();

//cleverbot stuff
const cleverbot = require('cleverbot-free');
let contex = [];

//mongodb stuff
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('connected to the databse'))
  .catch((err) => console.log('Error occured connecting to database: ', err));

const commandSchema = new Schema({
  cmds: String,
});

const saveSchema = new Schema({
  data: String,
});

const Command = mongoose.model('command', commandSchema);
const GbaSave = mongoose.model('gbaSave', saveSchema);

//Gba stuff
const GameBoyAdvance = require('gbajs');
const gba = new GameBoyAdvance();

gba.logLevel = gba.LOG_ERROR;

var biosBuf = fs.readFileSync('./node_modules/gbajs/resources/bios.bin');
gba.setBios(biosBuf);
gba.load;
gba.setCanvasMemory();

gba.loadRomFromFile(
  'src/Pokemon - Fire Red Version (U) (V1.1).gba',
  async function (err, result) {
    if (err) {
      console.error('loadRom failed:', err);
      process.exit(1);
    }
    // gba.loadSavedataFromFile('src/');
    // const save = fs.readFileSync('src/save.txt', 'utf-8');

    const rawSave = await GbaSave.find({});
    // console.log(rawSave[0].data);
    const save = rawSave[0].data;
    // console.log(save);

    var length = (save.length * 3) / 4;
    if (save[save.length - 2] == '=') {
      length -= 2;
    } else if (save[save.length - 1] == '=') {
      length -= 1;
    }
    var buffer = new ArrayBuffer(length);
    var view = new Uint8Array(buffer);
    var bits = save.match(/..../g);
    for (var i = 0; i + 2 < length; i += 3) {
      var s = atob(bits.shift());
      view[i] = s.charCodeAt(0);
      view[i + 1] = s.charCodeAt(1);
      view[i + 2] = s.charCodeAt(2);
    }
    if (i < length) {
      var s = atob(bits.shift());
      view[i++] = s.charCodeAt(0);
      if (s.length > 1) {
        view[i++] = s.charCodeAt(1);
      }
    }
    gba.mmu.loadSavedata(buffer);
    gba.runStable();
    console.log('Game loaded');
  }
);

let idx = 0;
let keypad = gba.keypad;

let AToggle = false;
let BToggle = false;
let UPToggle = false;
let DOWNToggle = false;
let LEFTToggle = false;
let RIGHTToggle = false;

///////////////msg archive

const messageArchive = {};

let lastMessage = '';
let lastUser = '';
let msgInRowCount = 0;

client.on('ready', () => {
  console.log(`logged in as ${client.user.tag}`);
  client.user.setPresence({
    status: 'online',
    activity: {
      name: 'Dolpins are hot',
      type: 'WATCHING',
    },
  });
});

client.on('message', async (message) => {
  if (message.author.bot) return;

  const doc = await Command.find({});
  const docParsed = JSON.parse(doc[0].cmds);

  const filter = (reaction, user) => {
    return (
      ['🅰', '⬆', '⬇', '⬅', '➡', '🅱'].includes(reaction.emoji.name) &&
      user.id === message.author.id
    );
  };

  function sendGBA() {
    setTimeout(function () {
      /* pngjs: https://github.com/lukeapage/pngjs */
      var png = gba.screenshot();
      png.pack().pipe(fs.createWriteStream('gba' + idx + '.png'));
      message.channel
        .send(
          `Held down: ${AToggle ? 'A ' : ''}${BToggle ? 'B ' : ''}${
            UPToggle ? 'UP ' : ''
          }${DOWNToggle ? 'DOWN ' : ''}${LEFTToggle ? 'LEFT ' : ''}${
            RIGHTToggle ? 'RIGHT ' : ''
          }`,
          {
            files: ['gba0.png'],
          }
        )
        .then((message) => {
          try {
            message.react('🅰');
            message.react('⬆');
            message.react('⬇');
            message.react('⬅');
            message.react('➡');
            message.react('🅱');
          } catch (err) {
            console.log('pressed early');
          }

          message
            .awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            .then((collected) => {
              const reaction = collected.first();

              if (reaction.emoji.name === '🅰') {
                message.delete();
                keypad.press(keypad.A);
                sendGBA();
              } else if (reaction.emoji.name === '🅱') {
                message.delete();
                keypad.press(keypad.B);
                sendGBA();
              } else if (reaction.emoji.name === '⬆') {
                message.delete();
                keypad.press(keypad.UP);
                sendGBA();
              } else if (reaction.emoji.name === '⬇') {
                message.delete();
                keypad.press(keypad.DOWN);
                sendGBA();
              } else if (reaction.emoji.name === '⬅') {
                message.delete();
                keypad.press(keypad.LEFT);
                sendGBA();
              } else if (reaction.emoji.name === '➡') {
                message.delete();
                keypad.press(keypad.RIGHT);
                sendGBA();
              }
            });
        });
    }, 1000);
  }

  function sendGBASingle() {
    setTimeout(function () {
      /* pngjs: https://github.com/lukeapage/pngjs */
      var png = gba.screenshot();
      png.pack().pipe(fs.createWriteStream('gba' + idx + '.png'));
      message.channel.send(
        `Held down: ${AToggle ? 'A ' : ''}${BToggle ? 'B ' : ''}${
          UPToggle ? 'UP ' : ''
        }${DOWNToggle ? 'DOWN ' : ''}${LEFTToggle ? 'LEFT ' : ''}${
          RIGHTToggle ? 'RIGHT ' : ''
        }`,
        {
          files: ['gba0.png'],
        }
      );
    }, 1000);
  }

  if (message.content === '.show') {
    sendGBA();
  }

  if (message.content.includes('.')) {
    /////////////////////////////////GBA STUFF///////////////////////////
    if (message.content === '.a') {
      keypad.press(keypad.A);
      sendGBASingle();
    } else if (message.content === '.b') {
      keypad.press(keypad.B);
      sendGBASingle();
    } else if (message.content === '.b') {
      keypad.press(keypad.B);
      sendGBASingle();
    } else if (message.content === '.select') {
      keypad.press(keypad.SELECT);
      sendGBASingle();
    } else if (message.content === '.start') {
      keypad.press(keypad.START);
      sendGBASingle();
    } else if (message.content === '.r') {
      keypad.press(keypad.RIGHT);
      sendGBASingle();
    } else if (message.content === '.l') {
      keypad.press(keypad.LEFT);
      sendGBASingle();
    } else if (message.content === '.u') {
      keypad.press(keypad.UP);
      sendGBASingle();
    } else if (message.content === '.d') {
      keypad.press(keypad.DOWN);
      sendGBASingle();
    } else if (message.content === '.sl') {
      keypad.press(keypad.L);
      sendGBASingle();
    } else if (message.content === '.ha') {
      /////////////TOGGLES
      if (AToggle) {
        keypad.keyup(keypad.A);
        AToggle = false;
      } else {
        keypad.keydown(keypad.A);
        AToggle = true;
      }
      sendGBASingle();
    } else if (message.content === '.hb') {
      if (BToggle) {
        keypad.keyup(keypad.B);
        BToggle = false;
      } else {
        keypad.keydown(keypad.B);
        BToggle = true;
      }
      sendGBASingle();
    } else if (message.content === '.hl') {
      if (LEFTToggle) {
        keypad.keyup(keypad.LEFT);
        LEFTToggle = false;
      } else {
        keypad.keydown(keypad.LEFT);
        LEFTToggle = true;
      }
      sendGBASingle();
    } else if (message.content === '.hr') {
      if (RIGHTToggle) {
        keypad.keyup(keypad.RIGHT);
        RIGHTToggle = false;
      } else {
        keypad.keydown(keypad.RIGHT);
        RIGHTToggle = true;
      }
      sendGBASingle();
    } else if (message.content === '.hu') {
      if (UPToggle) {
        keypad.keyup(keypad.UP);
        UPToggle = false;
      } else {
        keypad.keydown(keypad.UP);
        UPToggle = true;
      }
      sendGBASingle();
    } else if (message.content === '.hd') {
      if (DOWNToggle) {
        keypad.keyup(keypad.DOWN);
        DOWNToggle = false;
      } else {
        keypad.keydown(keypad.DOWN);
        DOWNToggle = true;
      }
      sendGBASingle();
    } else if (message.content === '.save') {
      let save = gba.mmu.save;

      var data = [];
      var b;
      var wordstring = [];
      var triplet;
      for (var i = 0; i < save.view.byteLength; ++i) {
        b = save.view.getUint8(i, true);
        wordstring.push(String.fromCharCode(b));
        while (wordstring.length >= 3) {
          triplet = wordstring.splice(0, 3);
          data.push(btoa(triplet.join('')));
        }
      }
      if (wordstring.length) {
        data.push(btoa(wordstring.join('')));
      }
      save = data.join('');

      // fs.writeFileSync('src/save.txt', save);

      // GbaSave.create({ data: save });

      await GbaSave.updateOne({}, { $set: { data: save } });

      message.reply(
        'To save all progress correctly, make sure to save ingame first, then use .save'
      );

      console.log('Data Saved to MongoDB');
    }

    if (message.content === '.help') {
      message.reply(
        `1. .addSimpCommand: adds a simple . command | SYNTAX: .addSimpCommand <command name> <command output>
         2. .allSimpCommands: shows all simple . commands added | Syntax: .allSimpCommands 
         3. .contribute: Github repo, please help make gooder | Syntax: .contribute
         4. .simp: You a simp | Syntax: .simp
        `
      );
      return;
    }

    if (message.content === '.aiClear') {
      contex = [];
      message.channel.send('Cleared ai chat context');
      return;
    }

    if (message.content.includes('.ai')) {
      cleverbot(message.content.slice(4), contex).then((response) => {
        contex = contex.concat([message.content.slice(4), response]);
        message.reply(response);

        if (contex.length >= 20) {
          contex = contex.slice(-20);
        }
      });
    }

    if (message.content === '.contribute') {
      message.reply('https://github.com/eddie246/Simple-Discord-Bot');
    }

    if (
      message.content.slice(0, 15) === '.addSimpCommand'
      // && message.member.roles.cache.find((r) => r.name.toLowerCase() === 'admin')
    ) {
      if (message.content.split(' ').length < 2) {
        message.reply(
          'Wrong Syntax, please try: .addSimpCommand <command name> <command output>'
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
        let newCommand = message.content.split(' ')[1];
        newCommand[0] === '.' ? newCommand : (newCommand = '.' + newCommand);
        const newCommandOutput = message.content.split(' ').slice(2).join(' ');

        docParsed[newCommand] = newCommandOutput;
        message.reply('new command added');

        await Command.updateOne(
          {},
          { $set: { cmds: JSON.stringify(docParsed) } }
        );
        return;
      }
    }

    if (message.content.includes('.msgArchive')) {
      if (message.content.split(' ').length !== 3) {
        message.reply(
          'Wrong Syntax, please try: .msgArchive <@user> <message index>'
        );
        return;
      }
      const msgArchiveRequestOriginal = message.content.split(' ')[1];
      const msgArchiveRequest = msgArchiveRequestOriginal.replace('!', '');
      const msgArchiveNumber = message.content.split(' ')[2];

      const requestUserMessages =
        messageArchive[msgArchiveRequest] || undefined;

      if (requestUserMessages) {
        message.channel.send(
          `${requestUserMessages[msgArchiveNumber]}  - ${msgArchiveRequestOriginal}`
        );
        return;
      } else {
        message.channel.send('No message found');
      }
    }

    if (message.content.includes('.allSimpCommands')) {
      let replyStr = '';
      for (const command in docParsed) {
        replyStr += ` ${command}`;
      }
      message.reply(replyStr);
      return;
    }

    if (message.content === '.wednesday') {
      let dayOfWeek = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
      });
      dayOfWeek = new Date(dayOfWeek);
      console.log(dayOfWeek.getDay());

      if (dayOfWeek.getDay() === 3) {
        message.channel.send(
          'https://i.kym-cdn.com/entries/icons/original/000/020/016/wednesdaymydudeswide.jpg'
        );
      } else {
        message.channel.send('https://i.redd.it/eqtja26y4yz61.png');
      }
      return;
    }

    if (docParsed[message.content]) {
      message.channel.send(docParsed[message.content]);
      return;
    }

    ////////GBA STUFF////////////
  } else {
    if (message.mentions.has(client.user.id)) {
      if (
        message.content.includes('@here') ||
        message.content.includes('@everyone')
      )
        return;

      if (message.content.toLocaleLowerCase() === 'fuck you') {
        message.reply(
          'i cri now u hapy? y yu alwys buly im just a robot i do wht i told y u mak me sad'
        );
      } else if (message.content.toLocaleLowerCase() === 'i love you') {
        message.reply('I only think of you as a friend...');
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

      if (msgInRowCount === 3 && lastMessage === 'pp') {
        message.channel.send('P FUCKING P WOOOOOOOOOOO!!!');
        msgInRowCount = 0;
      } else if (msgInRowCount === 3) {
        message.channel.send(lastMessage.toLocaleUpperCase());
        msgInRowCount = 0;
      }
    } else {
      lastMessage = message.content;
      lastUser = message.author;
    }

    if (message.content.toLocaleLowerCase().includes('dolphin')) {
      message.channel.send(':peanuts:');
    }

    if (message.content.includes('duck')) {
      if (Math.random() * 3 > 2) {
        message.channel.send('goose');
      }
    }

    if (
      message.content.toLowerCase().includes('whos joe') ||
      message.content.toLowerCase().includes('who is joe')
    ) {
      message.channel.send('JOE MAMA');
    }

    if (
      message.content.toLocaleLowerCase().includes('bukkake') ||
      message.content.toLocaleLowerCase().includes('bukake')
    ) {
      message.channel.send(':eggplant: :sweat_drops: :dog:');
    }

    if (message.content.toLocaleLowerCase().includes('struggle')) {
      message.reply('striggle*');
    } else if (message.content.toLocaleLowerCase().includes('struggling')) {
      message.reply('striggling*');
    }

    if (message.content.includes(' 69 ') || message.content === '69') {
      message.channel.send('nice');
    }

    if (message.content === '420') {
      message.channel.send('stay in drugs, dont do school');
    }

    if (message.content.toLowerCase().includes('ink_farts')) {
      message.channel.send(':pen_fountain: :dash:');
    }

    if (message.content.includes('kinky')) {
      message.channel.send('( ͡° ͜ʖ ͡°)');
    }
  }
});

client.login(process.env.TOKEN);
