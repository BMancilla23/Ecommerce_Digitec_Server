const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");

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
      refreshToken: {
        type: String,
      }
    },
    {
      // Configuración adicional del esquema
      timestamps: true, // Agrega campos de 'createdAt' y 'updatedAt' automáticamente
    }
  );

// Define un hook 'pre' que se ejecutará antes de que se guarde un documento en la base de datos
userSchema.pre("save", async function (next) {
  // Genera un 'salt' para la encriptación utilizando bcrypt
  const salt = await bcrypt.genSaltSync(10);

  // Hashea el password del usuario usando el 'salt' generado
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Define un método en el modelo de usuario para verificar si la contraseña coincide
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  // Compara la contraseña proporcionada con la contraseña almacenada
  return await bcrypt.compare(enteredPassword, this.password);
};

//Export the model
module.exports = mongoose.model("User", userSchema);
