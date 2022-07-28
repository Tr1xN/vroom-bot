import { Composer } from 'grammy';
import dotenv from 'dotenv';

import { setCreator } from '../db/index.js';

dotenv.config()

export const userComposer = new Composer()

userComposer.command("becomecreator", async (ctx) => {
    if (ctx.match == process.env.CREATOR_PASSWORD) {
        const result = await setCreator(ctx.from.id)
        ctx.reply(result);
    }
})