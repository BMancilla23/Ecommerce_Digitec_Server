const { generateToken } = require("../config/jwtToken");
const User = require("../models/user.schema");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshToken");
const crypto = require('crypto')
const jwt = require("jsonwebtoken");
const sendEmail = require("./email.controller");

const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;

  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    // Create a new user
    const newUser = await User.create(req.body);
    res.json({
      message: "User created successfully",
      user: newUser,
      success: true,
    });
  } else {
    res.status(404).json({
      message: "User already exists",
      success: false,
    });
  }
});

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exist or not
  const findUser = await User.findOne({ email });
  if (findUser) {
    // Si el usuario existe, verifica la contraseña
    const isPasswordMatched = await findUser.isPasswordMatched(password);

    if (isPasswordMatched) {
      
      // Contraseña váñida, genera un token de autenticación
      const refreshToken = await generateRefreshToken(findUser?._id)
      // Actualiza el usuario con el nuevo token de actualización
      const updateUser = await User.findByIdAndUpdate(findUser.id, {
        refreshToken: refreshToken
      }, {new: true})

      // Establece la cookie con el token de actualización
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000
      })

      res.json({
        _id: findUser?._id,
        firstname: findUser?.firstname,
        lastname: findUser?.lastname,
        email: findUser?.email,
        mobile: findUser?.mobile,
        token: generateToken(findUser?._id),
      });
    } else {
      // Contraseña incorrecta
      res.status(401).json({
        message: "Incorrect password",
        success: false,
      });
    }
  } else {
    // Usuario no encontrado
    res.status(404).json({
      message: "User not found",
      success: false,
    });
  }
});

// Handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  // Obtiene las cookies de la solicitud
  const cookie = req.cookies;

  // Verifica si existe un refreshToken en las cookies
  if (!cookie.refreshToken) {
    throw new Error('No refresh Token in Cookies');
  }

  // Obtiene el refreshToken de las cookies
  const refreshToken = cookie.refreshToken;

  // Busca al usuario correspondiente al refreshToken en la base de datos
  const user = await User.findOne({ refreshToken });

  // Verifica si se encontró un usuario
  if (!user) {
    throw new Error('No Refresh token present in db or not matched');
  }

  // Verifica la validez del refreshToken utilizando la clave secreta del JWT
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    // Verifica si hay un error o si el id del usuario no coincide con el id decodificado
    if (err || user.id !== decoded.id) {
      throw new Error('There is something wrong with refresh token');
    }

    // Si la verificación es exitosa, genera un nuevo accessToken y lo envía en la respuesta
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// Logout functionality
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;

  // Verifica si existe un refreshToken en las cookies
  if (!cookie?.refreshToken) {
    throw new Error('No Refresh Token in Cookies');
  }

  const refreshToken = cookie.refreshToken;

  // Busca al usuario correspondiente al refreshToken en la base de datos
  const user = await User.findOne({ refreshToken });

  if (!user) {
    // Si no se encuentra el usuario, limpia la cookie refreshToken y devuelve 204 (No Content)
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
    });
   res.sendStatus(204); // No Content
  }

  // Elimina el refreshToken del usuario en la base de datos
  await User.findOneAndUpdate({ refreshToken }, { refreshToken: '' });

  // Limpia la cookie refreshToken y devuelve 204 (No Content)
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // No Content
});

// Update a user
const updatedUser = asyncHandler(async (req, res) => {
  console.log(req.user);
  const { _id } = req.user;
  validateMongoDbId(_id);

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      firstname: req?.body?.firstname,
      lastname: req?.body?.lastname,
      email: req?.body?.email,
      mobile: req?.body?.mobile,
    },
    {
      new: true,
    }
  );

  res.json(updatedUser);
});

// Get all users
const getAllUser = asyncHandler(async (req, res) => {
  const getUsers = await User.find();
  res.json(getUsers);
});

// Get a single user
const getAUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id)

  const getAUser = await User.findById(id);
  res.json({
    getAUser,
  });
});

// Delete a single user
const deleteAUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const deleteAUser = await User.findOneAndDelete(id);
  res.json({
    deleteAUser,
  });
});

const blockUser = asyncHandler(async(req, res) => {
  const {id} = req.params;
  validateMongoDbId(id);
  const block = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: true,
    },
    {
      new: true
    }
  )
  res.json({
    message: "User Blocked"
  })
})

const unBlockUser = asyncHandler(async(req, res) => {
  const {id} = req.params;
  validateMongoDbId(id);
  const unblock = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: false,
    },
    {
      new: true
    }
  )
  res.json({
    message: "User Unblocked"
  })
})

const updatePassword = asyncHandler(async (req, res) => {
  const {_id} = req.user;
  const {password} = req.body;

  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword)
  }else{
    res.json(user)
  }
})

// Enviar token de restableciemiemnto de contraseña
const forgotPasswordToken = asyncHandler(async(req, res) => {

  // Extraer el correo electrónico de la solicitud
  const {email} = req.body;

  // Buscar un usuario con el correo electrónico proporcionado
  const user = await User.findOne({email})

  // Si no se encuentra el usuario, lanzar un error
  if (!user) {
    throw new Error('User not found whit this email')
  }

  // Crear un token de restablecimiento de contraseña y guardarlo en el usuario
  const token = await user.createPasswordResetToken();
  await user.save();

  // Construir la URL de restablecimiento con el token y un mensaje
  const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from new. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</a>`

  // Configura los detalles del correo electrónico
  const data = {
    to: email,
    text: "Hey User",
    subject: "Forgot Password Link",
    html: resetURL
  }

  // Enviar el correo electrónico	con el enlace de restablecimiento
  sendEmail(data)

  // Devuelve el token como respuesta
  res.json(token)
})

// Restablecer la contraseña utilizando un token
const resetPassword = asyncHandler(async (req, res) => {

  // Extraer la nueva contraseña de la solicitud
  const {password} = req.body;

  // Extraer el token de los parámetros de la solicitud
  const {token} = req.params;

  // Hashear el token para compararlo con el almacenado en la base de datos
  const hashedToken = crypto.createHash('sha256').update(token).digest("hex")

  // Buscar un usuario con el token de restablecimiento válido
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {$gt: Date.now()}
  })

  // Si no se encuentra un usuario, lanzar un error indicando que el token ha caducado
  if (!user) {
    throw new Error("Token Expired, Please try again later");
  }

  // Actualizar la contraseña del usuario con la nueva contraseña proporcionada
  user.password = password;

  // Limpiar los campos relacionadaos con el restablecimiento de contraseña
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Guardar los cambios en la base de datos
  await user.save();

  // Devolver el usuario actualziado como respuesta
  res.json(user)
})

module.exports = {
  createUser,
  loginUserCtrl,
  getAllUser,
  getAUser,
  deleteAUser,
  updatedUser,
  blockUser,
  unBlockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword
};


