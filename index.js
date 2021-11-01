const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { database } = require('./constants/variables');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = database[process.env.NODE_ENV || 'development'];

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
