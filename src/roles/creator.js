import { Composer } from 'grammy';
import { conversations, createConversation } from "@grammyjs/conversations";

import { createOrder, findUser, setRole, findUserByPhone } from '../db/index.js';
import { mainMenu, addPriceListMenu } from '../keyboards/markup/index.js';
import { settingsMenu } from '../keyboards/inline/index.js'

export const creatorComposer = new Composer()
creatorComposer.use(conversations());

async function askPriceList(conversation, ctx) {
    await ctx.deleteMessage();
    await ctx.reply('Надішли мені зображення прайс листа', { reply_markup: { resize_keyboard: true, keyboard: addPriceListMenu.build() } });
    while (!ctx.message?.photo) {
        ctx = await conversation.wait();
        if (ctx.message?.text == 'Скасувати') {
            await ctx.reply('Операція скасована', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } })
            return;
        }
        if (!ctx.message?.photo){
            await ctx.reply('Відправлене вами повідомлення не є зображенням! Спробуйте ще раз');
        } 
    }
    const image = await ctx.getFile();
    console.log(image)
    const path = await image.download('./src/img/price.png');
    await ctx.reply("Зображення встановлено", { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } });
    console.log("File saved at ", path);
    console.log(image);
}
creatorComposer.use(createConversation(askPriceList));

creatorComposer.command("start", async (ctx) => {
    await ctx.reply(`Привіт ${ctx.from.first_name}!\nТвій статус: творець`);
    await ctx.reply('Використовуй меню для керування ботом⬇', { reply_markup: { resize_keyboard: true, keyboard: mainMenu.build() } });
})

creatorComposer.command("settings", async (ctx) => {
    await ctx.reply('Використовуй меню для налаштування бота:', { reply_markup: settingsMenu });
})

creatorComposer.command("addadmin", async (ctx) => {
    if (await findUserByPhone(ctx.match) != null) {
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
    await ctx.reply(`Команди (Лапки не писати!):\n\nВідкрити меню налашитуваннь:\n/settings\n\nДати користувачу права адміністратора:\n/addadmin "Номер телефона"\n\nЗабрати у користувача права адміністратора:\n/removeadmin "Номер телефона"\n\nПоказати всі замовлення користувача за номером телефона:\n/find "Номер телефона"\n\nОтримати права творця бота(ОБЕРЕЖНО!):\n/becomecreator "Пароль"`);
})

creatorComposer.callbackQuery('addPriceList', async (ctx) => {
    await ctx.conversation.enter("askPriceList");
});

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