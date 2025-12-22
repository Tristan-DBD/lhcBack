import multer from 'multer'

// fichier image .jpg .png
const imageAllowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
// fichier type excel .xls .xlsx
const statsAllowedTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    switch (file.fieldname) {
      case 'profileImage':
        callback(null, 'public/profileImage/')
        break
      case 'statsFile':
        callback(null, 'public/prog/')
        break
    }
  },

  filename: (req, file, callback) => {
    const extension = file.originalname.split('.')[1]
    const filename = `${Date.now()}.${extension}`
    callback(null, filename)
  },
})

const fileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
  if (imageAllowedTypes.includes(file.mimetype)) {
    callback(null, true)
  } else {
    const error = new Error('Invalid file type')
    callback(error as any, false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // taille de 1024*1024=1MB donc 5* = 5MB
  },
})
