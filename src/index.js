const express = require('express');
// this will ensure that the file runs and mongoos connects to the DB.
require('./db/mongoose')
const User = require('./models/user');
const Task = require('./models/task');
const userRouter  = require('./routers/user');
const taskRouter  = require('./routers/task');



const app = express();
const port = process.env.PORT;

// automatically parse any json to an object.
app.use(express.json())
app.use(userRouter); 
app.use(taskRouter); 


app.listen(port, () => {
    console.log('Server is up on port ', port);
});
