import { Composer, InputFile } from 'grammy';
import dotenv from 'dotenv';

import data from '../json/data.json' assert {type: 'json'};
import { mainMenu, infoMenu } from '../keyboards/markup/index.js';
import { linksMenu } from '../keyboards/inline/index.js';

dotenv.config()

export const defaultComposer = new Composer()

defaultComposer.command("start", async (ctx) => {
    await ctx.reply(`Привіт ${ctx.from.first_name}!☺️`);
    await sleep(1)
    await ctx.reply('Я чат-бот клубу віртуальної реальності VROOM🤖');
    await sleep(1)
    await ctx.reply('Я допоможу тобі забронювати місце в клубі та дізнатися трохи більше інформації про насℹ️');
    await sleep(1)
    await ctx.reply('Використовуй меню для навігації⬇', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } });
})

defaultComposer.hears("ℹ️ Інформація", (ctx) => { ctx.reply('ℹ️ Інформація:', { reply_markup: { resize_keyboard: true, keyboard: infoMenu.build() } }) })
defaultComposer.hears("📃 Про нас", (ctx) => { ctx.reply(data.about, { reply_markup: linksMenu }) })
defaultComposer.hears("🎮 Ігри", async (ctx) => {
    for (let i = 0; i < data.games.length; i++) {
        await ctx.replyWithPhoto(new InputFile(process.env.BOT_PATH+"/src/img/games/" + data.games[i].src), { caption: `${data.games[i].name}\n\n${data.games[i].description}` });
    }
    await ctx.reply('І це не все! В нас є ще багато цікавих ігор. Нажаль всі вони не помістяться сюди. Тож не зволікай, бронюй місце у нашому клубі, і відкрий світ нових можливостей')
})
defaultComposer.hears("📒 Правила", (ctx) => { ctx.reply(data.rules) })
defaultComposer.hears("❌ Закрити", (ctx) => {
    ctx.reply('Головне меню:', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } })
})

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));
