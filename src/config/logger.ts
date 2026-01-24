import winston from 'winston'

// Format pour le développement
const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        return `${timestamp} [${level}]: ${message} ${metaString}`
    }),
)

// Format pour la production
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
)

// Création du logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: prodFormat,
    defaultMeta: {
        service: 'lhcBack',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // fichier pour les erreurs uniquement
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),

        // Fichier pour tous les logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],

    // Gestion des exceptions non capturées
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],

    // Gestion des rejects de promises
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
})

// Ajouter la console en développement 
if (process.env.NODE_ENV !== 'prod') {
    logger.add(new winston.transports.Console({
        format: devFormat
    }))
}

export default logger