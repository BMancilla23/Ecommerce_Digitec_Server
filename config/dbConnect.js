const {default: mongoose} = require('mongoose')
const dotenv = require('dotenv').config()

const dbConnect = () => {
    try {
        const conn = mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@clustercertus.d8tb7.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
        console.log('Database Connected Successfully')
    } catch (error) {
        console.log('Database error')
    }
}

module.exports = dbConnect;
