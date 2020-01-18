var mysql = require('mysql')
var pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'bot_user',
    password: 'password',
    database: 'to_do_list_bot',
    charset: 'utf8mb4'
})
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
})

module.exports = pool
