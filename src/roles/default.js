import { Composer, InputFile } from 'grammy';
import moment from 'moment';
import dotenv from 'dotenv';

import { createOrder, findUser, findUsersByRole } from '../db/index.js';
import data from '../json/data.json' assert {type: 'json'};
import { mainMenu, infoMenu } from '../keyboards/markup/index.js';
import { categorysMenu, callMenu, confirmMenu, linksMenu } from '../keyboards/inline/index.js'
import { getVRKeyboard, getPSKeyboard, getKitsAmountKeyboard } from '../keyboards/custom/dynamicKeyboards.js'
import Calendar from '../keyboards/custom/calendar.js';

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


defaultComposer.hears("🎟️ Забронювати", (ctx) => {
    ctx.replyWithPhoto(new InputFile(process.env.BOT_PATH + "/src/img/price.jpg"), { caption: 'Обери категорію:', reply_markup: categorysMenu });
    const calendar = new Calendar({ minDate: moment().subtract(1, 'day'), maxDate: moment().add(28, 'days') });
})

defaultComposer.hears("ℹ️ Інформація", (ctx) => {
    ctx.reply('ℹ️ Інформація:', { reply_markup: { resize_keyboard: true, keyboard: infoMenu.build() } })
})

defaultComposer.hears("📃 Про нас", (ctx) => {
    ctx.reply(data.about, { reply_markup: linksMenu })
})

defaultComposer.hears("🎮 Ігри", async (ctx) => {
    for (let i = 0; i < data.games.length; i++) {
        await ctx.replyWithPhoto(new InputFile(process.env.BOT_PATH + "/src/img/games/" + data.games[i].src), { caption: `${data.games[i].name}\n\n${data.games[i].description}` });
    }
    await ctx.reply('І це не все! В нас є ще багато цікавих ігор. Нажаль всі вони не помістяться сюди. Тож не зволікай, бронюй місце у нашому клубі, і відкрий світ нових можливостей')
})

defaultComposer.hears("📒 Правила", (ctx) => {
    ctx.reply(data.rules)
})

defaultComposer.hears("❌ Закрити", (ctx) => {
    ctx.reply('Головне меню:', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } })
})


defaultComposer.callbackQuery(['vr', 'ps', 'holiday'], async (ctx) => {
    ctx.session.order.category = ctx.callbackQuery.data;
    await ctx.deleteMessage();
    await ctx.reply('🗓️Обери дату:', { reply_markup: calendar.getCalendarKeyboard() });
});

defaultComposer.callbackQuery('prev', async (ctx) => {
    ctx.editMessageReplyMarkup({ reply_markup: calendar.getPrevMonth() });
});

defaultComposer.callbackQuery('next', async (ctx) => {
    ctx.editMessageReplyMarkup({ reply_markup: calendar.getNextMonth() });
});

defaultComposer.callbackQuery(/\d{4}-\d{2}-\d{2}/, async (ctx) => {
    ctx.session.order.date = ctx.callbackQuery.data;
    if (ctx.session.order.category === 'vr') {
        ctx.editMessageText('🕐Обери час:', { reply_markup: await getVRKeyboard(ctx.session.order.date) });
    }
    else if (ctx.session.order.category === 'ps') {
        ctx.editMessageText('🕐Обери час:', { reply_markup: await getPSKeyboard(ctx.session.order.date) });
    }
    else if (ctx.session.order.category === 'holiday') {
        let orderString = `Категорія: Свято\nДата: ${ctx.session.order.date}`
        ctx.editMessageText('Підтвердіть замовлення:\n\n' + orderString, { reply_markup: confirmMenu })
    }
});

defaultComposer.callbackQuery('backToCalendar', async (ctx) => {
    ctx.editMessageText('🗓️Обери дату:', { reply_markup: calendar.getCalendarKeyboard() });
});

