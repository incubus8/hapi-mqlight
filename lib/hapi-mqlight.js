const mqlight = require('mqlight')
const Hoek = require('hoek')
const Joi = require('joi')

// hapi.js plugin register function
const middlewareWrapper = (server, options, next) => {
  // See https://github.com/mqlight/nodejs-mqlight#mqlightcreateclientoptions-callback
  const defaultOptions = {
    service: 'amqp://localhost'
  }

  const opts = Hoek.applyToDefaults(defaultOptions, options)

  let client

    // TODO: Connection pooling? but for send only
  server.expose('send', (topic, data, options, callback) => {
    Joi.validate(topic, Joi.string(), (err) => {
      if (err === null) {
        client.send(...arguments)
      } else {
        callback(err, null)
      }
    })
  })

  server.expose('subscribe', (topicPattern, share, options, callback) => {
    Joi.validate(topicPattern, Joi.string(), (err) => {
      if (err === null) {
        client.subscribe(...arguments)
      } else {
        callback(err, null)
      }
    })
  })

  server.expose('unsubscribe', (topicPattern, share, options, callback) => {
    Joi.validate(topicPattern, Joi.string(), (err) => {
      if (err === null) {
        client.unsubscribe(...arguments)
      } else {
        callback(err, null)
      }
    })
  })

  // Server Lifecycle

  // When server starting
  server.on('start', () => {
    mqlight.createClient(opts, (err, startedClient) => {
      if (err) {
        console.error('Problem with connect: ', err.toString())
        Error(`Can't start MqLight with opts:${JSON.stringify(opts)} err:${err}`)
      } else {
        client = startedClient
      }
    })
  })

  // Stop connections
  server.ext('onPreStop', (srv, next) => {
    client.stop()
    client = null
    return next()
  })

  // Continue processing
  return next()
}

module.exports = middlewareWrapper
