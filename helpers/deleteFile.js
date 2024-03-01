const fs = require('fs').promises;

const deleteFile = async(filePath) => {
    try{

        await fs.unlink(filePath);
        console.log("File Deleted Successfully");

    }
    catch(error){
        console.log(error.message)
    }
}
module.exports = { deleteFile }