import mongoose from "mongoose";
mongoose.set('strictQuery', false);
import orderModel from "./models/order.model.js";
import userModel from "./models/user.model.js";
import moment from "moment";

function connectToMongo() {
    mongoose.connect('mongodb://localhost:27017/vroom', { useNewUrlParser: true })
        .then(() => console.log('[OK] DB is connected'))
        .catch(err => console.error(err));
}

async function getFreeKits(date, time) {
    let freeKits = 4;
    await orderModel.find({ date: moment(date).format('YYYY-MM-DD'), time: time, category: 'vr' }).then(orders => {
        orders.map(order => {
            freeKits -= order.amount;
        })
    });
    return freeKits;
}

async function isPSFree(date, time) {
    if (await orderModel.findOne({ date: moment(date).format('YYYY-MM-DD'), time: time, category: 'ps' })) {
        return false;
    }
    return true;
}

async function isCarFree(date, time) {
    if (await orderModel.findOne({ date: moment(date).format('YYYY-MM-DD'), time: time, category: 'car' })) {
        return false;
    }
    return true;
}

async function createOrder(order) {
    return await orderModel.create(order)
        .then(() => console.log('[OK] Order is created'))
        .catch(err => console.error(err));
}

async function findUser(telegramID) {
    return await userModel.findOne({ telegramID: telegramID });
}

async function findUsersByRole(role) {
    return await userModel.find({ role: role });
}

async function findUserByPhone(phone) {
    return await userModel.findOne({ phone: phone });
}

async function findOrdersByPhone(phone) {
    return await orderModel.find({ phone: phone });
}

async function findOrders(date, time, category) {
    return await orderModel.find({ date: date, time: time, category: category });
}

async function getUserRole(telegramID) {
    return await userModel.findOne({ telegramID: telegramID }).then(user => {
        return user.role;
    })
}

async function createUser(user) {
    return await userModel.create(user)
        .then(() => console.log('[OK] User is created'))
        .catch(err => console.error(err));
}

async function setRole(phone, role) {
    return userModel.findOneAndUpdate({ phone: phone }, { role: role })
        .then(() => {
            console.log('[OK] Role is setted')
            return '???????? ?????????????????????? ????????????????'
        })
        .catch(err => {
            console.error(err)
            return '?????????????? ?????????? ??????????????'
        });
}

async function setCreator(telegramID) {
    return userModel.findOneAndUpdate({ telegramID: telegramID }, { role: 'creator' })
        .then(() => {
            console.log('[OK] Role is setted')
            return '???? ?????????? ??????????????'
        })
        .catch(err => {
            console.error(err)
            return '???????? ?????????? ???? ??????'
        });
}

async function deleteOrderById(id) {
    return await orderModel.deleteOne({ _id: id })
        .then((callback) => {
            console.log('[OK] Order is deleted')
            if(callback.deletedCount == 0){
                return '???????????????????? ???? ??????????'
            }
            else{
                return '???????????????????? ???????? ????????????????'
            }
        })
        .catch(err => {
            console.error(err)
            return '?????????????? ??????????????'
        });
}

export { connectToMongo, getFreeKits, isPSFree, isCarFree, createOrder, findUser, createUser, getUserRole, findUsersByRole, findOrdersByPhone, setRole, setCreator, findUserByPhone, findOrders, deleteOrderById }