const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const ejs = require("ejs");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
require('dotenv').config();



const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());
  // Serve static files from the 'uploads' directory
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(__dirname + '/public'));
// MongoDB connection
// var connectionKey = 'mongodb://127.0.0.1:27017/zapGearECommerceDB'


// const { MongoClient, ServerApiVersion } = require('mongodb');
const dbHost = process.env.DB_HOST;


 


mongoose.connect(dbHost);
const db = mongoose.connection;

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB database!');
});
// Middleware for EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));




// Passport.js configuration
app.use(require('express-session')({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: email }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (user.password !== password) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// Google OAuth
passport.use(new GoogleStrategy({
    clientID: 'google-client-id',
    clientSecret: 'google-client-secret',
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({ googleId: profile.id }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
            const newUser = new User({ googleId: profile.id });
            newUser.save((err) => {
                if (err) return done(err);
                return done(null, newUser);
            });
        } else {
            return done(null, user);
        }
    });
}));

// Facebook OAuth
passport.use(new FacebookStrategy({
    clientID: 'facebook-client-id',
    clientSecret: 'facebook-client-secret',
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({ facebookId: profile.id }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
            const newUser = new User({ facebookId: profile.id });
            newUser.save((err) => {
                if (err) return done(err);
                return done(null, newUser);
            });
        } else {
            return done(null, user);
        }
    });
}));








const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/') // Specify the directory where you want to store the files
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // Use the original filename for the uploaded file
    }
  });
  
  const upload = multer({ storage: storage });

// Schema definitions
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  address: String,
  phone_number: String
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  productName: String,
  productImage: String,
  productPrice: Number,
  productDescription: String,
  productQuantity: Number,
  productCategory: String
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    date_time: { type: Date, default: Date.now },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productPrice: Number,
    username: String,
    phone_number: Number,
    address: String,
    order_status: { type: Boolean, default: false } // 0 for unchecked, 1 for checked
  });
  
  orderSchema.pre('save', async function(next) {
    try {
      const user = await User.findById(this.user_id);
      if (user) {
        this.username = user.username;
        this.phone_number = user.phone_number;
        this.address = user.address;
      }
      next();
    } catch (error) {
      next(error);
    }
  });
  
  const Order = mongoose.model('Order', orderSchema);

  
// Routes
// app.post('/createUser', async (req, res) => {
//   try {
//     const newUser = new User(req.body);
//     await newUser.save();
//     res.status(201).send(newUser);
//   } catch (error) {
//     res.status(400).send(error.message);
//   }
// });

// app.post('/createProduct', async (req, res) => {
//   try {
//     const newProduct = new Product(req.body);
//     await newProduct.save();
//     res.status(201).send(newProduct);
//   } catch (error) {
//     res.status(400).send(error.message);
//   }
// });

app.post('/createOrder', async (req, res) => {
  try {
    const { product_id, user_id, username, phone_number, address, price } = req.body;
    const newOrder = new Order({
      product_id,
      user_id,
      username,
      phone_number,
      address,
      price
    });
    await newOrder.save();
    // Code to integrate with Flutterwave API for payment goes here
    app.get('/payment-callback', async (req, res) => {
      if (req.query.status === 'successful') {
          const transactionDetails = await Transaction.find({ref: req.query.tx_ref});
          const response = await flw.Transaction.verify({id: req.query.transaction_id});
          if (
              response.data.status === "successful"
              && response.data.amount === transactionDetails.amount
              && response.data.currency === "NGN") {
              // Success! Confirm the customer's payment
              newOrder.order_status = true;
              await newOrder.save();
              res.status(201).send(newOrder);
          } else {
              // Inform the customer their payment was unsuccessful
          }
      }
    });
    // Upon successful payment, mark order as checked (order_status = 1)

   
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Example route to handle form submissions for product info
// app.post('/submitProductForm', async (req, res) => {
//   try {
//     const newProduct = new Product(req.body);
//     await newProduct.save();
//     res.status(201).send(newProduct);
//   } catch (error) {
//     res.status(400).send(error.message);
//   }
// });
app.get("/admin", function (req, res){
  res.render("anotheradmin")
})

// Example route to handle form submissions for user info
app.post('/submitUserForm', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).send(newUser);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
app.post('/submitProductForm', upload.single('productImage'), async (req, res) => {
    try {
      const { productName, productPrice, productDescription, productQuantity, productCategory } = req.body;
      const productImage = req.file.originalname;

      const newProduct = new Product({
        productName,
        productImage: "/uploads/"+ productImage,
        productPrice: parseFloat(productPrice), // Convert price to number
        productDescription,
        productQuantity: parseInt(productQuantity), // Convert quantity to number
        productCategory
      });
  
      // Save the product to the database
      await newProduct.save();
      console.log("product saved successfully");
      res.redirect("/admin")
    } catch (error) {
      res.status(400).send(error.message);
    }
  });
// Routes
app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { successRedirect: '/profile', failureRedirect: '/login' }));

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/profile', failureRedirect: '/login' }));

app.get('/profile', (req, res) => {
    res.send('Welcome ' + req.user.email);
});



app.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    
    res.render('index', { products });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/productPage", async function(req, res) {
  try {
      var id = req.query.id;

      
      var foundProduct = await Product.findOne({ _id: id });
      if (foundProduct) {
          return res.render('product-page', { product: foundProduct });
      } else {
        res.redirect("/");
          return res.status(404).send('Product not found');
      }
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).send('Internal server error');
  }
});
// Route to handle getProduct request
app.get("/addProductToCart", async function(req, res) {
  const productId = req.query.productId;
  // Find product by productId
  var addedProduct = await Product.findOne({ _id: productId });

  if (addedProduct) {
    return  res.json(addedProduct);
} else {
  console.log("product to be added not found")
}
  
});








const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
