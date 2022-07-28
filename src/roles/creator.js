import { Composer } from 'grammy';

import { createOrder, findUser, setRole, findUserByPhone } from '../db/index.js';
import { mainMenu } from '../keyboards/markup/index.js';

export const creatorComposer = new Composer()

creatorComposer.command("start", async (ctx) => {
    await ctx.reply(`Привіт ${ctx.from.first_name}!\nТвій статус: творець`);
    await ctx.reply('Використовуй меню для керування ботом⬇', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } });
})

creatorComposer.command("addadmin", async (ctx) => {
    if (await findUserByPhone(ctx.match) != null) {
        console.log(await findUserByPhone(ctx.match))
        ctx.reply(await setRole(ctx.match, 'admin'));
    }
    else {
        ctx.reply('Користувача не знайдено');
    }
})

creatorComposer.command("removeadmin", async (ctx) => {
    if (await findUserByPhone(ctx.match) != null) {
        ctx.reply(await setRole(ctx.match, 'user'));
    }
    else {
        ctx.reply('Користувача не знайдено');
    }
})

creatorComposer.command("help", async (ctx) => {
    await ctx.reply(`Команди (Лапки не писати!):\n\nДати користувачу права адміністратора:\n/addadmin "Номер телефона"\n\nЗабрати у користувача права адміністратора:\n/removeadmin "Номер телефона"\n\nПоказати всі замовлення користувача за номером телефона:\n/find "Номер телефона"\n\nОтримати права творця бота(ОБЕРЕЖНО!):\n/becomecreator "Пароль"`);
})


creatorComposer.callbackQuery('confirm', async (ctx) => {
    const user = await findUser(ctx.from.id);

    ctx.session.order.name = user.name;
    ctx.session.order.phone = user.phone;
    ctx.session.order.telegramID = ctx.from.id;
    ctx.session.order.call = 'Ні';

    let orderString = `Категорія: ${ctx.session.order.category.toUpperCase()}\nДата: ${ctx.session.order.date}\nЧас: ${ctx.session.order.time}`
    if (ctx.session.order.category == 'vr') {
        orderString += `\nКількість місць: ${ctx.session.order.amount}`
    }
    ctx.editMessageText('✅Замовлення підтверджено!✅\n\n' + orderString)
    createOrder(ctx.session.order);
});