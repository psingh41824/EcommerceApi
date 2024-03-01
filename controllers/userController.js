const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const {validationResult} = require('express-validator')
const mailer = require('../helpers/mailer')
const randomstring = require('randomstring')
const PasswordReset = require('../models/passwordReset');
const jwt = require('jsonwebtoken')
const path = require('path');
const {deleteFile} = require('../helpers/deleteFile')
const Blacklist = require('../models/blacklist')
const Otp = require('../models/otp')
const { timeStamp } = require('console')
const { oneMinuteExpiry ,threeMinuteExpiry } = require('../helpers/otpValidate')

const userRegister = async(req,res)=>{

    try{

        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({
                success: false,
                msg:'Errors',
                errors:errors.array().map(error => error.msg)
            })
        }
        const { name , email ,mobile ,password } = req.body;

        const isExists = await User.findOne({email: email})
        if(isExists){
            return res.status(400).json({
                success : false,
                msg: 'Email Already Exists!'
            })
        }

        const hashPassword = await bcrypt.hash(password,10)

        const user = new User({
        
            name,
            email,
            mobile,
            password:hashPassword,
            image:'images/'+req.file.filename,
            type:req.body.type
        })

        const userData = await user.save()
        const msg = `<p>Hi ${name},</p><p>Please <a href="http://localhost:5000/mail-verification?id=${userData._id}">verify</a> your mail.</p>`
       
        mailer.sendMail(email, 'Mail Verification', msg)
       
        return res.status(200).json({
            success: true,
            msg:'Registered successfully!',
            user: userData
        })

    }
    catch(error){
        return res.status(400).json({
            success: false,
            msg:error.message
        })
    }
}

const generateAccessToken = async (user)=>{
    const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"2h"})
    return token;
}

const generateRefreshToken = async (user)=>{
    const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"4h"})
    return token;
}

const loginUser = async(req,res)=>{
    try{
        const errors = validationResult(req) ;

        if(!errors.isEmpty()){
            return res.status(400).json({
                success: false,
                msg:'Errors',
                errors:errors.array().map(error => error.msg)
            })
        }
        const {email,password} = req.body;

        const userData = await User.findOne({email});

        if(!userData){
           return res.status(401).json({
            success:false,
            msg: 'Email and Password is Incorrect!'
           })
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);

        if(!passwordMatch){
            return res.status(401).json({
                success: false,
                msg: 'Email and password is Incorrect!'
            })
        }

        if(userData.is_verified == 0){
            return res.status(401).json({
                success: false,
                msg: 'Please Verify Your Account!'
            }) 
        }

       const accessToken = await generateAccessToken({user : userData})
       const refreshToken = await generateRefreshToken({user : userData})

       return res.status(200).json({
        success:true,
        msg: 'Login Successfully!!',
        user : userData,
        accessToken : accessToken,
        refreshToken : refreshToken,
        tokenType: 'Bearer'
       })

    }
    catch(error){
        return res.status(400).json({
            success: false,
            msg:error.message
        })
    }
}

const mailVerification = async (req,res) =>{
    
    try{

        if(req.query.id == undefined){
            return res.render('404');
        }

         //const userId = mongoose.Types.ObjectId(req.query.id); 

         const userData = await User.findOne({ _id: req.query.id})

         if(userData){

            if(userData.is_verified == 1){
                return res.render('mail-verification', { message:' Your mail already verified!'})
            }

           await User.findByIdAndUpdate({ _id: req.query.id },{ $set:{ is_verified: 1 }})

           return res.render('mail-verification', { message:'Mail has been verified successfully!' });

         }else{
            return res.render('mail-verification', { message:'User not Found!' });
         }

    }catch(error){
        console.log(error.message);
        return res.render('404')
    }
}

const sendMailVerification = async(req,res) =>{
    try{

        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                success: false,
                msg:'Errors',
                errors: errors.array()
            })
        }
        const email = req.body.email

        const userData = await User.findOne({ email:email})

        if(!userData){
            return res.status(400).json({
                success: false,
                msg:"Email Doesn't exists!"
            }) 
        }

        if(userData.is_verified == 1){
            return res.status(400).json({
                success: false,
                msg:userData.email+"mail is already verified!"
            }) 
        }

        const msg = `<p>Hi ${userData.name},</p><p>Please <a href="http://localhost:5000/mail-verification?id=${userData._id}">verify</a> your mail.</p>`
       
        mailer.sendMail(userData.email, 'Mail Verification', msg)
       
        return res.status(200).json({
            success: true,
            msg:'Verification Link sent to your mail, please check!',
        
        })

    }

    catch(error){
        return res.status(400).json({
            success: false,
            msg:error.message
        })
    }
    
}

const forgotPassword = async(req, res) =>{
    try{
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                success: false,
                msg:'Errors',
                errors: errors.array()
            })
        }
        const email = req.body.email

        const userData = await User.findOne({ email:email})

        if(!userData){
            return res.status(400).json({
                success: false,
                msg:"Email Doesn't exists!"
            }) 
        }
        const randomString = randomstring.generate()
        const msg = '<p> Hii '+userData.name+',Please click <a href="http://localhost:5000/reset-password?token='+randomString+'">here</a> to  Reset your Password!</p>'
        await PasswordReset.deleteMany({ user_id : userData._id })
        const passwordReset = new PasswordReset({
            user_id : userData._id,
            token : randomString
        });
        await passwordReset.save();
        mailer.sendMail(userData.email,'Reset Password', msg)

        return res.status(201).json({
            success  : true,
            msg:'Reset Password Link send to your mail, please check!'
        })


    }catch(error){
        return res.status(400).json({
            success: false,
            msg:error.message
        })
    }
}

