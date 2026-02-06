import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { supabase, getBucketName } from '../config/supabase'
import logger from '../config/logger'

// fichier image .jpg .png
const imageAllowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
// fichier type excel .xls .xlsx
const statsAllowedTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// Configuration du stockage local pour le développement
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(
      process.cwd(),
      'public',
      file.fieldname === 'profileImage' ? 'profileImage' : 'prog',
    )
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const extension = file.originalname.split('.').pop()
    const filename = `${Date.now()}.${extension}`
    cb(null, filename)
  },
})

// Configuration mémoire pour Supabase (production)
const memoryStorage = multer.memoryStorage()

const fileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
  switch (file.fieldname) {
    case 'profileImage':
      return imageAllowedTypes.includes(file.mimetype)
        ? callback(null, true)
        : callback(new Error('Invalid image type'))

    case 'programFile':
      return statsAllowedTypes.includes(file.mimetype)
        ? callback(null, true)
        : callback(new Error('Invalid program file type'))

    default:
      return callback(new Error('Invalid field name'))
  }
}

// Middleware multer avec configuration conditionnelle
export const upload = multer({
  storage: process.env.NODE_ENV === 'prod' ? memoryStorage : localStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

export class FileService {
  static async save(file: Express.Multer.File, folder: string) {
    // En développement : stockage local
    if (process.env.NODE_ENV !== 'prod') {
      // Le fichier est déjà sauvegardé par multer.diskStorage
      if (file.path) {
        // Retourner le chemin relatif depuis le dossier public
        const relativePath = file.path.replace(
          path.join(process.cwd(), 'public'),
          '',
        )
        return relativePath.replace(/\\/g, '/') // Normaliser les chemins Windows
      }
      throw new Error('Local file path not found')
    }

    // En production : stockage Supabase
    const bucketName = getBucketName()
    const extension = file.originalname.split('.').pop()
    const filename = `${Date.now()}.${extension}`
    const filePath = `${folder}/${filename}`

    try {
      const client = supabase()
      if (!client) {
        throw new Error('Supabase client not available in development')
      }

      const { error } = await client.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        })

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`)
      }

      return `${filePath}`
    } catch (error) {
      logger.error('File upload error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  static async delete(fileUrl: string) {
    // En développement : suppression locale
    if (process.env.NODE_ENV !== 'prod') {
      try {
        const fullPath = path.join(process.cwd(), 'public', fileUrl)
        await fs.unlink(fullPath)
        logger.info('Local file deleted', { fullPath })
      } catch (error) {
        logger.error('Local file delete error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw error // Propager l'erreur pour que le test échoue correctement
      }
      return
    }

    // En production : suppression Supabase
    try {
      const client = supabase()
      if (!client) {
        logger.error('Supabase client not available in development')
        return
      }

      const bucketName = getBucketName()

      const { error } = await client.storage.from(bucketName).remove([fileUrl])

      if (error) {
        logger.error('Supabase delete error', {
          error: error.message,
          stack: error.stack,
        })
      }
    } catch (error) {
      logger.error('File delete error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }
}
