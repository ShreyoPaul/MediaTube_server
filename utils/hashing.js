const bcrypt = require('bcryptjs');

function hashPassword(userPassword) {
    const salt = bcrypt.genSaltSync(10)
    const hashedPass = bcrypt.hashSync(userPassword, salt)
    console.log(salt, hashedPass)
    return hashedPass
}

function comparePassword(userPassword, hash) {
    return bcrypt.compareSync(userPassword, hash)
}

module.exports = { hashPassword, comparePassword };