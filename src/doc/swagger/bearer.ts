import swagger from '../swagger.json'

swagger.components.securitySchemes = {
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
}

export default swagger
