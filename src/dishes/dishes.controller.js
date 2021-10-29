const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));

// Assigns new IDs
const nextId = require("../utils/nextId");

// Validation middleware
const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${req.params.dishId}`,
  });
};

const dishIdMatches = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  (!id || dishId === id) && next();
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`,
  });
};

const hasName = (req, res, next) => {
  const { data: { name } = {} } = req.body;
  name && next();
  next({ status: 400, message: "A 'name' property is required." });
};

const hasDescription = (req, res, next) => {
  const { data: { description } = {} } = req.body;
  description && next();
  next({ status: 400, message: "A 'description' property is required." });
};

const hasPrice = (req, res, next) => {
  const { data: { price } = {} } = req.body;
  price && typeof price === "number" && price > 0 && next();
  next({ status: 400, message: "A 'price' property is required." });
};

const hasImage = (req, res, next) => {
  const { data: { image_url } = {} } = req.body;
  image_url && next();
  next({ status: 400, message: "An 'image_url' property is required." });
};

// CRUD functions
const list = (req, res, next) => {
  res.json({ data: dishes });
};

const read = (req, res) => {
  res.json({ data: res.locals.dish });
};

const create = (req, res) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

const update = (req, res, next) => {
  let dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  // Object.assign(dish, {
  //   name: name,
  //   description: description,
  //   price: price,
  //   image_url: image_url,
  // });
  dish = { ...dish, name, description, price, image_url };
  res.json({ data: dish });
};

module.exports = {
  list,
  read: [dishExists, read],
  create: [hasName, hasDescription, hasPrice, hasImage, create],
  update: [
    dishExists,
    dishIdMatches,
    hasName,
    hasDescription,
    hasPrice,
    hasImage,
    update,
  ],
};
