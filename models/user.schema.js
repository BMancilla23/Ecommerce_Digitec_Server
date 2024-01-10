const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");
const crypto = require('crypto');

// Declare the Schema of the Mongo model
let userSchema = new mongoose.Schema(
    {
      // Propiedades básicas del usuario
      firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      mobile: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      isBlocked: {
        type: Boolean,
        default: false
      },
      // Propiedades adicionales para manejar roles y carrito del usuario
      role: {
        type: String,
        default: "user",
      },
      cart: {
        type: Array,
        default: [],
      },
  
      // Relación con direcciones y lista de deseos mediante sus ID
      address: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
      wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

      // Campos para la gestión de contraseñas y seguridad
      refreshToken: {
        type: String,
      },
      passwordChangedAt: Date, // Fecha de cambio de contraseña
      passwordResetToken: String, // Token para restablecimiento de contraseña
      passwordResetExpires: Date // Fecha de expiración del token de restablecimiento de contraseñas
    },
    {
      // Configuración adicional del esquema
      timestamps: true, // Agrega campos de 'createdAt' y 'updatedAt' automáticamente
    }
  );

// Define un hook 'pre' que se ejecutará antes de que se guarde un documento en la base de datos
userSchema.pre("save", async function (next) {
  // Verifica si la contraseña ha sido modificada antes de guardar
  if (!this.isModified("password")) {
    // Si la contraseña no se ha modificado, pasa al siguiente middleware
    next();
  }

  // Genera un 'salt' para la encriptación utilizando bcrypt
  const salt = await bcrypt.genSaltSync(10);

  // Hashea el password del usuario usando el 'salt' generado
  this.password = await bcrypt.hash(this.password, salt);

  // Continua con el siguiente middleware
  next();
});

// Define un método en el modelo de usuario para verificar si la contraseña coincide
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  // Compara la contraseña proporcionada con la contraseña almacenada
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para crear un token de restablecimiento de contraseña
userSchema.methods.createPasswordResetToken = async function(){
  // Genera un token aleatorio de 32 bytes en formato hexadecimal
  const resetToken = crypto.randomBytes(32).toString("hex")

  // Hashea el token para almacenarlo de forma segura en la base de datos
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest("hex")

  // Establece la fecha de expiración del token (10 minutos)
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000 // 10 minutes

  // Devuelve el token sin hashear para enviarlo al usuario por correo, por ejemplo
  return resetToken
}


//Export the model
module.exports = mongoose.model("User", userSchema);
