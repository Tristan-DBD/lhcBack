import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export const rateLimiter = (time: number, max: number, option?: {
    motif?: string,
    skipSuccessful?: boolean,
    skipPath?: string[]
}) => {
    let message: string
    switch (option?.motif) {
        case 'login':
            message = 'Trop de tentatives de connexion, veuillez patienter'
            break;
        case 'upload':
            message = 'Limite de téléchargement atteinte, veuillez patienter'
            break;
        case 'register':
            message = 'Limite d\'inscription atteinte, veuillez patienter'
            break;
        case 'create':
            message = 'Limite de création atteinte, veuillez patienter'
            break;
        case 'get':
            message = 'Limite de requêtes atteinte, veuillez patienter'
            break;
        case 'update':
            message = 'Limite de mise à jour atteinte, veuillez patienter'
            break;
        case 'delete':
            message = 'Limite de suppression atteinte, veuillez patienter'
            break;
        case 'profile-image':
            message = 'Limite de mise à jour de l\'image atteinte, veuillez patienter'
            break;
        case 'prog':
            message = 'Limite de mise à jour du programme atteinte, veuillez patienter'
            break;
        case 'register':
            message = 'Limite d\'inscription atteinte, veuillez patienter'
            break;
        case 'unregister':
            message = 'Limite de désinscription atteinte, veuillez patienter'
            break;
        default:
            message = 'Trop de requêtes, veuillez patienter'
            break;
    }
    return rateLimit({
        windowMs: time * 60 * 1000, // 15 minutes
        max: max, // limit each IP to 100 requests per windowMs
        message: message,

        keyGenerator: (req) => ipKeyGenerator(req.ip!),


        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        skipSuccessfulRequests: option?.skipSuccessful || false,
        skip: (req) => {
            return option?.skipPath?.includes(req.path) || false
        },
    })
}