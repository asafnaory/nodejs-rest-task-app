const mongoose = require('mongoose');
const validator = require ('validator')
const bcrypt = require ('bcrypt')
const uniqueValidator = require('mongoose-unique-validator');
const jwt = require('jsonwebtoken'); 
const Task = require('./task') 

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, 
        trim: true

    },
    email:{
        type: String, 
        unique : true,
        required : true,
        trim : true,
        lowercase: true,
        validate(value){
           if(!validator.isEmail(value)){
               throw new Error('Email is invalid')
           } 
        },
       
    },
    password: {
        type: String, 
        required : true,
        trim : true,
        minlength: 7,
         validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contaion the word "password" ')
            } 
         },

         // my solution: 
        //  validate(value){
        //     console.log('isLength');
        //    if(!validator.isLength(value, {min: 6})){
        //        throw new Error('password is too short')
        //    } 
        // },
    }, 
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('age must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String, 
            required: true
        }
    }],
    // profile picutre saved as binary code
    avatar: {
        type: Buffer
    },
       
},{
    // add createdAt and updatedAt fields to the schema
   timestamps: true 
})

//a propery that relates one collection to another this is not store in the DB it is just for mongoos to -> 
// -> figure out who owns what and how they are related
userSchema.virtual('tasks', {
    ref: 'Task',
    // the relationship is between the user id and the owner field in the task model which is the id of the user ownes it.
    'localField': '_id',
    foreignField: 'owner'
})

//static methods are accessible on the model aka "model methods"
userSchema.statics.findByCredentials = async(email, password) => {

    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to login');
    }
    const isMatch = await bcrypt.compare(password, user.password); 
    
    if(!isMatch){
        throw new Error('Unable to login'); 
    }

    return user; 
}


// overrides method that change the user to json. every time that it will be stringified => 
// -> this is the function that is going to run and that is why there is no password and tokens -> 
// in the return value when login.
// TLDR- overrides JSON.stringify()
userSchema.methods.toJSON  = function() {
    const user = this; 

    const userObject = user.toObject()
    
    delete userObject.password; 
    delete userObject.tokens; 
    delete userObject.avatar;

    return userObject
}

// methods are accessible on the instance aka "instance methods"

userSchema.methods.generateAuthToken = async function(){
    const user = this; 
    const token =  jwt.sign({_id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })

    await user.save();

    return token;
}



// Hash the plain text password before saving 

userSchema.pre('save' , async function(next){
    const user = this; 

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8); 

    }
    next();
})


// Delete user task when user is removed 
userSchema.pre('remove',async function(next) {
    const user = this; 
    await Task.deleteMany({owner: user._id}); 

    next(); 

})


const User = mongoose.model('User', userSchema)
userSchema.plugin(uniqueValidator);
module.exports = User