const express = require('express');

const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const ejs = require("ejs");
const nodemailer = require('nodemailer');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const flash = require('express-flash');
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);



const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());

app.use(bodyParser.json());
  // Serve static files from the 'uploads' directory
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(__dirname + '/public'));

  app.use(session({
    secret: 'ahbhrfbrgybvbryvgiurbvaruirbvbrh', // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));


 


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
  User.findOne({ email: email })
  .then(user => {
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (user.password !== password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    user.isLoggedIn = true;
    return user.save();
  })
  .then(savedUser => {
    const userData = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      cartList: savedUser.cartList,
      cartListBtnIdList: savedUser.cartListBtnIdList,
      itemQty: savedUser.itemQty
    };
    return done(null, userData);
  })
  .catch(err => {
    return done(err);
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
  _id: { type: String, required: true},
  password: String,
  googleId: String,
  facebookId: String,
  address: String,
  phone_number: String,
  isLoggedIn: Boolean,
  isAdmin: Boolean,
  firstName: String,
  lastName: String,
  cartList: [{
    price: Number,
    qty: Number,
    name: String,
    img: String,
    _id: String,
    // Other relevant properties
  }],
  cartListBtnIdList: [String],
  itemQty: [Number],
  resetToken: { type: String, default: null },
  resetTokenExpiration: { type: Date, default: null }},
   { timestamps: true }
);
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
    _id: String,
    //product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    user_id:  { type: String, ref: 'User', required: true },
    productPrice: Number,
    username: String,
    phone_number: String,
    address: String,
    price: Number,
    cartList: [{
      price: Number,
      qty: Number,
      name: String,
      img: String,
      _id: String,
      // Other relevant properties
    }],
    cartListBtnIdList: [String],
    itemQty: [Number],
    order_status: { type: Boolean, default: false } // 0 for unchecked, 1 for checked
  });
  
  orderSchema.pre('save', async function(next) {
    try {
      const user = await User.findById(this.user_id);
      if (user) {
        this.username = user.username;
        this.phone_number = user.phone_number;
        this.address = user.address;
        this.cartList = user.cartList;
        this.itemQty = user.itemQty;
      }
      next();
    } catch (error) {
      next(error);
    }
  });
  
  const Order = mongoose.model('Order', orderSchema);

  let otpData = {
    otp: null,
    generatedAt: null,
    userEmail: ''
  };
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Random number between 100000 and 999999
  };
  function startTimer() {
    let timeLeft = 600; // 10 minutes in seconds
  
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            otp = generateOTP(); // Generate new OTP
            return;
        }
        // console.log(`Time left: ${timeLeft} seconds`);
        timeLeft--;
    }, 1000); // Update timer every second
  };
  
  async function sendOtp(userEmail) {
    const otp = generateOTP();
    startTimer();
    const hashedOtp = await bcrypt.hash(otp, 10);
    console.log('first hashotp is ' + hashedOtp);
    otpData = {
        otp: hashedOtp,
        generatedAt: Date.now(),
        userEmail 
    };
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD
      }
  });

  // Send mail with defined transport object
  let mailOptions = {
      from: '"Zap Gear" <chizitelun@gmail.com>',
      to: userEmail,
      subject: 'Otp Verification',
      text: ` Your OTP verifiation for zapgear signup is ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.log('Error occurred:', error);
          // res.status(500).send('Failed to send reset email.');
      } else {
          console.log('Email sent:', info.response);
          // res.status(200).send('OTP sent successfully.');
      }
  });
   return hashedOtp
  }
// Function to check if OTP has expired
function isOTPOutdated() {
  // Check if otpData.generatedAt is not null and the difference between
  // current time and otpData.generatedAt is greater than 10 minutes (600,000 milliseconds)
  return otpData.generatedAt !== null && (Date.now() - otpData.generatedAt) > 600000;
}
function generateOrderId(email) {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
  const randomPin = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit pin
  return `${datePart}${timePart}-${email}-${randomPin}`;
}
var currentOrderId;
app.post('/createOrder', async (req, res) => {
  try {
    
    // try {
      // Find the user by email
      const userData = await User.findOne({ _id: req.body["createOrder-email"]});
  
      if (!userData) {
        return res.status(404).send('User not found');
      }
      const cartList = userData.cartList;
      const itemQty = userData.itemQty;
      let subtotal = 0; 
      let VAT = 110/100;
    for (let i = 0; i < itemQty.length; i++) { 
       subtotal += itemQty[i] * cartList[i].price; 
    } 
     currentOrderId = generateOrderId(userData._id);
     const Total = (subtotal * VAT).toFixed(2);
    const newOrder = new Order({
      _id: currentOrderId,
      user_id: userData._id,
      username: userData.firstName,
      phone_number: userData.phone_number,
      address: userData.address,
      price: Total,
      cartList: cartList,
      itemQty: itemQty
    });
    await newOrder.save();
    res.render("checkout-html", {userData, itemQty, cartList});
   
  } catch (error) {
    res.status(400).send(error.message);
  }
});
function generateTransactionReference() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${datePart}${timePart}-${randomPart}`;
}
app.post('/pay-for-order', async function(req, res){
 
  const orderData = await Order.findOne({ _id: currentOrderId });

  try {
      const response = await axios.post('https://api.flutterwave.com/v3/payments', {
          tx_ref: generateTransactionReference(),
          amount: orderData.price,
          currency: "NGN",
          redirect_url: 'http://localhost:3000/payment-callback', // Replace with your callback URL
          customer: {
            email: orderData.user_id,
            phonenumber: orderData.phone_number,
            name: orderData.username,
            firstname: orderData.username
        },
        customizations: {
            title: "ZapGear Payments",
            logo: "http://www.piedpiper.com/app/themes/joystick-v27/images/logo.png"
        }
      }, {
          headers: {
              'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`, // Replace with your secret key
              'Content-Type': 'application/json',
          },
      });
      if (response.data && response.data.data && response.data.data.link) {
       // res.json({ paymentLink: response.data.data.link  });
        res.redirect(response.data.data.link);
    } else {
        console.error('Unexpected response format:', response.data);
        res.status(500).json({ error: 'Unexpected response format from Flutterwave' });
    }
    //  res.json({ paymentLink: response.data.data.link});
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create payment link' });
  }
  

});
  // Code to integrate with Flutterwave API for payment goes here
  app.get('/payment-callback', async (req, res) => {
    const { status, transaction_id } = req.query;

    if (status === 'successful') {
       
    
    axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: {
          'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`, // Replace with your secret key
          'Content-Type': 'application/json',
      },
  }).then(async response  => {
      // Handle successful payment
      const orderData = await Order.findOne({ _id: currentOrderId });
        
      orderData.order_status = true;
      await orderData.save();
     const userId = await User.findOne({_id: orderData.user_id});
     userId.cartList = [];
     userId.cartListBtnIdList = [];
     userId.itemQty = [];
     await userId.save();
      // Redirect to success page or perform any required actions
      res.redirect('http://localhost:3000/?success=payment-success'); // Replace with your success URL
  }).catch(error => {
      console.error(error);
      // Handle verification error
      res.redirect('http://localhost:3000/?message=verification-failure'); // Replace with your failure URL
  });
} else {
  // Handle failed or canceled payment
  res.redirect('http://localhost:3000/?message=payment-failure'); // Replace with your failure URL
}
  });
  // Upon successful payment, mark order as checked (order_status = 1)

