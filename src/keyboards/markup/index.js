import { Keyboard } from 'grammy';

const mainMenu = new Keyboard()
    .text('🎟️ Забронювати')
    .text('ℹ️ Інформація');

const infoMenu = new Keyboard()
    .text('📃 Про нас')
    .text('🎮 Ігри')
    .text('📒 Правила').row()
    .text('❌ Закрити');

const requestContact = new Keyboard()
    .requestContact('📞Надіслати номер телефону')

const addPriceListMenu = new Keyboard()
    .text('Скасувати')

export { mainMenu, infoMenu, requestContact, addPriceListMenu }