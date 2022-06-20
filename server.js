const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const chalk = require('chalk');
const { Client, Util } = require('discord.js');
const moment = require("moment")
const fs = require('fs');
const db = require('quick.db');
const http = require('http');
const express = require('express');
require('./util/eventLoader.js')(client);
var prefix = ayarlar.prefix;

const log = message => {
    console.log(`${message}`);
};



client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
const jsfiles = files.filter(f => f.split(".").pop() === "js");
if (jsfiles.length <= 0) {
return console.log("Herhangi bir komut bulunamadı!");
}
jsfiles.forEach(file => {
console.log(`Yüklenen Komut: ${file}`);
const command = require(`./komutlar/${file}`);
client.commands.set(command.config.name, command);
command.config.aliases.forEach(alias => {
client.aliases.set(alias, command.config.name);
});
});
});



client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./komutlar/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};
//////////////////////////////////////////////////////

client.on("guildMemberAdd", async member => {
  let kanal1 = await db.fetch(`otorolkanal_${member.guild.id}`);
  let rol1 = await db.fetch(`otorolrol_${member.guild.id}`);

  let kanal = member.guild.channels.cache.get(kanal1);
  let rol = member.guild.roles.cache.get(rol1);

  if (!kanal) return;
  if (!rol) return;

  const Rowie3 = new Discord.MessageEmbed()

    .setColor("BLACK")
    .setDescription(`Sunucuya Katılan **${member}** İsimli Kullanıcıya Başarıyla \`${rol.name}\` Rolü Verildi.`);

  kanal.send(Rowie3);
  member.roles.add(rol);
}); 
/////////////////////////
const backup = () => {
    fs.copyFile('./json.sqlite', `./backups/yedekleme • ${moment().format('D-M-YYYY • H.mm.ss')} • laura.sqlite`, err => {
        if (err) return console.log(err);
        console.log('Veritabanını yedekledim.');
    });
};

client.on('ready', () => {
  try {
    setInterval(() => backup(), 1000 * 60 * 60 * 24); // Günde bir kere yedekler.
  } catch(error) {
    console.log(error)
  }
  });

/////////////////snipe//////////////////////

client.on('messageDelete', async message => {// can#0002
  if(message.author.bot || !message.content) return;
  require('quick.db').push(message.guild.id, {
    author: message.author,
    authorTAG: message.author.tag,
    authorID: message.author.id,
    authorUSERNAME: message.author.username,
    authorDISCRIMINATOR: message.author.discriminator,
    messageID: message.id,
    messageCHANNEL: message.channel,
    messageCHANNELID: message.channel.id,
    messageCONTENT: message.content,
    messageCREATEDAT: message.createdAt
  });
});
///////////////////////////////////////////

client.on("guildBanRemove", (guild, user) => {
  const database = require('quick.db')
  const bans = database.get(`acilmayanBan.laura.${guild.id}`) || [];
  if (bans.some(ban => ban.user.id == user.id)) return guild.members.ban(user, { reason: 'Developed By Aristokrat' });
});

//////////////////antispam/////////////

//BAN KORUMA --------------------------------

client.on("guildBanAdd", async (guild, user) => {
  const entry = await guild
    .fetchAuditLogs({ type: "MEMBER_BAN_ADD" })
    .then(audit => audit.entries.first());
  let banlimit = await db.fetch(`banlimit_${guild.id}`);
  let kullanıcıban = await db.fetch(
    `banlimitkullanici_${guild.id}_${entry.executor.id}`
  );

  if (banlimit) {
    if (entry.executor.id !== guild.owner.user.id) {
      if (entry.executor.bot) return;
      await db.add(`banlimitkullanici_${guild.id}_${entry.executor.id}`, 1);

      try {
        guild
          .member(entry.executor)
          .roles.filter(a => a.hasPermission("BAN_MEMBERS"))
          .forEach(x => guild.member(entry.executor).removeRole(x.id));
        guild.owner.user.send(`

**Sunucundan Bir Yetkili Ban Koruma Limitine Ulaştı ve Ban Yetkisi Olan Tüm Rolleri Alındı!**\n**Bilgileri:**
\n**Kullanıcı:**\  ${entry.executor} | ${entry.executor.id} 
\n\`Katılım Tarihi:\` 
\n•**Discord:** ${moment(entry.executor.createdAt).format(
          "DD/MM/YYYY | HH:mm:ss"
        )} 
•**Sunucu:** ${moment(guild.member(entry.executor).joinedAt).format(
          "DD/MM/YYYY | HH:mm:ss"
        )}`);
      } catch (err) {}
      db.delete(`banlimitkullanici_${guild.id}_${entry.executor.id}`);
    }
  }
}); 

