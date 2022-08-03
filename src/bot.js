import { Bot, session } from 'grammy';
import moment from 'moment';
import dotenv from 'dotenv';

import { connectToMongo, findUser, getUserRole } from './db/index.js';
import { guestComposer } from './roles/guest.js'
import { userComposer } from './roles/user.js'
import { adminComposer } from './roles/admin.js'
import { creatorComposer } from './roles/creator.js'
import { defaultComposer } from './roles/default.js'

dotenv.config()
moment.locale('uk');
connectToMongo();

const bot = new Bot(process.env.BOT_TOKEN);
const guest = bot.filter(async ctx => await findUser(ctx.from.id) == null)
const user = bot.filter(async ctx => await getUserRole(ctx.from.id) == 'user')
const admin = bot.filter(async ctx => await getUserRole(ctx.from.id) == 'admin')
const creator = bot.filter(async ctx => await getUserRole(ctx.from.id) == 'creator')

user.use(session({ initial: () => ({ order: {} }) }));
admin.use(session({ initial: () => ({ order: {} }) }));
creator.use(session({ initial: () => ({ order: {} }) }));

guest.use(guestComposer);
user.use(userComposer).use(defaultComposer);
admin.use(adminComposer).use(defaultComposer);
creator.use(creatorComposer).use(adminComposer).use(defaultComposer);

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});

bot.start()