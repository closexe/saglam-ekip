const Discord = require('discord.js')
const db = require("quick.db")
const ayarlar = require("../ayarlar.json")
module.exports = async message => {
  let client = message.client;
  if (message.author.bot) return;
  if(!message.guild) return;
if(message.content == ayarlar.prefix) return;


  let prefix = ayarlar.prefix;
  
  if (!message.content.startsWith(prefix)) return;
  let command = message.content.split(' ')[0].slice(prefix.length);
  let params = message.content.split(' ').slice(1);
  let perms = client.elevation(message);
  let cmd;
  
  if (client.commands.has(command)) {
    cmd = client.commands.get(command);
  } else if (client.aliases.has(command)) {
    cmd = client.commands.get(client.aliases.get(command));
  } else {
    message.channel.send(message.author, new Discord.MessageEmbed().setColor("ff0000").setAuthor('Sanırım, yanlış bir şey yazdın.').setDescription(`**${message.author.username}** Komutlarımda  \`${prefix}${command}\` adında bir komut bulamadım.`).setFooter(`Tüm komutları ayrıntılı bir şekilde görüntülemek için ${prefix}yardım`)).then(m => m.delete({timeout: 10000}))
  }
    const embed28 = new Discord.MessageEmbed()
    embed28.setTitle(':flag_tr: Karalistede olduğun için komutları kullanamıyorsun \n:flag_eu: You are blacklisted from using this bot')
    embed28.setColor('BLUE');
    if (db.fetch(`cokaradalistere_${message.author.id}`)) return message.channel.send(embed28)
try {
cmd.run(client, message, params, perms)
} catch(e) {
client.channels.cache.get("960531544026529852").send(e.toString())
} 


};