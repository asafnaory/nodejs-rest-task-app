const express = require('express');
const Task = require('../models/task')
const router = new express.Router(); 
const auth = require('../middleware/auth')


router.post('/tasks',auth ,async (req, res) => {
    const task =  new Task({
        ...req.body,
        owner: req.user._id
        });

    try {
        await task.save()
        res.status(201).send(task);


    } catch (e) {
        res.status(400).send(e);

    }
});

//GET /tasks/?completed=true
//GET /tasks/?limit=10&skip=10
//GET /task/sortBy=createdAt_desc
router.get('/tasks', auth ,async (req, res) => {

    const match = {};
    const sort = {};

    if(req.query.completed){
        match.compeletd = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        console.log(parts)
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; 
    }
    try {
        // const tasks = await  Task.find({})
        // const tasks = await Task.find({owner: req.user._id })
        // or:
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
      
        //  res.send(tasks)

    } catch (e) {
        console.log(e);
        res.status(500).send()

    }

})


router.get('/tasks/:id',auth ,async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id })

        if (!task) {
             res.status(404).send()
        }
        res.send(task)

    } catch (e) {
        console.log(e)
         res.status(500).send()

    }

})


router.patch('/tasks/:id', auth ,async(req, res)=> {
    const updates = Object.keys(req.body);  
    const allowedUpdates =  ['description', 'compeletd']; 
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        res.status(400).send({error: 'invalid updates!'});
    }
    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
       



        // const task =  await Task.findByIdAndUpdate(req.params.id, req.body,
        //     {
        //         /*retuns the new task not the old*/ new : true,
        //         /*makes sure the field exists*/ runValidators: true
        //     })
        
        if(!task){
            return res.status(404).send()
        }

        //  the reason the update with "findByIdAndUpdate" is not good, is that it doesn't pass through the middleware, but goes directly to the DB  ->
        // -> in order to pass through the middleware, we need to update the user manually
        // const task = await Task.findById(req.params.id)

        updates.forEach((update)=> task[update] = req.body[update])
        
        await task.save(); 

        res.send(task); 

    }catch(e){
        res.status(400).send(e)
    }

})


router.delete('/tasks/:id', auth ,async (req, res )=>{
    try{
        const task = await Task.findByIdAndDelete({_id: req.params.id, owner: req.user._id}); 

        if(!task){
            return res.status(404).send()
        }
        res.send(task); 
    }catch(e){
        res.send(500).send(e);
    }

})
module.exports = router