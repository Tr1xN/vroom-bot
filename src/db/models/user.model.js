import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
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
    },
    role:{
        type: String,
        default: 'user'
    },
    registrationDate:{
        type: Date,
        default: Date.now
    },
    hours:{
        type: Number,
        default: 0
    }
})

const userModel = mongoose.model('users', userSchema)
export default userModel