defaultComposer.callbackQuery(/^o?\d{2}:00$/, async (ctx) => {
    ctx.session.order.time = ctx.callbackQuery.data.replace(/b?o?/, '');
    if (ctx.session.order.category === 'vr') {
        ctx.editMessageText('Скільки місць бронюєте?', { reply_markup: await getKitsAmountKeyboard(ctx.session.order.date, ctx.session.order.time) })
    }
    else if (ctx.session.order.category === 'ps') {
        ctx.editMessageText('📞Перетелефонувати вам для підтвердження замовлення?', { reply_markup: callMenu })
    }
});

defaultComposer.callbackQuery(/^[1-4]kits$/, async (ctx) => {
    ctx.session.order.amount = ctx.callbackQuery.data[0];
    ctx.editMessageText('📞Перетелефонувати вам для підтвердження замовлення?', { reply_markup: callMenu })
});

defaultComposer.callbackQuery(/^[0-1]call$/, async (ctx) => {
    if (ctx.callbackQuery.data[0]) {
        ctx.session.order.call = 'Так';
    }
    else {
        ctx.session.order.call = 'Ні';
    }
    let orderString = `Категорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}`
    if (ctx.session.order.category == 'vr') {
        orderString += `\nКількість місць: ${ctx.session.order.amount}`
    }
    ctx.editMessageText('Підтвердіть замовлення:\n\n' + orderString, { reply_markup: confirmMenu })
});

defaultComposer.callbackQuery('confirm', async (ctx) => {
    const user = await findUser(ctx.from.id);

    ctx.session.order.name = user.name;
    ctx.session.order.phone = user.phone;
    ctx.session.order.telegramID = ctx.from.id;

    if (ctx.session.order.category === 'holiday') {
        ctx.session.order.call = 'Так';

        let orderString = `Категорія: Свято\nДата: ${ctx.session.order.date}`
        let orderMsgString = `Ім'я: ${ctx.session.order.name}\nКатегорія: Свято\nДата: ${ctx.session.order.date}\nНомер телефону: ${ctx.session.order.phone}\nПеретелефонувати: ${ctx.session.order.call}`;
        ctx.editMessageText('✅Замовлення підтверджено!✅\n\n' + orderString)
        ctx.reply("Найближчим часом ми зв'яжемося з вами, щоб уточнити деталі свята!")
        await findUsersByRole('admin').then(admins => {
            admins.map(admin => {
                ctx.api.sendMessage(admin.telegramID, "👤Клієнт хоче провести свято!\nНеобхідно зателефонувати клієнту та проконсультувати його!\n(Не забудь забронювати місця в боті на час проведення свята)\n\n" + orderMsgString);
            })
        })
        await findUsersByRole('creator').then(creators => {
            creators.map(creator => {
                ctx.api.sendMessage(creator.telegramID, "👤Клієнт хоче провести свято!\nАдміністратор зателефонує клієнту та проконсультує його!\n\n" + orderMsgString);
            })
        })
    }
    else {
        let orderString = `Категорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}`
        let orderMsgString = `Ім'я: ${ctx.session.order.name}\nКатегорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}\nНомер телефону: ${ctx.session.order.phone}\nПеретелефонувати: ${ctx.session.order.call}`;
        if (ctx.session.order.category == 'vr') {
            orderString += `\nКількість місць: ${ctx.session.order.amount}`
            orderMsgString += `\nКількість місць: ${ctx.session.order.amount}`
        }
        ctx.editMessageText('✅Замовлення підтверджено!✅\n\n' + orderString)
        await findUsersByRole('admin').then(admins => {
            admins.map(admin => {
                ctx.api.sendMessage(admin.telegramID, "👤Клієнт забронював місце!\n\n" + orderMsgString);
            })
        })
        await findUsersByRole('creator').then(creators => {
            creators.map(creator => {
                ctx.api.sendMessage(creator.telegramID, "👤Клієнт забронював місце!\n\n" + orderMsgString);
            })
        })
        createOrder(ctx.session.order);
    }
});

defaultComposer.callbackQuery('cancel', async (ctx) => {
    ctx.editMessageText('❌Замовлення скасовано!')
    ctx.session.order = {}
});

defaultComposer.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery();
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));
