// Middleware para manejar solicitudes a rutas no encontradas (404)
const notFound = (req, res, next) => {
    // Crear un nuevo error con un mensaje detallado que incluye la URL original no encontrada
    const error = new Error(`Not Found: ${req.originalUrl}`);
    
    // Establecer el código de estado HTTP en 404 (Not Found)
    res.status(404);
    
    // Pasar el error al siguiente middleware en la cadena de manejo de solicitudes
    next(error);
};

// Middleware para manejar errores generales en la aplicación
const errorHandler = (err, req, res, next) => {
    // Determinar el código de estado HTTP a devolver, utilizando 500 si no se especifica otro código
    const statusCode = res.statusCode == 200 ? 500 : res.statusCode;
    
    // Establecer el código de estado de la respuesta
    res.status(statusCode);
    
    // Enviar una respuesta JSON con detalles del error
    res.json({
        message: err?.message,  // Mensaje de error, si está presente
        stack: err?.stack       // Pila de llamadas del error, si está presente
    });
};

// Exportar los middlewares para su uso en otros archivos
module.exports = { errorHandler, notFound };

