import winston from 'winston'

// Format pour le développement
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : ''
    return `${timestamp} [${level}]: ${message} ${metaString}`
  }),
)

// Format pour la production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// File logging uniquement si explicitement activé via ENABLE_FILE_LOGGING=true
// En production/déploiement serverless, le filesystem est read-only → console uniquement
const enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true'

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'prod' ? prodFormat : devFormat,
  }),
]

if (enableFileLogging) {
  transports.push(
    // fichier pour les erreurs uniquement
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // Fichier pour tous les logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  )
}

// Création du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: prodFormat,
  defaultMeta: {
    service: 'lhcBack',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports,
  // Gestion des exceptions et rejets uniquement si le log fichier est activé
  exitOnError: false,
})

if (enableFileLogging) {
  logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  )
  logger.rejections.handle(
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  )
}

export default logger
