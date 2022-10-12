const Sequelize = require('sequelize');
const { STRING, ARRAY, FLOAT } = Sequelize;
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_reservation_db');

const syncAndSeed = async()=> {
  await conn.sync({ force: true });

  let restaurants = [
    {
      name: "Raos",
      location: [-73.932, 40.7940]
    },
    {
      name: "Masa",
      location: [-73.980, 40.7685]
    },
    {
      name: "Bouley",
      location: [-74.01394, 40.705137]
    },
    {
      name: "Marc Forgione",
      location: [-74.009567, 40.716526]
    },
    {
      name: "Tamarind",
      location: [-74.008929, 40.718977]
    },
    {
      name: "Hop Lee Restaurant",
      location: [-73.998509, 40.71423]
    },
    {
      name: "Jungsik",
      location: [-74.0089, 40.718679]
    },
    {
      name: "The Capital Grille",
      location: [-74.010846, 40.708475]
    },
    {
      name: "Pylos",
      location: [-73.984152, 40.726096]
    },
    {
      name: "Joe's Shanghai",
      location: [-73.997761, 40.714601]
    },
    {
      name: "Cafe Katja",
      location: [-73.990565, 40.717719]
    },
    {
      name: "Rosanjin",
      location: [-74.007724, 40.716403]
    },
    {
      name: "Kittichai",
      location: [-74.003242, 40.724014]
    },
    {
      name: "Bianca Restaurant",
      location: [-73.992662, 40.725495]
    },
    {
      name: "Rayuela",
      location: [-73.989756, 40.721266]
    },
    {
      name: "Mas Farmhouse",
      location: [-74.003875, 40.729269]
    },
    {
      name: "Xe Lua",
      location: [-73.998626, 40.716544]
    }
  ];

  restaurants = await Promise.all(restaurants.map( restaurant => Restaurant.create(restaurant)));

  restaurants = restaurants.reduce( (acc, restaurant) => {
    acc[restaurant.name] = restaurant;
    return acc;
  }, {}); 

  let users = await Promise.all(['moe', 'lucy', 'larry'].map( name => User.create({ name })));
  users = users.reduce( (acc, user) => {
    acc[user.name] = user;
    return acc;
  }, {});

  const reservations = await Promise.all([
    Reservation.create({ userId: users.moe.id, restaurantId: restaurants.Tamarind.id}),
    Reservation.create({ userId: users.lucy.id, restaurantId: restaurants.Tamarind.id}),
    Reservation.create({ userId: users.lucy.id, restaurantId: restaurants.Rayuela.id})
  ]);
  return {
    users,
    restaurants,
    reservations
  };

};

const User = conn.define('user', {
  name: {
    type: STRING
  }
});
const Reservation = conn.define('reservation', {});
const Restaurant = conn.define('restaurant', {
  name: {
    type: STRING
  },
  location: {
    type: ARRAY(FLOAT),
    defaultValue: []
  }
});

Reservation.belongsTo(User);
Reservation.belongsTo(Restaurant);

const express = require('express');
const app = express();
const path = require('path');


app.use(express.json());

app.use('/dist', express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res, next)=> res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/users', async(req, res, next)=> {
  try {
    res.send(await User.findAll());
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/restaurants', async(req, res, next)=> {
  try {
    res.send(await Restaurant.findAll());
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:userId/reservations', async(req, res, next)=> {
  try {
    res.send(await Reservation.findAll({ where: { userId: req.params.userId }}));
  }
  catch(ex){
    next(ex);
  }
});

app.post('/api/users/:userId/reservations', async(req, res, next)=> {
  try {
    res.status(201).send(await Reservation.create({ userId: req.params.userId, restaurantId: req.body.restaurantId}));
  }
  catch(ex){
    next(ex);
  }
});

app.delete('/api/reservations/:id', async(req, res, next)=> {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    await reservation.destroy();
    res.sendStatus(204);
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err.stack);
  res.status(500).send({ error: err.message });
});
const port = process.env.PORT || 3000;

const init = async()=> {
  await syncAndSeed();
  app.listen(port, ()=> console.log(`listening on port ${port}`));
}

init();