//////////////////////////////////////////

const userMap = new Map();
client.on("message", async message => {
   if(!message.guild) return;
const TheSid = db.get(`antispam_${message.guild.id}`)
    if(message.author.bot) return;
if(TheSid === "acik") { 

    if(message.member.permissions.has("MANAGE_MESSAGES") || message.member.permissions.has("ADMINISTRATOR")) return;
    if(userMap.has(message.author.id)) {
    const userdata = userMap.get(message.author.id);
    let msgcount = userdata.msgcount;
    ++msgcount;
    if(parseInt(msgcount) === 5) {
      message.channel.bulkDelete('5')
    message.channel.send(`<@${message.author.id}> Bu sunucuda Spam yapmak yasak!`)
    
    } else {
    
    userdata.msgcount = msgcount;
    userMap.set(message.author.id, userdata)
    
         }
         
        }else {
    userMap.set(message.author.id, {
    msgcount: 1,
    lastMessage: message,
    timer: null
    
     });
    setTimeout(() => {
      userMap.delete(message.author.id);
    }, 5000);
    }
  

} else return;

});

//////////////////////////////////////////

client.on("guildBanRemove", (guild, user) => {
    const database = require('quick.db')
    const bans = database.get(`acilmayanBan.laura.${guild.id}`) || [];
    if (bans.some(ban => ban.user.id == user.id)) return guild.members.ban(user, { reason: 'Developed By Aristokrat' });
});

/////////////////////////////////////////

client.on('guildCreate', async (guild) => {
 let ownerid = guild.ownerID
 let owner = client.users.cache.get(ownerid).tag
    client.channels.cache.get("918599787970965504").send(new Discord.MessageEmbed()
        .setColor("GREEN").setTitle("Kral beni ekledi :)")
        .setDescription(`**
Kurucu: ${owner}
\nSunucu Adı: ${guild.name}
\nKullanıcı Sayısı: ${guild.memberCount}
**`)
        .setFooter(guild.id)
        .setTimestamp())
});

client.on('guildDelete', async (guild) => {
 let ownerid = guild.ownerID
 let owner = client.users.cache.get(ownerid).tag
    client.channels.cache.get("918599787970965504").send(new Discord.MessageEmbed()
        .setColor("RED").setTitle("Şerefsizler beni attı :/")
        .setDescription(`**
Kurucu: ${owner}
\nSunucu Adı: ${guild.name}
\nKullanıcı Sayısı: ${guild.memberCount}
**`)
        .setFooter(guild.id)
        .setTimestamp())
});

