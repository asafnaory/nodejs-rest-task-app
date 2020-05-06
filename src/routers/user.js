const express = require('express');
const multer = require('multer'); 
const sharp  = require('sharp');

const auth = require('../middleware/auth');
const User = require('../models/user')
const {sendWelcomEmail, sendGoogbyeEmail} = require('../emails/account')

const router = new express.Router();




router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        const token = await user.generateAuthToken();
        await user.save();
        // this is a async process but no need for async await because we don't need to make sure thois -> 
        // -> proccess completes before we continue on
        sendWelcomEmail(user.email, user.name)


        res.status(201).send({
            user,
            token
        });

    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/login', async (req, res) => {
    try {


        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.send({
            user,
            token
        });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/logout', auth, async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        });
        await req.user.save()
        res.send();

    } catch (e) {

        res.status(500).send();
    }

})

router.post('/users/logoutAll', auth, async (req, res) => {

    try {

        req.user.tokens = []; 
        await req.user.save()
        res.send();

    } catch (e) {

        res.status(500).send();
    }

})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})


router.patch('/users/me',auth , async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        res.status(400).send({
            error: 'invalid updates!'
        });
    }

    try {

        //  the reason the update with "findByIdAndUpdate" is not good, is that it doesn't pass through the middleware, but goes directly to the DB  ->
        // -> in order to pass through the middleware, we need to update the user manually
        // const user = await User.findById(req.params.id)

        updates.forEach((update) => req.user[update] = req.body[update])

        await req.user.save();

        // const user = await User.findByIdAndUpdate(req.params.id, req.body,
        //             {
        //                 /*retuns the new user not the old*/ new : true,
        //                 /*makes sure the field exists*/ runValidators: true
        //             });

        res.send(req.user);

    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {

    try {
        await req.user.remove();
        console.log(req.user.name, req.user.email)
        sendGoogbyeEmail(req.user.email, req.user.name); 
        res.send(req.user);

    } catch (e) {
        res.send(500).send(e);
    }

})

//set repository for uploads

const upload = multer ({
    limits: {
        fileSize: 1000000, 
    },
    fileFilter(req,file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)/)) {
            return cb( new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})

// upload.single('avatar') this avatar is the name of the key in the form-data in postman 
router.post('/users/me/avatar', auth ,upload.single('avatar') , async (req, res )  =>{
   
    console.log(req.file.buffer)

    const buffer  = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()

    req.user.avatar = buffer; 
    console.log(req.user.avatar);

    try{
        
        await  req.user.save(); 

    }catch(e){
        res.status(500).send(e)
    }
    res.status(200).send(); 
}, 
// this is a callback that handles the errors from "upload.single" (multer function)
(error, req, res, next)=>{
    res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth , async (req,res ) => {
    
    if(req.user.avatar){
        try{
            // an undefined field in mongoDB gets deleted automatically. 
            req.user.avatar = undefined; 
            await req.user.save();
            res.status(200).send(); 

        }catch(e){
            res.status(500).send('Cannot delete image')
        }
    }
    else{
        res.status(404).send('No avatar for this user');   
    }

})


router.get('/users/:id/avatar', async(req,res)=>{
    try{
        const user = await User.findById(req.params.id); 

        console.log(user.avatar);

        if(!user || !user.avatar) {
            throw new Error(); 
        }

        res.set('Content-type','inage/png');
        res.send(user.avatar)

    }catch(e){
        res.status(404).send()
    }
})


module.exports = router