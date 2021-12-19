const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { database } = require('./constants/variables');
const { updateAllProductsFromDB } = require('./services/scrapper.service');

/**
 * ustawienie ścieżki do pliku konfiguracyjnego
 */
dotenv.config({ path: './config.env' });
const app = require('./app');
const milisecondsFromHours = require('./utils/milisecondsFromHours.util');

const DB = database[process.env.NODE_ENV || 'development'];

/**
 * Połączenie z bazą danych
 */
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    /**
     * Cykliczna aktualizacja produktów z bazy danych
     */
    updateAllProductsFromDB(); // włączyć w przypadku chęci aktualizacji produktów z bazy danych za każdym razem, gdy zostanie uruchomiony serwer
    setInterval(updateAllProductsFromDB, milisecondsFromHours(3));
  });

/**
 * Nasłuch na port
 */
const port = process.env.PORT || 8080;

/**
 * Odpalenie serwera
 */
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