/////////////////////////////////////////
client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.elevation = message => {
    if (!message.guild) {
        return;
    }
    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (message.author.id === ayarlar.sahip) permlvl = 4;
    return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on('warn', e => {
    console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
    console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});

client.login(ayarlar.token);

//---------------------------------KOMUTLAR---------------------------------\\
//---------------------- SA AS SİSTEMİ -----------------------------\\

client.on("message", async msg => {


  const i = await db.fetch(`ssaass_${msg.guild.id}`);
    if (i == 'acik') {
      if (msg.content.toLowerCase() == 'sa' || msg.content.toLowerCase() == 's.a' || msg.content.toLowerCase() == 'selamun aleyküm' || msg.content.toLowerCase() == 'sea' || msg.content.toLowerCase() == 's.a.' || msg.content.toLowerCase() == 'selam' || msg.content.toLowerCase() == 'slm') {
          try {

                  return msg.reply(':dizzy: Aleyküm Selam, Hoşgeldin. ')
          } catch(err) {
            console.log(err);
          }
      }
    }
    else if (i == 'kapali') {
    
    }
    if (!i) return;

    });

//afk//
client.on('message', async message => {// chimp'∞B#1008
if(message.channel.type === 'dm') return;
if(await db.fetch(`afk.${message.author.id}.${message.guild.id}`) == undefined) return;
const ms = require('ms')

if(message.content.length > 2) {
const sebepp = await db.fetch(`sebep.${message.author.id}.${message.guild.id}`)
const sp = await db.fetch(`giriş.${message.author.id}.${message.guild.id}`)
const asd = await db.fetch(`display.${message.author.id}.${message.guild.id}`)

  let atılmaay = moment(Date.now()+10800000).format("MM")
  let atılmagün = moment(Date.now()+10800000).format("DD")
  let atılmasaat = moment(Date.now()+10800000).format("HH:mm:ss")
  let atılma = `\`${atılmagün} ${atılmaay.replace(/01/, 'Ocak').replace(/02/, 'Şubat').replace(/03/, 'Mart').replace(/04/, 'Nisan').replace(/05/, 'Mayıs').replace(/06/, 'Haziran').replace(/07/, 'Temmuz').replace(/08/, 'Ağustos').replace(/09/, 'Eylül').replace(/10/, 'Ekim').replace(/11/, 'Kasım').replace(/12/, 'Aralık')} ${atılmasaat}\``


message.guild.members.cache.get(message.author.id).setNickname(asd)
message.channel.send(new Discord.MessageEmbed().setTitle(`${message.author.username}, hoşgeldin!`).setColor('GREEN').setDescription(`Afk modundan başarıyla çıkış yaptın.`)
.addField('Giriş sebebin:', sebepp) 
.addField('AFK olma zamanın:', sp)
.addField('Çıkış zamanın:', atılma))
db.delete(`afk.${message.author.id}.${message.guild.id}`)
db.delete(`sebep.${message.author.id}.${message.guild.id}`)
db.delete(`giriş.${message.author.id}.${message.guild.id}`)
db.delete(`display.${message.author.id}.${message.guild.id}`)
}

})// codare ♥
//----------------- REKLAM ENGEL -----------------\\


client.on("message", async message => {
  
  const lus = await db.fetch(`reklamengel_${message.guild.id}`)
  if (lus) {
    const reklamengel = ["discord.app", "discord.gg", ".party", ".com", ".az", ".net", ".io", ".gg", ".me", "https", "http", ".com.tr", ".org", ".tr", ".gl", "glitch.me/", ".rf.gd", ".biz", "www.", "www", ".gg", ".tk", ".tr.ht", ".ml", ".ga", ".cf", ".cq"];
    if (reklamengel.some(word => message.content.toLowerCase().includes(word))) {
      try {
        if (!message.member.permissions.has('BAN_MEMBERS')) {
          message.delete();
          
          return message.channel.send(` Hey ${message.author} Dur! Bu Sunucuda Reklamı Engelliyorum!`).then(matador => matador.delete({ timeout: 10000}));
          
        }
      } catch(err) {
        console.log(err);
    }
  }
}
if (!lus) return;
});
client.on("messageUpdate", async (newMessage, oldMessage) => {
  
  const lus = await db.fetch(`reklamengel_${newMessage.guild.id}`)
  if (lus) {
    const reklamengel = ["discord.app", "discord.gg", ".party", ".com", ".az", ".net", ".io", ".gg", ".me", "https", "http", ".com.tr", ".org", ".tr", ".gl", "glitch.me/", ".rf.gd", ".biz", "www.", "www", ".gg", ".tk", ".tr.ht", ".ml", ".ga", ".cf", ".cq"];
    if (reklamengel.some(word => newMessage.content.toLowerCase().includes(word))) {
      try {
        if (!newMessage.member.permissions.has('BAN_MEMBERS')) {
         newMessage.delete();
          
          return newMessage.channel.send(` Hey ${newMessage.author} Dur! Bu Sunucuda Reklamı Engelliyorum!`).then(matador => matador.delete({ timeout: 10000}));
          
        }
      } catch(err) {
        console.log(err);
    }
  }
}
if (!lus) return;
});

//----------------------------------- REKLAM KİCK -----------------------------------\\

client.on("message", async message => {
  let uyarisayisi = await db.fetch(`reklamkick_${message.author.id}`);
  let reklamkick = await db.fetch(`reklamkick_${message.guild.id}`);
  let salvo = message.member;
  if (reklamkick == "kapali") return;
  if (reklamkick == "acik") {
    const reklam = [
      "discord.app",
      "discord.gg",
      "invite",
      "discordapp",
      "discordgg",
      ".com",
      ".net",
      ".xyz",
      ".tk",
      ".pw",
      ".io",
      ".me",
      ".gg",
      "www.",
      "https",
      "http",
      ".gl",
      ".org",
      ".com.tr",
      ".biz",
      ".party",
      ".rf.gd",
      ".az"
    ];
    if (reklam.some(word => message.content.toLowerCase().includes(word))) {
      if (!message.member.hasPermission("ADMINISTRATOR")) {
        message.delete();
        db.add(`reklamkick_${message.author.id}`, 1); 
        if (uyarisayisi === null) {
 
             message.channel.send (`<@${message.author.id}> Reklam Koruma Sistemine Yaklandın! **İlk Uyarın** Devam Edersen Atılacaksın! (1/3)`)          
        }
        if (uyarisayisi === 1) {
            message.channel.send (`<@${message.author.id}> Reklam Koruma Sistemine Yaklandın! **2. Uyarın** Devam Edersen Atılacaksın! (2/3)`)
        }
        if (uyarisayisi === 2) {
          message.delete();
          await salvo.kick({
            reason: `Reklam Kick Sistemi`
          });
            message.channel.send (`<@${message.author.id}> **3. Reklam Uyarısı** Aldığı Tespit Edildi ve Sunucudan Atıldı! (3/3)`
            )
        }
        if (uyarisayisi === 3) {
          message.delete();
       salvo.members.ban({
            reason: `Reklam Kick Sistemi`
          });
          db.delete(`reklamkick_${message.author.id}`);
            message.channel.send (`<@${message.author.id}> Atıldıktan Sonra Tekrar Reklam Yaptığı için Banlandı!`)
        }
      }
    }
  }
});

//---------------------------------MOD LOG---------------------------------\\

client.on('roleDelete', async role => {    
const entry = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first());

     let modlogs = db.get(`log_${role.guild.id}`)
    const modlogkanal = role.guild.channels.cache.find(kanal => kanal.id === modlogs);    
if (!modlogkanal) return;
  const embed = new Discord.MessageEmbed()
  .setColor("BLUE")
.setTitle("ROL SİLİNDİ")                    
.setDescription(` **${role.name}** Adlı Rol Silindi!\n Rolü Silen Kişi: <@${entry.executor.id}> \n Role ID: **${role.id}**\n Rol Renk Kodu: **${role.hexColor}**`)
.setTimestamp()
.setFooter(client.user.username, client.user.avatarURL())
  modlogkanal.send(embed);
})

