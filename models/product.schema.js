const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
let productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim: true
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        lowercase: true
    },
    description:{
        type:String,
        required:true,
    },
    price:{
        type:String,
        required:true,
    },
    category: {
        /* type: mongoose.Schema.Types.ObjectId,
        ref: "Category" */
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
        /* enum: ["Apple", "Samsung", "Lenovo"] */
    },
    quantity: {
        type: Number,
        required: true
    },
    sold: {
        type: Number,
        default: 0
    },
    images: {
        type: Array
    },
    color: {
        type: String,
        /* enum: ['Black', "Brown", "Red"] */
        required: true
    },
    ratings: [{
        star: Number,
        postedby: {type: mongoose.Schema.Types.ObjectId, ref: "User"}
    }]
},
{
    timestamps: true
});

//Export the model
module.exports = mongoose.model('Product', productSchema);