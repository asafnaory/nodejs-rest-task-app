const jwt = require('jsonwebtoken');
const User = require ('../models/user');

const auth = async (req, res, next) => {
    try{

        // console.log(req.header('Authorization'))
        const token  = req.header('Authorization').replace('Bearer','').substring(1);
        const decoded = jwt.verify(token ,process.env.JWT_SECRET);
        const user = await User.findOne({_id:decoded._id, 'tokens.token': token }); 
        
        if(!user){
            throw new Error(); 
        }
        req.token = token; 
        req.user = user; 

        next();      
    }catch(e){
        console.log(e);
        res.status(401).send({error: 'Please authenticate'})
    }
    
}
module.exports = auth; 