client.on('roleCreate', async role => {    
const entry = await role.guild.fetchAuditLogs({type: 'ROLE_CREATE'}).then(audit => audit.entries.first());

     let modlogs = db.get(`log_${role.guild.id}`)
    const modlogkanal = role.guild.channels.cache.find(kanal => kanal.id === modlogs);    
if (!modlogkanal) return;
  const embed = new Discord.MessageEmbed()
  .setColor("BLUE")
.setTitle("ROL OLUŞTURULDU")                    
.setDescription(`**${role.name}** Adlı Rol Oluşturuldu!\nRolü Oluşturan Kişi: <@${entry.executor.id}> \nRole ID: **${role.id}**\nRol Renk Kodu: **${role.hexColor}**`)
.setTimestamp()
.setFooter(client.user.username, client.user.avatarURL())
  modlogkanal.send(embed);
})
//emoji baş
client.on('emojiCreate', async emoji => {
 const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_CREATE'}).then(audit => audit.entries.first());

  const c = emoji.guild.channels.cache.get(db.fetch(`log_${emoji.guild.id}`));
  if (!c) return;

    let embed = new Discord.MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("EMOJİ EKLENDİ")
                    .setDescription(`Sunucuya bir emoji eklendi!\n\n **Emoji:** <:${emoji.name}:${emoji.id}>\n\n **Emojiyi Oluşturan Kişi:** <@${entry.executor.id}>\n\n **Emoji İsmi:** ${emoji.name}\n\n**Emoji ID:** ${emoji.id}`)
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL())
    c.send(embed)
    });


