import multer from 'multer'

const imageAllowedTypes = ['image/jpeg', 'image/jpg']

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, '../../public/profileImage/')
  },

  filename: (req, file, callback) => {
    const filename = String(Date.now())
    callback(null, filename)
  },
})

const fileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
  if (imageAllowedTypes.includes(file.mimetype)) {
    callback(null, true)
  } else {
    callback(new Error('Seulement des images'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // taille de 1024*1024=1MB donc 5* = 5MB
  },
})
