const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();
const corsMiddleware = require('./middleware/cors-middleware');

const mongoose = require('mongoose');
const authRoute = require('./routes/auth-route');
const userRoute = require('./routes/user-route');
const truckRoute = require('./routes/truck-route');
const loadRoute = require('./routes/load-routes');

const app = express();
const port = process.env.PORT || 8080;
const db = process.env.DB;

mongoose
    .connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Connected to DB'))
    .catch((error) => console.log(error));

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.json());
app.use(cors());
app.use(corsMiddleware);
app.use(authRoute);
app.use(userRoute);
app.use(truckRoute);
app.use(loadRoute);

app.listen(port, (error) => {
    error ? console.log(error) : console.log(`Listening port ${port}`);
});