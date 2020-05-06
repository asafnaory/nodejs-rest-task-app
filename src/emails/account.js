const sgMail = require('@sendgrid/mail'); 


sgMail.setApiKey(process.env.SENDGRID_API_KEY); 

const sendWelcomEmail = (email,name) => {
    sgMail.send({
        to : email, 
        from: 'asaf.naory1@gmail.com',
        subject: 'Thanks for joining it',
        text: `Welcom to the app ${name}. Let me know how you get along with the app.`
    })
}

const sendGoogbyeEmail = (email,name) => {
    sgMail.send({
        to : email, 
        from: 'asaf.naory1@gmail.com',
        subject: 'Googbye',
        text: `Googbye ${name}. Hope you will be back soon :) .`
    })
}

module.exports = {
    sendWelcomEmail,
    sendGoogbyeEmail
}