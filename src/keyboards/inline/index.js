import { InlineKeyboard } from 'grammy';

const categorysMenu = new InlineKeyboard()
    .text('🥽 VR', 'vr')
    .text('🎮 PS5', 'ps')
    .text('🏎️ CAR', 'car')
    .row()
    .text('🎉 Свято', 'holiday')

const callMenu = new InlineKeyboard()
    .text('Так', '1call')
    .text('Ні', '0call')

const confirmMenu = new InlineKeyboard()
    .text('Підтверджую', 'confirm')
    .text('Скасувати', 'cancel')

const linksMenu = new InlineKeyboard()
    .url('📸 Instagram', 'https://www.instagram.com/vroom_gorishniplavni')

const settingsMenu = new InlineKeyboard()
    .text('Додати прайс лист', 'addPriceList')

export { categorysMenu, callMenu, confirmMenu, linksMenu, settingsMenu }