//mongoose file must be loaded before all other files in order to provide
// models to other modules
const express = require('express'),
  router = express.Router(),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  swaggerUi = require('swagger-ui-express'),
  swaggerDocument = require('./swagger/swagger.json');

const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  devConfig = require('./config/dev-config')

const port = process.env.PORT || 3000;

mongoose.connect(
    devConfig.Mongodb.connectionString,
    { 
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, 
    (err) => {
      if(err){
        console.log(err);
      }
      console.log(`Connected to remote MongoDB at ${devConfig.Mongodb.connectionString}`);
    }
);

const UserSchema = new Schema({
  email: {
    type: String, required: true,
    trim: true, unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  firstName: {type: String},
  lastName: {type: String},
  password: String
});

mongoose.model('User', UserSchema);
const User = require('mongoose').model('User');

const app = express();

//enable cors
app.use(cors());

//rest API requirements
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//middleware for create
const createUser = function (req, res, next) {
  const user = new User(req.body);

  user.save(function (err) {
    if (err) {
      next(err);
    } else {
      res.json(user);
    }
  });
};

const updateUser = function (req, res, next) {
  User.findByIdAndUpdate(req.body._id, req.body, {new: true}, function (err, user) {
    if (err) {
      next(err);
    } else {
      res.json(user);
    }
  });
};

const deleteUser = function (req, res, next) {
  req.user.remove(function (err) {
    if (err) {
      next(err);
    } else {
      res.json(req.user);
    }
  });
};

const getAllUsers = function (req, res, next) {
  User.find(function (err, users) {
    if (err) {
      next(err);
    } else {
      res.json(users);
    }
  });
};

const getOneUser = function (req, res) {
  res.json(req.user);
};

const getByIdUser = function (req, res, next, id) {
  User.findOne({_id: id}, function (err, user) {
    if (err) {
      next(err);
    } else {
      req.user = user;
      next();
    }
  });
};

router.route('/ping')
  .get((req, res) => {
    res.json({message: "API is active"})
  })

router.route('/users')
  .post(createUser)
  .get(getAllUsers);

router.route('/users/:userId')
  .get(getOneUser)
  .put(updateUser)
  .delete(deleteUser);

router.param('userId', getByIdUser);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', router);

app.listen(port);
module.exports = app;