client.on('emojiDelete', async emoji => {
  const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_DELETE'}).then(audit => audit.entries.first());

  const c = emoji.guild.channels.cache.get(db.fetch(`log_${emoji.guild.id}`));
  if (!c) return;

    let embed = new Discord.MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("EMOJİ SİLİNDİ")
                    .setDescription(`Sunucudan bir emoji silindi!\n\n **Emoji İsmi:** ${emoji.name}\n\n **Emojiyi Silen Kişi:** <@${entry.executor.id}> \n\n**Emoji ID:** ${emoji.id}`)
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL())
    c.send(embed)
    });
client.on('emojiUpdate', async(oldEmoji, newEmoji) => {
  const entry = await oldEmoji.guild.fetchAuditLogs({type: 'EMOJI_UPDATE'}).then(audit => audit.entries.first());

  const c = newEmoji.guild.channels.cache.get(db.fetch(`log_${newEmoji.guild.id}`));
  if (!c) return;

    let embed = new Discord.MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("EMOJİ GÜNCELLENDİ")
                    .setDescription(`Bir emoji güncellendi!\n\n **Emoji:** <:${newEmoji.name}:${newEmoji.id}>\n\n **Emojiyi Güncelleyen Kişi:** <@${entry.executor.id}> \n\n **Eski Emoji İsmi:** ${oldEmoji.name}\n\n **Yeni Emoji İsmi:** ${newEmoji.name}\n\n**Emoji ID:** ${newEmoji.id}`)
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL())

    c.send(embed)
    });
   //emoji son

client.on('messageDelete', async message   => { 
      let modlogs = db.get(`log_${message.guild.id}`)
    const modlogkanal = message.guild.channels.cache.find(kanal => kanal.id === modlogs);    
if (!modlogkanal) return;
  const embed = new Discord.MessageEmbed()
  .setColor("BLUE")
  .setTitle("MESAJ SİLİNDİ")
.setDescription(` **<@!${message.author.id}>**  adlı kullanıcı tarafından **<#${message.channel.id}>** kanalına gönderilen mesaj silindi! \n\n Silinen Mesaj: **${message.content}**`)
  .setTimestamp()
    .setFooter(client.user.username , client.user.avatarURL())
  modlogkanal.send(embed);
  })

client.on('guildBanAdd', async (guild, user) => {    
    const channel = guild.channels.cache.get(db.fetch(`log_${guild.id}`));
  if (!channel) return;
  
  const entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first())

    let embed = new Discord.MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("BİR KULLANICI BANLANDI")
                    .setDescription(` **Banlanan:** ${user.username}\n\n**Banlanan ID:** ${user.id}\n\n **Sebep:** ${entry.reason || 'Belirtmedi'}\n\n **Banlayan:** <@${entry.executor.id}>`)
                    .setTimestamp()
                    .setFooter(client.user.username , client.user.avatarURL())

    channel.send(embed)
});

client.on('guildBanRemove', async (guild, user) => {    
    const channel = guild.channels.cache.get(db.fetch(`log_${guild.id}`));
  if (!channel) return;
  
  const entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first())

    let embed = new Discord.MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("BİR KULLANICI BANI AÇILDI")
                    .setDescription(` **Banı Açılan:** ${user.username}\n\n**Banı Açılan ID:** ${user.id}\n\n **Banı Kaldıran Yetkili:** <@${entry.executor.id}>`)
                    .setTimestamp()
                    .setFooter(client.user.username , client.user.avatarURL())

    channel.send(embed)
});

client.on('channelCreate', async channel  => {
    const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first());

  let modlogs = db.get(`log_${channel.guild.id}`)
    const modlogkanal = channel.guild.channels.cache.find(kanal => kanal.id === modlogs);    
if (!modlogkanal) return;
    if (channel.type === "text") {
                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                .setTitle("METİN KANALI OLUŞTURULDU")
                .setDescription(`**${channel.name}** Adlı Metin Kanalı Oluşturuldu!\nMetin Kanalını Oluşturan Kişi: <@${entry.executor.id}>\nKanal ID: **${channel.id}**`)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL())
                modlogkanal.send({embed});
            };
            if (channel.type === "voice") {
                let embed = new Discord.MessageEmbed()
                .setColor('BLUE')
.setTitle("SES KANALI OLUŞTURULDU")
                .setDescription(`**${channel.name}** Adlı Ses Kanalı Oluşturuldu!\nSes Kanalını Oluşturan Kişi: <@${entry.executor.id}> \nKanal ID: **${channel.id}**`)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL())

                modlogkanal.send({embed});
            }
        
    })
