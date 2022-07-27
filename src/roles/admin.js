import { Composer, InputFile } from 'grammy';
import moment from 'moment';
import dotenv from 'dotenv';

import { createOrder, findUser, findUsersByRole, findOrdersByPhone } from '../db/index.js';
import { mainMenu } from '../keyboards/markup/index.js';
import { confirmMenu, adminCategorysMenu } from '../keyboards/inline/index.js';
import { getVRKeyboard, getPSKeyboard, getKitsAmountKeyboard } from '../keyboards/custom/dynamicKeyboards.js'
import Calendar from '../keyboards/custom/calendar.js';

dotenv.config()

const calendar = new Calendar({ minDate: moment(), maxDate: moment().add(28, 'days') });

export const adminComposer = new Composer()

adminComposer.hears("🎟️ Забронювати", (ctx) => {
    ctx.session.order = {};
    ctx.replyWithPhoto(new InputFile(process.env.BOT_PATH + "/src/img/price.jpg"), { caption: 'Обери категорію:', reply_markup: adminCategorysMenu });
})

adminComposer.command("start", async (ctx) => {
    await ctx.reply(`Привіт ${ctx.from.first_name}!\nТвій статус: адміністратор`);
    await ctx.reply('Використовуй меню для керування ботом⬇', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } });
})

adminComposer.command("find", async (ctx) => {
    const orders = await findOrdersByPhone(ctx.match);
    if (orders == null) {
        ctx.reply('Бронювань не знайдено!')
    }
    else {
        let ordersList = 'Список замовлень:\n\n'
        orders.map((order, i) => {
            let orderMsgString = `${i++}) Ім'я: ${order.name}\nКатегорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}\nНомер телефону: ${order.phone}\nПеретелефонувати: ${order.call}`;
            if (order.category == 'vr') {
                orderMsgString += `\nКількість місць: ${order.amount}\n\n`
            }
            ordersList += orderMsgString;
        })
        ctx.reply(ordersList)
    }
})

adminComposer.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const order = ctx.session.order;

    await ctx.answerCallbackQuery();

    if (data === 'vr' || data === 'ps') {
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
        ctx.editMessageText('🕐Обери час:', { reply_markup: ctx.session.order.category === 'vr' ? await getVRKeyboard(ctx.session.order.date) : await getPSKeyboard(ctx.session.order.date) });
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
            let orderString = `Категорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}`
            if (order.category == 'vr') {
                orderString += `\nКількість місць: ${order.amount}`
            }
            ctx.editMessageText('Підтвердіть замовлення:\n\n' + orderString, { reply_markup: confirmMenu })
        }
    }
    else if (/^[1-4]kits$/.test(data)) {
        ctx.session.order.amount = data[0];
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
        ctx.session.order.call = 'Ні';

        let orderString = `Категорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}`
        let orderMsgString = `Ім'я: ${order.name}\nКатегорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}\nНомер телефону: ${order.phone}\nПеретелефонувати: ${order.call}`;
        if (order.category == 'vr') {
            orderString += `\nКількість місць: ${order.amount}`
            orderMsgString += `\nКількість місць: ${order.amount}`
        }
        ctx.editMessageText('✅Замовлення підтверджено!✅\n\n' + orderString)
        await findUsersByRole('creator').then(creators => {
            creators.map(creator => {
                ctx.api.sendMessage(creator.telegramID, "👑Адмін забронював місце!\n\n" + orderMsgString);
            })
        })
        createOrder(order);
    }
    else if (data == 'cancel') {
        ctx.editMessageText('❌Замовлення скасовано!')
        ctx.session.order = {}
    }
});
