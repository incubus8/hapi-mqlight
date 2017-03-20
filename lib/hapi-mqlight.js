const mqlight = require('mqlight')

// hapi.js plugin register function
const middlewareWrapper = (server, options, next) => {
  // See https://github.com/mqlight/nodejs-mqlight#mqlightcreateclientoptions-callback
  let client = mqlight.createClient(options.mqconfig)

  // We could use `client()` or from onPreHandler with `req.mqclient`
  server.expose('client', () => client)

  // Server Lifecycle
  server.ext('onPreHandler', (request, reply) => {
    // TODO: Check whether connection established or not
    if (!request.mqclient) {
      request.mqclient = client
    }
    reply.continue()
  })

  // Stop connections
  server.ext('onPreStop', (srv, next) => {
    console.log('Stopping mqclient')

    if (client) {
      client.stop()
      client = null
    }
    return next()
  })

  client.on('started', () => {
    console.log('Starting mqclient connection')

    options.subscribers.forEach(({ parameters }) => {
      try {
        client.subscribe(parameters)
      } catch(error) {
        console.error(error);
      }
    })

    client.on('message', (data, delivery) => {
      options.subscribers.forEach(({ parameters, handler }) => {
        if (handler && typeof handler === 'function' 
          && delivery.destination.topicPattern === parameters[0]) {
          handler(data, delivery)
        }
      })
    })
  })

  client.on('restarted', () => {
    console.log('Restarting mqclient connection')
  })

  client.on('stopped', () => {
    console.log('Stopped mqclient connection')
  })

  client.on('error', (error) => {
    console.error(error)
  })

  return next()
}

module.exports = middlewareWrapper
