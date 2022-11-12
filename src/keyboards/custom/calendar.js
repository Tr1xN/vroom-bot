import { InlineKeyboard } from "grammy";
import moment from "moment";

export default class Calendar {
    constructor(options) {
        this.minDate = options.minDate;
        this.maxDate = options.maxDate;

        this.page = moment().month();
    }

    getCalendarArray() {
        const startDate = moment().set('month', this.page).startOf('month');
        const endDate = moment().set('month', this.page).endOf('month');
        const calendarArray = [];

        for (let date = startDate; date.isBefore(endDate); date.add(7, 'days')) {
            calendarArray.push(Array(7).fill(0).map((e, i) => {
                if (moment(date).set('month', this.page).startOf('week').add(e + i, 'day').month() !== moment().set('month', this.page).month()) {
                    return ' ';
                }
                return moment(date).set('month', this.page).startOf('week').add(e + i, 'day');
            }))
        }
        
        return calendarArray;
    }

    getCalendarKeyboard() {
        const calendarKeyboard = new InlineKeyboard()

        console.log(moment().set('month', this.page+1));

        if(moment().set('month', this.page-1).endOf('month').isAfter(moment().add(this.minDate, 'day'))) {
            calendarKeyboard.text('⬅️', 'prev')
        }
        else{
            calendarKeyboard.text(' ', 'null')
        }

        calendarKeyboard.text(moment().set('month', this.page).format("MMMM") + ' ' + moment().year(), 'null')

        if(moment().set('month', this.page+1).startOf('month').isBefore(moment().add(this.maxDate, 'day'))) {
            calendarKeyboard.text('➡️', 'next')
        }
        else{
            calendarKeyboard.text(' ', 'null')
        }

        calendarKeyboard.row()
            .text('Пн', 'null')
            .text('Вт', 'null')
            .text('Ср', 'null')
            .text('Чт', 'null')
            .text('Пт', 'null')
            .text('Сб', 'null')
            .text('Нд', 'null')
            .row()

        this.getCalendarArray().forEach(week => {
            week.forEach(day => {
                if (day !== ' ') {
                    if (day.isAfter(moment().add(this.minDate, 'day')) && day.isBefore(moment().add(this.maxDate, 'day'))) {
                        calendarKeyboard.text(day.date(), day.format('YYYY-MM-DD'));
                    }
                    else {
                        calendarKeyboard.text('❌' + day.date(), 'null');
                    }
                } else {
                    calendarKeyboard.text(' ', 'null');
                }
            })
            calendarKeyboard.row()
        })

        return calendarKeyboard;
    }

    getNextMonth() {
        this.page++;
        return this.getCalendarKeyboard();
    }

    getPrevMonth() {
        this.page--;
        return this.getCalendarKeyboard();
    }
}