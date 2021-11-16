const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { database } = require('./constants/variables');
const { updateAllProductsFromDB } = require('./services/scrapper.service');

dotenv.config({ path: './config.env' });
const app = require('./app');
const milisecondsFromHours = require('./utils/milisecondsFromHours.util');

const DB = database[process.env.NODE_ENV || 'development'];

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // updateAllProductsFromDB();
    setInterval(updateAllProductsFromDB, milisecondsFromHours(1));
  });

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
