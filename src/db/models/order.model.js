import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    date:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true
    },
    time:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: false
    },
    call:{
        type: String,
        required: true
    },
    comment:{
        type: String,
        required: false
    },
    name:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true
    },
    telegramID:{
        type: String,
        required: true
    }
})

const orderModel = mongoose.model('orders', orderSchema)
export default orderModel