const mqlight = require('mqlight')
const Hoek = require('hoek')

// hapi.js plugin register function
const middlewareWrapper = (server, options, next) => {
  // See https://github.com/mqlight/nodejs-mqlight#mqlightcreateclientoptions-callback
  const defaultOptions = {
    service: 'amqp://localhost'
  }

  const opts = Hoek.applyToDefaults(defaultOptions, options)

  let client

  // TODO: Connection pooling? but for send only
  server.expose('send', client.send)
  server.expose('subscribe', client.subscribe)
  server.expose('unsubscribe', client.unsubscribe)

  // Server Lifecycle

  // Stop connections
  server.ext('onPreStop', (srv, next) => {
    client.stop()
    client = null
    return next()
  })

  // When registering plugin
  mqlight.createClient(opts, (err, startedClient) => {
    if (err) {
      console.error('Problem with connect: ', err.toString())
      Error(`Can't start MqLight with opts:${JSON.stringify(opts)} err:${err}`)
    } else {
      client = startedClient
    }

    // Continue processing
    return next()
  })
}

module.exports = middlewareWrapper
