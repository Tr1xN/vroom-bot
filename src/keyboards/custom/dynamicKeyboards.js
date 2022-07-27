import { InlineKeyboard } from "grammy";
import { getFreeKits, isPSFree } from "../../db/index.js";

async function getVRKeyboard(date) {
    const timeKeyboard = new InlineKeyboard();
    const timesArray = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

    for (let i = 0; i < timesArray.length; i++) {
        const freeKits = await getFreeKits(date, timesArray[i])
        const indicators = ['❌❌❌❌', '✅❌❌❌', '✅✅❌❌', '✅✅✅❌', '✅✅✅✅'];
        timeKeyboard.text(`${timesArray[i]} ${indicators[freeKits]}`, freeKits == 0 ? 'null' : timesArray[i]);
        if (i % 2 == 1) {
            timeKeyboard.row()
        }
    }
    timeKeyboard.text('⬅️Повернутись', 'backToCalendar')

    return timeKeyboard;
}

async function getPSKeyboard(date) {
    const timeKeyboard = new InlineKeyboard();
    const timesArray = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

    for (let i = 0; i < timesArray.length; i++) {
        if (await isPSFree(date, timesArray[i])) {
            timeKeyboard.text(`${timesArray[i]} ✅`, timesArray[i]);
        }
        else {
            timeKeyboard.text(`${timesArray[i]} ❌`, 'null');
        }
        if (i % 2 == 1)
            timeKeyboard.row()
    }
    timeKeyboard.text('⬅️Повернутись', 'backToCalendar')

    return timeKeyboard;
}

async function getKitsAmountKeyboard(date, time) {
    const timeKeyboard = new InlineKeyboard();
    const freeKits = await getFreeKits(date, time)
    for (let i = 1; i <= freeKits; i++) {
        timeKeyboard.text(i, i+'kits');
    }

    return timeKeyboard;
}

export { getVRKeyboard, getPSKeyboard, getKitsAmountKeyboard };