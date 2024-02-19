const express = require('express')
const router = express()
router.use(express.json())
const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
      if(file.mimetype === 'image/jpeg' ||file.mimetype === 'image/png'){
        cb(null, path.join(__dirname,'../public/images'));
        }

      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Set the filename (you can modify this as per your requirements)
      }
})

const fileFilter = (req, file, cb)=>{
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
    cb(null, true)
  }
  else{
    cb(null, false)
  }
}

const upload = multer ({storage: storage, fileFilter:fileFilter})
const userController = require('../controllers/userController')
const { registerValidator, sendMailVerificationValidator , passwordResetValidator} = require('../helpers/validation') 

router.post('/register',upload.single('image'),registerValidator,userController.userRegister)

router.post('/send-mail-verification', sendMailVerificationValidator, userController.sendMailVerification)

router.post('/forgot-password',passwordResetValidator, userController.forgotPassword)

module.exports = router;