app.get("/admin", function (req, res){
  res.render("anotheradmin")
})

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



app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ _id:email });

    if (!user) {
      return res.status(401).json({ message: 'User does not exist!' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Wrong password!' });
    }

    const userData = {
      cartList: user.cartList,
      cartListBtnIdList: user.cartListBtnIdList,
      itemQty: user.itemQty,
      firstName: user.firstName,
      _id: user._id
    };
    req.session.userData = userData;
    
    res.redirect("/");
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get("/signup", function(req, res){


  res.render("signup");
});


app.post('/signup', async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      address,
      zipCode,
      state,
      country,
      phoneNumber,
      isLoggedIn,
      firstName,
      lastName, 
      cartList, 
      cartListBtnIdList, 
      itemQty} = req.body ;
    

    console.log("cartList: ", JSON.parse(cartList));
    console.log("cartListBtnIdList: ", JSON.parse(cartListBtnIdList));
    console.log("itemQty: ", JSON.parse(itemQty));
    console.log("firstName: ", firstName);

    if (password && password === confirmPassword) {
       const hashedPassword = await bcrypt.hash(password, 10);
      if (cartList && firstName) {
        // Data is complete, proceed with creating the user
        (async () => {
          try {
            const hashedOtp = await sendOtp(email);
            console.log('Hashed OTP:', hashedOtp);
            // Do something with hashed OTP
                    
        res.render("otp-page", {
          email,
          password: hashedPassword,
          address,
          zipCode,
          state,
          country,
          phoneNumber,
          isLoggedIn,
          firstName,
          lastName,
          cartList,
          cartListBtnIdList,
          itemQty,
          hashedOtp
      });
          } catch (error) {
            console.error('Error occurred:', error);
            // Handle error if needed
          }
        })();
      

      
      } else {
        // Data is incomplete, respond with error
        res.redirect("/signup?message=Incomplete data received");
      }
    } else {
      res.redirect("/signup?message=Password Does Not Match!");
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post("/verify-otp", async function(req, res){
  const { otp1, otp2, otp3, otp4, otp5, otp6, hashedOtp} = req.body; 
   //const  = req.session.hashedOtp;
 const enteredOTP = otp1.toString() + otp2.toString() + otp3.toString() + otp4.toString() + otp5.toString() + otp6.toString();
 console.log('ntr is '+enteredOTP)
 console.log('hash is '+hashedOtp)
 const otpMatch = await bcrypt.compare(enteredOTP, hashedOtp);
 if (!otpMatch) {
  return res.status(400).send('Invalid OTP. Please try again.')
}
if (isOTPOutdated()) {
  return res.status(400).send('OTP has expired. Please generate a new OTP.');
}
    const {
      email,
      password,
      address,
      zipCode,
      state,
      country,
      phoneNumber,
      isLoggedIn,
      firstName,
      lastName,
      cartList,
      cartListBtnIdList,
      itemQty
  } = req.body;

  const newUser = await new User({
    _id: email,
    password,
    address,
    zipCode,
    state,
    country,
    phoneNumber,
    isLoggedIn: true,
    isAdmin: false,
    firstName,
    lastName,
    cartList:JSON.parse(JSON.parse(cartList)),
    cartListBtnIdList: JSON.parse(JSON.parse(cartListBtnIdList)),
    itemQty: JSON.parse(JSON.parse(itemQty))
  });
  await newUser.save();
  res.redirect("/login?success=User created successfully! Please login.");
 

});
app.post("/resend-otp", async function(req, res){
  let data = req.body;
  console.log(req.body)
console.log("the data: ", data)
  
 const hashedOtp = await sendOtp(data.email);
 console.log('resent Hashed OTP:', hashedOtp);
  
 res.render("otp-page", {
  email: data.email,
  password: data.password,
  address: data.address,
  zipCode: data.zipCode,
  state: data.state,
  country: data.country,
  phoneNumber: data.phoneNumber,
  isLoggedIn: data.isLoggedIn,
  firstName: data.firstName,
  lastName: data.lastName,
  cartList: JSON.parse(data.cartList),
  cartListBtnIdList: JSON.parse(data.cartListBtnIdList),
  itemQty: JSON.parse(data.itemQty),
  hashedOtp: hashedOtp
});
});

app.get("/forgot-password", function (req, res){
  res.render("email-password-reset");
})
app.post('/forgot-password', async (req, res) => {
  const userEmail = req.body.passwordResetEmail;

  try {
      // Check if the email exists in the database
      const user = await User.findOne({_id: userEmail });
      if (!user) {
          return res.status(404).send('User not found.');
      }

      // Generate a unique reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      // Set the token and expiration date in the user document
      user.resetToken = resetToken;
      user.resetTokenExpiration = Date.now() + 600000; // Token expires in 10 mins

      // Save the user document with the new reset token
      await user.save();

      // Send password reset email
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

      // Create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: 'chizitelun@gmail.com',
              pass: 'bity susm frvk dlmh'
          }
      });

      // Send mail with defined transport object
      let mailOptions = {
          from: '"Zap Gear" <chizitelun@gmail.com>',
          to: userEmail,
          subject: 'Password Reset',
          text: `You requested a password reset. Click on the following link to reset your password: ${resetLink}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log('Error occurred:', error);
              res.status(500).send('Failed to send reset email.');
          } else {
              console.log('Email sent:', info.response);
              res.status(200).send('Password reset link sent to '+userEmail+' successfully. This reset link is only valid for 10 minutes!');
          }
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal server error.');
  }
});
app.get("/reset-password", function (req, res){
  const token =req.query.token;
  res.render("reset-password", {token: token})
})
app.post('/reset-password', async (req, res) => {
  const { newPassword, confirmNewPassword, token } = req.body;
  
if (newPassword === confirmNewPassword) {
  try {
    // Find user by reset token
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
   
    if (!user) {
      console.log('tokn no usr is '+token);
        return res.status(400).send('Invalid or expired reset token.');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Reset token is valid, update user's password
    user.password = hashedPassword;
    // Clear reset token and expiration
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    // Save the updated user document
    await user.save();

    res.redirect("/login?success=Password reset successfully.")
} catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error.');
};
  
};
  
});
app.post('/save-user-data', async (req, res) => {
  const {
    useremail,
    cartList,
    cartListBtnIdList,
    itemQty
  } = req.body;
  console.log("got stuff from mail: ", useremail);
  console.log("i got ", cartList);
  try {
    // Find the user by email
     console.log("i gottn ", useremail);
    const user = await User.findOne({ _id: useremail });

   
    console.log("list ", user);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Log the details
    console.log("i gottn ", useremail);
    console.log("list ", cartList);
    console.log("btn ", cartListBtnIdList);

    // Update the user's cartList, cartListBtnIdList, and itemQty
    user.cartList = cartList;
    user.cartListBtnIdList = cartListBtnIdList;
    user.itemQty = itemQty;

    // Log the updated list
    console.log("us list ", user.cartList);

    // Save the updated user document
    await user.save();

    // Log save confirmation
    console.log("sav");

    res.json({ message: 'User data updated successfully.' });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

passport.use(new GoogleStrategy({
  clientID: 'your_google_client_id',
  clientSecret: 'your_google_client_secret',
  callbackURL: 'http://localhost:3000/auth/google/callback' // Update with your callback URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists in the database
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value, // Get user's email
        phoneNumber: profile.phoneNumber || '', // Set phone number to empty if not available
        address: profile.address || '', // Set address to empty if not available
        // You can add more fields here as needed
      });
      await user.save();
    }

    // Pass the user object to the next middleware
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);



// app.get('/profile', (req, res) => {
//     res.send('Welcome ' + req.user.email);
// });



app.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    


const userDataString = req.session.userData; 
let userData; 
if (userDataString) { 
    try {
        userData = userDataString;
    } catch (error) {
        console.error('Error parsing userData:', error);
        userData = null;
    }
} else {
    userData = null;
}

    res.render('index', { products, userData });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/productPage", async function(req, res) {
  try {
      var id = req.query.id;

      
      var foundProduct = await Product.findOne({ _id: id });
      if (foundProduct) {
        const userDataString = req.session.userData; 
let userData; 
if (userDataString) { 
    try {
        userData = userDataString;
    } catch (error) {
        console.error('Error parsing userData:', error);
        userData = null;
    }
} else {
    userData = null;
}
          return res.render('product-page', { product: foundProduct, userData });
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