const userProfile = async (req, res) =>{

    try{

        const userData = req.users.user;

        return res.status(200).json({
            success: true,
            msg:'User Profile Data!',
            data:userData
        })
    }
    catch(error){
        return res.status(400).json({
            success: false,
            msg:error.message
        })
    }

}

const updateProfile = async (req,res)  =>{
    try{

        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                success: false,
                msg:'Errors',
                errors: errors.array()
            })
        }

        const {name, mobile} = req.body;

        const data = {
            name,
            mobile
        }

        const user_id = req.users.user._id;

        if(req.file !== undefined){
             data.image = 'images/'+req.file.filename;
             const oldUser = await User.findOne({ _id: user_id })
             const oldFilePath = path.join(__dirname,'../public/'+oldUser.image)

             deleteFile(oldFilePath);
        }

        const userData = await User.findByIdAndUpdate({_id: user_id},{
            $set:data
        }, {new : true });
        return res.status(200).json({
            success: true,
            msg:'User Updated Successfully',
            user: userData
        })

    }catch(error){
        return res.status(400).json({
            success: false,
            msg:error.message
        })
    }
}

const refreshToken = async (req,res) =>{

    try{

        const userId = req.users.user._id;

        const userData = await User.findOne({ _id:userId });

        const accessToken = await generateAccessToken({ user:userData })
        const refreshToken = await generateRefreshToken({ user:userData })

        return res.status(200).json({
            success: true,
            msg:'Token Refreshed!',
            accessToken:accessToken,
            refreshToken:refreshToken
        })

    }catch(error){
        return res.status(400).json({
            success: false,
            msg:error.message
        })
    }

}

const logout = async(req,res) =>{
    try{
 
        const token = req.body.token || req.query.token || req.headers["authorization"];
 
        const bearer = token.split(' ')
        const bearerToken = bearer[1];
 
        const newBlacklist = new Blacklist({
         token:bearerToken
        });
 
       await newBlacklist.save();
 
       res.setHeader('Clear-Site-Data','"cookies","storage"')
       return res.status(200).json({
         success: true,
         msg: 'You are logged out!'
       });
 
    }catch(error){
     return res.status(400).json({
         success: false,
         msg: error.message
     });
    }
 }

 const generateRandom4Digit = async() =>{
    return Math.floor(1000 + Math.random() * 9000);
}

 const sendOtp = async(req,res) =>{

    try{
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                success: false,
                msg:'Errors',
                errors: errors.array()
            })
        }
        const email = req.body.email

        const userData = await User.findOne({ email:email})

        if(!userData){
            return res.status(400).json({
                success: false,
                msg:"Email Doesn't exists!"
            }) 
        }
        if(userData.is_verified == 1){
            return res.status(400).json({
                success: false,
                msg:userData.email+" mail is already verified!"
            }) 
        }

        const g_otp = await generateRandom4Digit()

        const oldOtpData =  await Otp.findOne({ user_id:userData._id })

        if(oldOtpData){
            const sendNextOtp = await oneMinuteExpiry(oldOtpData.timestamp);
            if(!sendNextOtp){
                return res.status(400).json({
                    success: false,
                    msg:'Pls try after some time!'
                })
            }
        }

        const cDate = new Date();

        await Otp.findOneAndUpdate(
            { user_id:userData._id },
            { otp: g_otp, timestamp: new Date(cDate.getTime()) },
            { upsert:true, new: true, setDefaultsOnInsert: true}
        )

        const msg = '<p>Hi <b>'+userData.name+'</b>,</br> <h4>'+g_otp+'</h4></p>'
        mailer.sendMail(userData.email, 'Otp Verification', msg)
       
        return res.status(200).json({
            success: true,
            msg:'Otp has been sent to your mail, please check!',
        
        })

    }catch(error){
    return res.status(400).json({
        success: false,
        msg: error.message
    });

   }
}

const verifyOtp = async (req, res) =>{
    try{
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                success: false,
                msg:'Errors',
                errors: errors.array()
            })
        }

        const { user_id, otp} =  req.body;

        const otpData = await Otp.findOne({
            user_id:user_id,
            otp :otp
        });

        if(!otpData){
            return res.status(400).json({
                success: false,
                msg: 'You entered wrong OTP!'
            });  
        }

        const isOtpExpired = await threeMinuteExpiry(otpData.timestamp)

        if(isOtpExpired){
            return res.status(400).json({
                success: false,
                msg: 'You OTP has been Expired!'
            });  
        }
        await User.findByIdAndUpdate({ _id: user_id },{
            $set:{
                is_verified:1
            }
        });
        return res.status(200).json({
            success: true,
            msg: 'Account Verified Successfully!'
        });


    }catch(error){
    return res.status(400).json({
        success: false,
        msg: error.message
    });

   }
}

module.exports = { userRegister ,loginUser ,mailVerification, sendMailVerification  ,forgotPassword ,userProfile ,updateProfile ,refreshToken, logout, sendOtp, verifyOtp }
