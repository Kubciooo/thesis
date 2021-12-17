/**
 * Zmienne globalne
 */
module.exports = {
  database: {
    development:
      'mongodb+srv://kubcio:ROrYGwsXRvJqdX9r@cluster0.lixwu.mongodb.net/offprice?retryWrites=true&w=majority',
    production:
      'mongodb+srv://kubcio:ROrYGwsXRvJqdX9r@cluster0.lixwu.mongodb.net/offprice?retryWrites=true&w=majority',
  },
  apiUrl: {
    development: 'localhost:3000',
    testing: 'localhost:3000',
    production: 'localhost:3000',
  },
  jwtSecret: {
    password: {
      development: 'thisisasecretkubciokeydumdumdum',
      production: 'thisisasecretkubciokeydumdumdum',
      testing: 'thisisasecretkubciokeydumdumdum',
    },
    expiresIn: {
      development: '30m',
      testing: '30s',
      production: '10m',
    },
  },
  transporter: {
    production: {
      service: 'gmail',
      auth: {
        user: 'quolumbo@gmail.com',
        pass: 'edsxovztknuvyljq',
      },
    },
    development: {
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: 'e471903edeae02',
        pass: '62d55fea13c505',
      },
    },
    testing: {
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: 'e471903edeae02',
        pass: '62d55fea13c505',
      },
    },
  },
};
