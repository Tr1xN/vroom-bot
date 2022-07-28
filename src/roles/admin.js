import { Composer, InlineKeyboard } from 'grammy';

import { createOrder, findUser, findUsersByRole, findOrdersByPhone, findOrders, deleteOrderById } from '../db/index.js';
import { mainMenu } from '../keyboards/markup/index.js';
import { confirmMenu } from '../keyboards/inline/index.js';
import { getKitsAmountKeyboard } from '../keyboards/custom/dynamicKeyboards.js'

export const adminComposer = new Composer()

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
            let orderMsgString = `${i++}) Ім'я: ${ctx.session.order.name}\nКатегорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}\nНомер телефону: ${ctx.session.order.phone}\nПеретелефонувати: ${ctx.session.order.call}`;
            if (ctx.session.order.category == 'vr') {
                orderMsgString += `\nКількість місць: ${ctx.session.order.amount}\n\n`
            }
            ordersList += orderMsgString;
        })
        ctx.reply(ordersList)
    }
})


adminComposer.callbackQuery('holiday', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'Замовити свято може тільки клієнт!' });
});

adminComposer.callbackQuery(/^b?o?\d{2}:00$/, async (ctx) => {
    ctx.deleteMessage()
    const createOrEditMenu = new InlineKeyboard()
    if (ctx.callbackQuery.data[0] == 'b') {
        createOrEditMenu.text('🛠️Редагувати', 'edit')
    }
    else if (ctx.callbackQuery.data[0] == 'o') {
        createOrEditMenu.text('➕Створити', 'create')
    }
    else {
        createOrEditMenu.text('➕Створити', 'create').text('🛠️Редагувати', 'edit')
    }
    ctx.reply('Обери дію:', { reply_markup: createOrEditMenu })
    ctx.session.order.time = ctx.callbackQuery.data.replace(/b?o?/, '');
});

adminComposer.callbackQuery('edit', async (ctx) => {
    ctx.deleteMessage();
    const orders = await findOrders(ctx.session.order.date, ctx.session.order.time, ctx.session.order.category)
    orders.map((order) => {
        const deleteButton = new InlineKeyboard().text('🗑️Видалити', `delete-${order._id}`)
        let orderMsg = `Ім'я: ${order.name}\nКатегорія: ${order.category.toUpperCase()}\nДата: ${order.date}\nЧас: ${order.time}\nНомер телефону: ${order.phone}\nПеретелефонувати: ${order.call}`;
        if (order.category == 'vr') {
            orderMsg += `\nКількість місць: ${order.amount}`
        }
        ctx.reply(orderMsg, { reply_markup: deleteButton })
    })
});

adminComposer.callbackQuery(/^delete-.{24}$/, async (ctx) => {
    const _id = ctx.callbackQuery.data.replace('delete-', '')
    await ctx.answerCallbackQuery({ text: await deleteOrderById(_id) });
    await ctx.deleteMessage();
});

adminComposer.callbackQuery('create', async (ctx) => {
    if (ctx.session.order.category === 'vr') {
        ctx.editMessageText('Скільки місць бронюєте?', { reply_markup: await getKitsAmountKeyboard(ctx.session.order.date, ctx.session.order.time) })
    }
    else if (ctx.session.order.category === 'ps') {
        let orderString = `Категорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}`
        if (ctx.session.order.category == 'vr') {
            orderString += `\nКількість місць: ${ctx.session.order.amount}`
        }
        ctx.editMessageText('Підтвердіть замовлення:\n\n' + orderString, { reply_markup: confirmMenu })
    }
});

adminComposer.callbackQuery(/^[1-4]kits$/, async (ctx) => {
    ctx.session.order.amount = ctx.callbackQuery.data[0];
    let orderString = `Категорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}`
    if (ctx.session.order.category == 'vr') {
        orderString += `\nКількість місць: ${ctx.session.order.amount}`
    }
    ctx.editMessageText('Підтвердіть замовлення:\n\n' + orderString, { reply_markup: confirmMenu })
});

adminComposer.callbackQuery('confirm', async (ctx) => {
    const user = await findUser(ctx.from.id);

    ctx.session.order.name = user.name;
    ctx.session.order.phone = user.phone;
    ctx.session.order.telegramID = ctx.from.id;
    ctx.session.order.call = 'Ні';

    let orderString = `Категорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}`
    let orderMsgString = `Ім'я: ${ctx.session.order.name}\nКатегорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}\nНомер телефону: ${ctx.session.order.phone}\nПеретелефонувати: ${ctx.session.order.call}`;
    if (ctx.session.order.category == 'vr') {
        orderString += `\nКількість місць: ${ctx.session.order.amount}`
        orderMsgString += `\nКількість місць: ${ctx.session.order.amount}`
    }
    ctx.editMessageText('✅Замовлення підтверджено!✅\n\n' + orderString)
    await findUsersByRole('creator').then(creators => {
        creators.map(creator => {
            ctx.api.sendMessage(creator.telegramID, "👑Адмін забронював місце!\n\n" + orderMsgString);
        })
    })
    createOrder(ctx.session.order);
});
