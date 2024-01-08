const User = require('../models/user.schema');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Middleware de autorización para verificar el token JWT
const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;

    // Verifica si la cabecera Authorization comienza con 'Bearer'
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        // Extrae el token de la cabecera Authorization
        token = req.headers.authorization.split(" ")[1];

        try {
            // Verifica y decodifica el token usando la clave secreta JWT
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Consulta la base de datos para obtener información completa del usuario
                const user = await User.findById(decoded?.id);
                // Almacena la información del usuario en la solicitud para su uso posterior
                req.user = user;
                next();
            }
        } catch (error) {
            // Captura errores de verificación del token (por ejemplo, token expirado)
            throw new Error('Not Authorized: Token expired or invalid, please log in again');
        }
    } else {
        // Si no hay un token en la cabecera Authorization
        throw new Error('Not Authorized: No token attached to the header');
    }
});

// Middleware para verificar si el usuario es un administrador
const isAdmin = asyncHandler(async (req, res, next) => {

    // Extrae el email del usuario desde la información almacenada en la solicitud
    const { email } = req.user;

    // Busca al usuario en la base de datos por su email
    const adminUser = await User.findOne({ email });

    // Comprueba si el rol del usuario es 'admin'
    if (adminUser.role !== 'admin') {
        // Si no es administrador, lanza un error
        throw new Error('You are not admin');
    } else {
        // Si es administrador, permite el acceso
        next();
    }
});

module.exports = { authMiddleware, isAdmin };
