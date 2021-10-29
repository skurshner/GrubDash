const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Validation middleware
const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
};

const orderIdMatches = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (!id || orderId === id) {
    next();
  } else {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
};

const hasValidStatusForUpdate = (req, res, next) => {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery"];
  if (!status || !validStatus.includes(status)) {
    next({
      status: 400,
      message: `Order must have a valid status.`,
    });
  }
  next();
};

const hasValidStatusForDelete = (req, res, next) => {
  const { status } = res.locals.order;
  if (status !== "pending") {
    next({
      status: 400,
      message: `Order must have status 'pending' to delete.`,
    });
  }
  next();
};

const hasDeliverTo = (req, res, next) => {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo && deliverTo.length > 0) {
    next();
  }
  next({ status: 400, message: "A 'deliverTo' property is required." });
};

const hasMobileNumber = (req, res, next) => {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber && mobileNumber.length > 0) {
    next();
  }
  next({ status: 400, message: "A 'mobileNumber' property is required." });
};

const hasDishes = (req, res, next) => {
  const { data: { dishes } = {} } = req.body;

  if (dishes && Array.isArray(dishes) && dishes.length > 0) {
    next();
  }
  next({ status: 400, message: "A 'dishes' property is required." });
};

const hasQuantity = (req, res, next) => {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach(({ quantity }, index) => {
    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
};

// CRUD Functions
const list = (req, res, next) => {
  res.json({ data: orders });
};

const read = (req, res) => {
  res.json({ data: res.locals.order });
};

const create = (req, res) => {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

const update = (req, res, next) => {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  Object.assign(order, {
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status,
  });

  res.json({ data: order });
};

const destroy = (req, res, next) => {
  const { orderId } = req.params;
  const index = orders.findIndex(order => order.id === orderId);
  orders.splice(index, 1);

  res.sendStatus(204);
};

module.exports = {
  list,
  read: [orderExists, read],
  create: [hasDeliverTo, hasMobileNumber, hasDishes, hasQuantity, create],
  update: [
    orderExists,
    orderIdMatches,
    hasValidStatusForUpdate,
    hasDeliverTo,
    hasMobileNumber,
    hasDishes,
    hasQuantity,
    update,
  ],
  delete: [orderExists, hasValidStatusForDelete, destroy],
};