client.on('channelDelete', async channel  => {
      const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first());
   
  let modlogs = db.get(`log_${channel.guild.id}`)
    const modlogkanal = channel.guild.channels.cache.find(kanal => kanal.id === modlogs);    
if (!modlogkanal) return;
    if (channel.type === "text") {
                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                .setDescription(` **${channel.name}** Adlı Metin Kanalı Silindi!\n Metin Kanalını Silen Kişi: <@${entry.executor.id}> \n Kanal ID: **${channel.id}**`)
                .setTitle("METİN KANALI SİLİNDİ")
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL())
                modlogkanal.send({embed});
            };
            if (channel.type === "voice") {
                let embed = new Discord.MessageEmbed()
                .setColor('BLUE')
.setTitle("SES KANALI SİLİNDİ")
                .setDescription(` **${channel.name}** Adlı Ses Kanalı Silindi!\n Ses Kanalını Silen Kişi: <@${entry.executor.id}> \n Kanal ID: **${channel.id}**`)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL())
                modlogkanal.send({embed});
            }
    })



client.on("messageUpdate", async (oldMsg, newMsg) => {
  if (oldMsg.author.bot) return;
  var user = oldMsg.author;
  if (db.has(`log_${oldMsg.guild.id}`) === false) return;
  var kanal = oldMsg.guild.channels.cache.get(db.fetch(`log_${oldMsg.guild.id}`).replace("<#", "").replace(">", ""))
  if (!kanal) return;
  const embed = new Discord.MessageEmbed()
  .setColor("BLUE")
  .setTitle("MESAJ DEĞİŞTİRİLDİ")
  .setDescription(`<@!${oldMsg.author.id}>  adlı kullanıcı tarafından <#${oldMsg.channel.id}> kanalına gönderilen mesaj değiştirildi!\n\n**Kullanıcı:** <@!${oldMsg.author.id}>\n\n **Eski Mesaj:** ${oldMsg.content}\n\n**Yeni Mesaj:** ${newMsg.content}`)
  .setTimestamp()
  .setFooter(client.user.username, client.user.avatarURL())
  .setThumbnail(oldMsg.author.avatarURL)
  kanal.send(embed);  
        
});

//Botu seste tutar
client.on('ready', () => {
  client.channels.cache.get('985611120834400377').join();
})

//Botun sahibi geldiğinde mesaj atar
client.on("message", async message => { //cafex yazılım https://discord.gg/ySTtspZaP2
  //cafex yazılım https://discord.gg/ySTtspZaP2
    const ms = require('parse-ms')//cafex yazılım https://discord.gg/ySTtspZaP2
    
    let cooldown = 1800000 /// Cooldown MS olarak kendinize göre ayarlayabilirsiniz. //cafex yazılım https://discord.gg/ySTtspZaP2
    
    let sure = await db.fetch(`sahipsure_${message.author.id}`);//cafex yazılım https://discord.gg/ySTtspZaP2
    
    let kisi = "931971062080626789" // ID'nizi 2 Tırnak Arasına Yazınız. //cafex yazılım https://discord.gg/ySTtspZaP2
        //cafex yazılım https://discord.gg/ySTtspZaP2
        if(message.author.id === kisi) {   //cafex yazılım https://discord.gg/ySTtspZaP2
        if (sure !== null && cooldown - (Date.now() - sure) > 0) {//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2
            let time = ms(cooldown - (Date.now() - sure));//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2
        } else {//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2
      if (message.content.length > 1) {//cafex yazılım https://discord.gg/ySTtspZaP2
    
    db.set(`sahipsure_${message.author.id}`, Date.now());//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2
      const embed = new Discord.MessageEmbed()//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2
      .setDescription(`Developed by mertxd#0001`)//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2
      .setColor(15844367)//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2
       message.channel.send(embed)//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2
      }//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2
    //cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2
    };//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2//cafex yazılım https://discord.gg/ySTtspZaP2
    }
              
    
              if (message.author.id !== kisi) return;
    });

//KANALA ATILAN BÜTÜN MESAJLARA TEPKİ ATAR
    client.on("message", message => {
      if(message.channel.id == "985663662268219453") { 
      message.react("988586127504056331")
      }
      })