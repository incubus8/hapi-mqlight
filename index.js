const pkg = require('./package.json')
const register = require('./lib/hapi-mqlight')

// provide meta-information as expected by hapi.js
register.attributes = { pkg }

// export register function, wrapped in a plugin object
module.exports = { register }
