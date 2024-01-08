const { generateToken } = require('../config/jwtToken');
const User = require('../models/user.schema')
const asyncHandler = require('express-async-handler')

const createUser = asyncHandler(async(req, res) => {

    const email = req.body.email;

    const findUser = await User.findOne({email: email});

    if (!findUser) {
        // Create a new user
        const newUser = await User.create(req.body);
        res.json({
            message: 'User created successfully',
            user: newUser,
            success: true
        });
    }
    else{
        res.status(404).json({
            message: 'User already exists',
            success: false
        })
    }
})

const loginUserCtrl = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    // Check if user exist or not
    const findUser = await User.findOne({email});
    if (findUser){
        // Si el usuario existe, verifica la contraseña
        const isPasswordMatched = await findUser.isPasswordMatched(password);

        if(isPasswordMatched){
            // Contraseña válida, puedes generar un token de autenticación aquí si es necesario
            res.json({
                _id: findUser?._id,
                firstname: findUser?.firstname,
                lastname: findUser?.lastname,
                email: findUser?.email,
                mobile: findUser?.mobile, 
                token: generateToken(findUser?._id)   
            })
        }else{
            // Contraseña incorrecta 
            res.status(401).json({
                message: 'Incorrect password',
                success: false
            })
        }
    }else{
        // Usuario no encontrado
        res.status(404).json({
            message: 'User not found',
            success: false
        })
    }
})

module.exports = {createUser, loginUserCtrl}
