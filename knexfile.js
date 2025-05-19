// knexfile.js
module.exports = {
  development: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'cardealership'
    },
    migrations: {
      directory: './migrations'   // Folder for migration files
    },
    seeds: {
      directory: './seeds'        // Folder for seed files
    }
  }
};
