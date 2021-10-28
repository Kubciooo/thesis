module.exports = {
  database: {
    development: 'mongodb+srv://kubcio:ROrYGwsXRvJqdX9r@cluster0.lixwu.mongodb.net/offprice?retryWrites=true&w=majority',
    production: 'mongodb+srv://kubcio:ROrYGwsXRvJqdX9r@cluster0.lixwu.mongodb.net/offprice?retryWrites=true&w=majority'
  },
  jwtSecret: {
    password: {
      development: 'thisisasecretkubciokeydumdumdum',
      production: 'thisisasecretkubciokeydumdumdum',
      testing: 'thisisasecretkubciokeydumdumdum'
    },
    expiresIn: {
      development: '2m',
      testing: '30s',
      production: '10m'
    },
  }

}