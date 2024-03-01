const { check } = require('express-validator')

exports.registerValidator = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots:true
    }),
    check('mobile', 'Mobile No. should be contains 10 digits').isLength({
        min:10,
        max:10
    }),
    check('password', 'Password must be greater than 6 charecters, and contains at least one Uppercase letter, one lowercase letter, and one special character').isStrongPassword({
        minLength:6,
        minUppercase:1,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1
    }),
    check('image', 'Name is required').custom((value, {req}) => {
        if(req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png'){
            return true
        }
        else{
            return false
        }

    }).withMessage("Please upload an image Jpeg, PNG")
]

exports.sendMailVerificationValidator = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
]

exports.passwordResetValidator = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
]

exports.loginValidator = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots:true
    }),
    check('password', 'Password is required').not().isEmpty()

]

exports.updateProfileValidator = [
    check('name', 'Name is required').not().isEmpty(),
    check('mobile', 'Mobile No. should be contains 10 digits').isLength({
        min:10,
        max:10
    })
]

exports.otpMailValidator = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
]

exports.verifyOtpValidator = [
    check('user_id', 'User Id is required').not().isEmpty(),
    check('otp', 'OTP is required').not().isEmpty()
]
