const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require('bcrypt');

// Declare the Schema of the Mongo model
let userSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true
    },
    lastname: {
        type: String,
        required: true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    mobile:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    role: {
        type: String,
        default: "user"
    }
});

// Define un hook 'pre' que se ejecutará antes de que se guarde un documento en la base de datos
userSchema.pre('save', async function(next){
    // Genera un 'salt' para la encriptación utilizando bcrypt
    const salt =  await bcrypt.genSaltSync(10)
    
    // Hashea el password del usuario usando el 'salt' generado
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

// Define un método en el modelo de usuario para verificar si la contraseña coincide
userSchema.methods.isPasswordMatched = async function(enteredPassword){
    // Compara la contraseña proporcionada con la contraseña almacenada
    return await bcrypt.compare(enteredPassword, this.password)
}

//Export the model
module.exports = mongoose.model('User', userSchema);
