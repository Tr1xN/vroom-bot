import { Composer } from 'grammy';

import { createUser } from '../db/index.js';
import { requestContact, mainMenu } from '../keyboards/markup/index.js';

export const guestComposer = new Composer()

guestComposer.on('msg:contact', async ctx => {
    createUser({ name: ctx.from.first_name, phone: ctx.message.contact.phone_number, telegramID: ctx.from.id })
    await ctx.reply(`Привіт ${ctx.from.first_name}!☺️`);
    await sleep(1)
    await ctx.reply('Я чат-бот клубу віртуальної реальності VROOM🤖');
    await sleep(1)
    await ctx.reply('Я допоможу тобі забронювати місце в клубі та дізнатися трохи більше про насℹ️');
    await sleep(1)
    await ctx.reply('Використовуй меню для навігації⬇', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } });
})

guestComposer.on('msg', (ctx) => {
    ctx.reply('❗️Для роботи з ботом необхідно відправити свій номер телефону\n\n⬇️Натисніть на кнопку "Надіслати номер телефону"', { reply_markup: { resize_keyboard: true, keyboard: requestContact.build() } })
})

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));