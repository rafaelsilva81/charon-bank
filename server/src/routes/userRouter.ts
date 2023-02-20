import path from 'path'

import { Router as expressRouter } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import multer from 'multer'

import { AppError } from '../errors/appError'
import FileUploadError from '../errors/other/fileUploadError'
import { UserService } from '../services/userService'

const userRouter = expressRouter()
const userService = new UserService()

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads')
      cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`)
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'))
    }
    cb(null, true)
  },
})

userRouter.post(
  '/avatar',
  upload.single('avatar'),
  async (req: JWTRequest, res) => {
    try {
      const file = req.file

      if (!file) {
        throw new FileUploadError('A file is required')
      }

      await userService.uploadAvatar(file, req.auth?.id)

      res.status(200).json({ message: 'Avatar uploaded' })
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.status).json({ message: error.message })
      }
    }
  }
)

export default userRouter