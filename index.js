require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

const commands = {
  '.simp':
    'https://i1.sndcdn.com/artworks-i0tlutgH246RaMuh-9ip1iA-t500x500.jpg',
  '.inviteLink':
    'https://discord.com/oauth2/authorize?client_id=865441338623131668&permissions=519232&scope=bot',
};

const messageArchive = {};

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

client.on('message', (message) => {
  if (message.content[0] === '.') {
    if (message.content === '.help') {
      message.reply(
        `1. .addSimpCommand: adds a simple . command | SYNTAX: .addSimpCommand <command name> <command output>
         2. .allSimpCommands: shows all simple . commands added | Syntax: .allSimpCommands 
         3. .contribute: Github repo, please help make gooder | Syntax: .contribute
         4. .simp: You a simp | Syntax: .simp
        `
      );
    }

    if (message.content === '.contribute') {
      message.reply('https://github.com/eddie246/Simple-Discord-Bot');
    }

    if (
      message.content.includes('.addSimpCommand') &&
      message.member.roles.cache.find((r) => r.name.toLowerCase() === 'admin')
    ) {
      if (message.content.split(' ').length < 2) {
        message.reply(
          'Wrong Syntax, please try: .addSimpCommand <command name> <command output>'
        );

        return;
      } else {
        let newCommand = message.content.split(' ')[1];
        newCommand[0] === '.' ? newCommand : (newCommand = '.' + newCommand);
        const newCommandOutput = message.content.split(' ').slice(2).join(' ');

        commands[newCommand] = newCommandOutput;
        message.reply('new message added');
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
      message.reply(JSON.stringify(commands, null, 2));
      return;
    }

    if (commands[message.content]) {
      message.channel.send(commands[message.content]);
      return;
    }
  } else {
    let lastMessage = '';
    let msgInRowCount = 0;

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

    if (lastMessage === message.content) {
      msgInRowCount++;

      if (msgInRowCount === 3 && lastMessage === 'pp') {
        message.channel.send('P FUCKING P WOOOOOOOOOOO!!!');
      } else if (msgInRowCount === 3) {
        message.channel.send(lastMessage.toLocaleUpperCase());
      }
    } else {
      lastMessage = message.content;
    }

    if (message.content.includes('dolphin')) {
      message.channel.send(':peanuts:');
      return;
    }
  }
});

client.login(process.env.TOKEN);
