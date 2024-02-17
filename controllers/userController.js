const User = require('../models/userModel')
const bcrypt = require('bcrypt')

const securePassword = async(password)=>{

    try{
        const passwordHash =  await bcrypt.hash(password, 10);
        return passwordHash
    }
    catch(error){
          res.status(400).send(error.message)
    }

}

const registre_user = async(req,res)=>{

    try{

        const sPassword = await securePassword(req.body.password)

        const user = new User({
            _id:new mongoose.Types.ObjectId,
            name:req.body.name,
            password:sPassword,
            image:req.file.filename,
            type:req.body.type
        })

        const userData = await User.findOne({email:req.body.email})
        if(userData){
            res.status(200).send({success:false,msg:'this email is already exists'})
        }else{
            const user_data = await user.save()
            res.status(200).send({success:true,data:user_data})
        }
    }
    catch(error){
        res.status(400).send(error.message);
    }
}
module.exports = {registre_user}