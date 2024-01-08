const { generateToken } = require("../config/jwtToken");
const User = require("../models/user.schema");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshToken");
const jwt = require("jsonwebtoken")

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

module.exports = {
  createUser,
  loginUserCtrl,
  getAllUser,
  getAUser,
  deleteAUser,
  updatedUser,
  blockUser,
  unBlockUser,
  handleRefreshToken
};
