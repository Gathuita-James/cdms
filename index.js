const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { validationResult } = require("express-validator");
const { insertData } = require("./modules/insertIntoDb");
const validateForm = require("./modules/validation");
const { checkEmailExistence } = require("./modules/checkEmail.js");
const mysql = require('mysql2');

// Initialize Express app
const app = express();

// Create server and socket.io instance after app initialization
const server = http.createServer(app);
const io = socketIo(server);

// Middleware setup
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set static file directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To handle JSON request bodies
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'images' folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Check if email exists endpoint
app.post("/check-email-existence", async (req, res) => {
  const { email } = req.body;
  try {
    const exists = await checkEmailExistence(email);
    res.json({ exists });
  } catch (err) {
    res.status(500).json({ error: "Error checking email existence" });
  }
});

// Form submission endpoint
app.post("/submit-form", validateForm, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  } else {
    const { name, email, password } = req.body;
    try {
      const results = await insertData(name, email, password);
      res.status(200).json({ success: true, message: 'Data inserted successfully', results });
    } catch (err) {
      res.status(500).json({ success: false, error: err });
    }
  }
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Admin.html'));
});
app.get("/testing", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'testing.html'));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'designPage.html'));
});

// Set up MySQL connection
const db = mysql.createPool({
  host: 'localhost',      // MySQL host
  user: 'root',           // MySQL user
  password: '',           // MySQL password
  database: 'cardealership' // MySQL database name
});

// Route to fetch all cars data
app.get('/cars', (req, res) => {
  db.query('SELECT * FROM cars', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars data by brand
app.get('/brand/:brand', (req, res) => {
  const brand = req.params.brand;

  db.query('SELECT * FROM cars WHERE brand = ?', [brand], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars data by model
app.get('/model/:model', (req, res) => {
  const model = req.params.model;

  db.query('SELECT * FROM cars WHERE model = ?', [model], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars data by year
app.get('/year/:year', (req, res) => {
  const year = parseInt(req.params.year, 10);

  if (isNaN(year)) {
    return res.status(400).json({ error: "Invalid year parameter" });
  }

  const query = `
    SELECT * FROM cars
    WHERE year = ?
    ORDER BY 
      CASE 
        WHEN year = ? THEN 0 
        ELSE 1 
      END, 
      price ASC;
  `;

  db.query(query, [year, year], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars by price
app.get('/price/:price', (req, res) => {
  const price = parseInt(req.params.price, 10);

  if (isNaN(price)) {
    return res.status(400).json({ error: "Invalid price parameter" });
  }

  let minPrice = 0;
  let maxPrice = price;

  if (price === 5000) {
    maxPrice = 10000;
  } else if (price === 1000000) {
    minPrice = 1000000;
  } else {
    minPrice = price - 5000;
    maxPrice = price + 5000;
  }

  const query = `
    SELECT * FROM cars
    WHERE price BETWEEN ? AND ?
    ORDER BY 
      CASE 
        WHEN price = ? THEN 0 
        ELSE 1 
      END, 
      price ASC;
  `;

  db.query(query, [minPrice, maxPrice, price], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars by mileage
app.get('/mileage/:mileage', (req, res) => {
  const mileage = parseInt(req.params.mileage, 10);

  if (isNaN(mileage)) {
    return res.status(400).json({ error: "Invalid mileage parameter" });
  }

  let minMileage = 0;
  let maxMileage = mileage;

  if (mileage === 5000) {
    maxMileage = 10000;
  } else if (mileage === 1000000) {
    minMileage = 1000000;
  } else {
    minMileage = mileage - 5000;
    maxMileage = mileage + 5000;
  }

  const query = `
    SELECT * FROM cars
    WHERE mileage BETWEEN ? AND ?
    ORDER BY 
      CASE 
        WHEN mileage = ? THEN 0 
        ELSE 1 
      END, 
      mileage ASC;
  `;

  db.query(query, [minMileage, maxMileage, mileage], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars by fuel type
app.get('/fuel/:fuel_type', (req, res) => {
  const fuel_type = req.params.fuel_type;

  const query = 'SELECT * FROM cars WHERE fuel_type = ?';

  db.query(query, [fuel_type], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars by transmission
app.get('/cars/:transmission', (req, res) => {
  const transmission = req.params.transmission;

  const query = 'SELECT * FROM cars WHERE transmission = ?';

  db.query(query, [transmission], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars
app.get('/all/', (req, res) => {
  const query = 'SELECT * FROM cars';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Route to fetch all cars by multiple criteria
app.get('/all', (req, res) => {
  const model = ['corolla', 'civic', 'c-class', 'malibu', 'optima', 'impreza', 'Elantra', 'A4'];
  const transmission = 'manual';
  const year = ['2019', '2020', '2021', '2022', '2023'];
  const fuel_type = 'Petrol';
  const brand = ['toyota', 'honda', 'ford', 'Nissan', 'Tesla', 'subaru', 'Audi', 'Kia'];
  const mileage = 15000;
  const price = 25000;

  const Maxrange = price + 10000;
  const Minrange = price - 10000;
  const pMaxrange = mileage + 1000;
  const pMinrange = mileage - 1000;

  const query = `
    SELECT * FROM cars 
    WHERE transmission = ? 
    AND model IN (?) 
    AND year IN (?) 
    AND fuel_type = ? 
    AND brand IN (?) 
    AND mileage BETWEEN ? AND ? 
    AND price BETWEEN ? AND ?`;

  db.query(query, [transmission, model, year, fuel_type, brand, pMinrange, pMaxrange, Minrange, Maxrange], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'images'); // Path to store the uploaded images
    fs.existsSync(dir) || fs.mkdirSync(dir);  // Ensure the directory exists
    cb(null, dir); // Set the destination folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp as filename
  }
});

const upload = multer({ storage: storage });

app.post('/addCar', upload.array('images', 5), (req, res) => {
    const { brand, model, year, price, mileage, fuel_type, transmission, color, carId } = req.body;
    const images = req.files.map(file => path.join('images', carId, file.filename));

    const sql = 'INSERT INTO cars (brand, model, year, price, mileage, fuel_type, transmission, color, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [brand, model, year, price, mileage, fuel_type, transmission, color, JSON.stringify(images)];

    db.query(sql, values, (err, result) => {
        if (err) throw err;
        io.emit('carAdded', { id: result.insertId, brand, model, year, price, mileage, fuel_type, transmission, color, images });
        res.send('Car details uploaded successfully');
    });
});

// Endpoint to get all cars
app.get('/getCars', (req, res) => {
    db.query('SELECT * FROM cars', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Endpoint to delete a car by ID
app.delete('/deleteCar/:id', (req, res) => {
    const carId = req.params.id;
    db.query('DELETE FROM cars WHERE id = ?', [carId], (err, result) => {
        if (err) throw err;
        io.emit('carDeleted', carId);  // Notify clients in real-time
        res.send('Car deleted successfully');
    });
});

// Endpoint to update a car
app.put('/updateCar/:id', (req, res) => {
    const carId = req.params.id;
    const { brand, model, year, price, mileage, fuel_type, transmission, color } = req.body;

    const sql = 'UPDATE cars SET brand = ?, model = ?, year = ?, price = ?, mileage = ?, fuel_type = ?, transmission = ?, color = ? WHERE id = ?';
    const values = [brand, model, year, price, mileage, fuel_type, transmission, color, carId];

    db.query(sql, values, (err, result) => {
        if (err) throw err;
        io.emit('carUpdated', { id: carId, brand, model, year, price, mileage, fuel_type, transmission, color });
        res.send('Car details updated successfully');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
