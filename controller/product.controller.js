const Product = require("../models/product.schema");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");

const createProduct = asyncHandler(async (req, res) => {
  if (req.body.title) {
    // Generar slug y normalizar eliminando duplicados de guiones
    req.body.slug = slugify(req.body.title, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
    }).replace(/-+/g, "-");
  }
  const newProduct = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product: newProduct,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const updatedProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
  });

  res.json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedProduct = await Product.findOneAndDelete({ _id: id });
  
    if (!deletedProduct) {
      // Si deletedProduct es null, significa que no se encontró el producto
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }
  
    res.json({
      success: true,
      deletedProduct,
    });
});

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const findProduct = await Product.findById(id);
  res.json(findProduct);
});

const getAllProduct = asyncHandler(async (req, res) => {

   // Filtro avanzado

  // Copia las propiedades de req.query a queryObj
  const queryObj = { ...req.query };

  // Elimina propiedades innecesarias que no deben usarse para filtrar en la base de datos
  const excludeFields = ["page", "sort", "limit", "fields"];
  excludeFields.forEach((el) => delete queryObj[el]);

  // Convierte las comparaciones (gte, gt, lte, lt) en formato adecuado para MongoDB
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Convierte la cadena JSON en un objeto para usarlo en la consulta
  let query = Product.find(JSON.parse(queryStr));

  // Ordenamiento

  // Verifica si hay una solicitud de ordenamiento
  if (req.query.sort) {
    // Divide las propiedades de ordenamiento y las une con un espacio para la consulta MongoDB
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    // Si no se especifica un orden, ordena por defecto por la fecha de creación en orden descendente
    query = query.sort('-createdAt');
  }

  // Limitación de campos

  // Verifica si se especifican campos específicos a devolver
  if (req.query.fields) {
    // Divide las propiedades de campos y las une con un espacio para la consulta MongoDB
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    // Si no se especifican campos, incluye todos los campos excepto __v
    query = query.select('-__v');
  }

  // pagination
  // Obitne la página actual, el límite y el índice del salto (skip)
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  // Aplica el índice de salto y el límite a la consulta
  query = query.skip(skip).limit(limit)

  // Si se especifica una página y el índice de salto supera la cantidad total de productos, devuelve un error
  if (req.query.page) {
    const productCount = await Product.countDocuments();
    if (skip >= productCount) {
      throw new Error('This Page does not exists')
    }
  }
  console.log(page, limit, skip);

  // Ejecuta la consulta y devuelve los resultados
  const products = await query;
  res.json(products);
});

module.exports = {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct
};
