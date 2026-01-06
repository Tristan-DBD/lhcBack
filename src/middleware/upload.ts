import multer from 'multer'
import path from 'path'
import fs from 'fs'

// fichier image .jpg .png
const imageAllowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
// fichier type excel .xls .xlsx
const statsAllowedTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const storage = multer.memoryStorage()

const fileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
  switch (file.fieldname) {
    case 'profileImage':
      return imageAllowedTypes.includes(file.mimetype)
        ? callback(null, true)
        : callback(new Error('Invalid image type'))

    case 'statsFile':
      return statsAllowedTypes.includes(file.mimetype)
        ? callback(null, true)
        : callback(new Error('Invalid stats file type'))

    default:
      return callback(new Error('Invalid field name'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // taille de 1024*1024=1MB donc 5* = 5MB
  },
})

export class FileService {
  static async save(file: Express.Multer.File, folder: string) {
    const uploadDir = path.join('public', folder)
    await fs.promises.mkdir(uploadDir, { recursive: true })

    const extention = file.originalname.split('.').pop()
    const filename = `${Date.now()}.${extention}`
    const filePath = path.join(uploadDir, filename)

    await fs.promises.writeFile(filePath, file.buffer)
    return filePath
  }

  static async delete(filePath: string) {
    await fs.promises.unlink(filePath).catch(() => {})
  }
}
