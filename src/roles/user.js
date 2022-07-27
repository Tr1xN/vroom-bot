import { Composer, InputFile } from 'grammy';
import moment from 'moment';
import dotenv from 'dotenv';

import { createOrder, findUser, findUsersByRole, setCreator } from '../db/index.js';
import { callMenu, confirmMenu, categorysMenu } from '../keyboards/inline/index.js';
import { getVRKeyboard, getPSKeyboard, getKitsAmountKeyboard } from '../keyboards/custom/dynamicKeyboards.js'
import Calendar from '../keyboards/custom/calendar.js';

dotenv.config()

const calendar = new Calendar({ minDate: moment(), maxDate: moment().add(28, 'days') });

export const userComposer = new Composer()

userComposer.hears("🎟️ Забронювати", (ctx) => {
    ctx.session.order = {};
    ctx.replyWithPhoto(new InputFile(process.env.BOT_PATH + "/src/img/price.jpg"), { caption: 'Обери категорію:', reply_markup: categorysMenu });
})

userComposer.command("becomecreator", async (ctx) => {
    if (ctx.match == process.env.CREATOR_PASSWORD) {
        const result = await setCreator(ctx.from.id)
        ctx.reply(result);
    }
})

userComposer.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const order = ctx.session.order;

    await ctx.answerCallbackQuery();

    if (data === 'vr' || data === 'ps' || data === 'holiday') {
        ctx.session.order.category = data;
        await ctx.deleteMessage();
        await ctx.reply('🗓️Обери дату:', { reply_markup: calendar.getCalendarKeyboard() });
    }

    else if (data === 'null') {
        return;
    }
    else if (data === 'prev') {
        ctx.editMessageReplyMarkup({ reply_markup: calendar.getPrevMonth() });
    }
    else if (data === 'next') {
        ctx.editMessageReplyMarkup({ reply_markup: calendar.getNextMonth() });
    }
    else if (moment(data).isValid()) {
        ctx.session.order.date = moment(data).format('YYYY-MM-DD');
        if (ctx.session.order.category === 'vr') {
            ctx.editMessageText('🕐Обери час:', { reply_markup: await getVRKeyboard(ctx.session.order.date) });
        }
        else if (ctx.session.order.category === 'ps') {
            ctx.editMessageText('🕐Обери час:', { reply_markup: await getPSKeyboard(ctx.session.order.date) });
        }
        else if (ctx.session.order.category === 'holiday') {
            let orderString = `Категорія: Свято\nДата: ${order.date}`
            ctx.editMessageText('Підтвердіть замовлення:\n\n' + orderString, { reply_markup: confirmMenu })
        }
    }

    else if (data === 'backToCalendar') {
        ctx.editMessageText('🗓️Обери дату:', { reply_markup: calendar.getCalendarKeyboard() });
    }

    else if (/^[0-9][0-9]:00$/.test(data)) {
        ctx.session.order.time = data;
        if (order.category === 'vr') {
            ctx.editMessageText('Скільки місць бронюєте?', { reply_markup: await getKitsAmountKeyboard(ctx.session.order.date, ctx.session.order.time) })
        }
        else if (order.category === 'ps') {
            ctx.editMessageText('📞Перетелефонувати вам для підтвердження замовлення?', { reply_markup: callMenu })
        }
    }
    else if (/^[1-4]kits$/.test(data)) {
        ctx.session.order.amount = data[0];
        ctx.editMessageText('📞Перетелефонувати вам для підтвердження замовлення?', { reply_markup: callMenu })
    }
    else if (/^[0-1]call$/.test(data)) {
        if (data[0]) {
            ctx.session.order.call = 'Так';
        }
        else {
            ctx.session.order.call = 'Ні';
        }
        let orderString = `Категорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}`
        if (order.category == 'vr') {
            orderString += `\nКількість місць: ${order.amount}`
        }
        ctx.editMessageText('Підтвердіть замовлення:\n\n' + orderString, { reply_markup: confirmMenu })
    }
    else if (data == 'confirm') {
        const user = await findUser(ctx.from.id);

        ctx.session.order.name = user.name;
        ctx.session.order.phone = user.phone;
        ctx.session.order.telegramID = ctx.from.id;

        if (order.category === 'holiday') {
            ctx.session.order.call = 'Так';

            let orderString = `Категорія: Свято\nДата: ${order.date}`
            let orderMsgString = `Ім'я: ${order.name}\nКатегорія: Свято\nДата: ${order.date}\nНомер телефону: ${order.phone}\nПеретелефонувати: ${order.call}`;
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
            let orderString = `Категорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}`
            let orderMsgString = `Ім'я: ${order.name}\nКатегорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}\nНомер телефону: ${order.phone}\nПеретелефонувати: ${order.call}`;
            if (order.category == 'vr') {
                orderString += `\nКількість місць: ${order.amount}`
                orderMsgString += `\nКількість місць: ${order.amount}`
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
            createOrder(order);
        }
    }
    else if (data == 'cancel') {
        ctx.editMessageText('❌Замовлення скасовано!')
        ctx.session.order = {}
    }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));
