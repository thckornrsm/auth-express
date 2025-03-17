const cors = require("cors");
const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const e = require("cors");

const app = express();
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:8888"],
  }),
);
app.use(cookieParser());

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

const port = 8000;
const secret = "mysecret";

let conn = null;

// function init connection mysql
const initMySQL = async () => {
  conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "tutorial",
    port: 8880
  });
};

/* เราจะแก้ไข code ที่อยู่ตรงกลาง */

app.post('/api/register', async (req, res) => {
  try{
    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10)
    const userData = {
      email,
      password: passwordHash
    }
    const [results] = await conn.query('INSERT INTO users SET ?', userData);
    res.json({ 
      message: 'Register success',
      results
    })
  } catch (error) {
    console.log('error',error)
    res.json({ 
      message: 'Register failed',
      error: error.message })
  }
});

app.post('/api/login', async (req, res) => {
  try{
    const { email, password } = req.body;
    const [results] = await conn.query('SELECT * FROM users WHERE email = ?', email);
    const userData = results[0];
    const match = await bcrypt.compare(password, userData.password)
    if(!match){
      res.status(400).json({ 
        message: 'Login failed wrong email or password',
        })
        return false
    }

    // const token = jwt.sign({ email, role: 'admin' }, secret, { expiresIn: '1h' });
    // res.cookie('token', token, {
    //   maxAge:300000,
    //   secure:true,
    //   httpOnly:true,
    //   sameSite:'None'
    // })

    req.session.userId = userData.id;
    req.session.user = userData;

    res.json({ 
      message: 'Login success',
    })
  } catch (error) {
    console.log('error',error)
    res.json({ 
      message: 'Login failed',
      error: error.message })
  }
});

app.get('/api/users', async (req, res) => {
  try{

      // const authToken = req.cookies.token;
      // console.log('authToken',authToken)
      // const user = jwt.verify(authToken, secret);
      // console.log('user',user)
    
    if(!req.session.userId){
      throw {message: 'Auth fail'}
    }
    console.log('req.session',req.session)
    console.log(req.sessionID)

    // const [checkResults] = await conn.query('SELECT * FROM users WHERE email = ?', [user.email]);
    // if(!checkResults[0]){
    //   throw {message: 'user not found'}
    // }

    const [results] = await conn.query('SELECT * FROM users');
    res.json({ 
      users: results[0]
    })

  } catch (error) {
    console.log('error',error)
    res.json({ 
      message: 'Authenticatin failled',
      error: error.message })
  }
});


// Listen
app.listen(port, async () => {
  await initMySQL();
  console.log("Server started at port 8000");
});