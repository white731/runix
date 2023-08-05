const { getFirestore } = require('firebase-admin/firestore')
const { onRequest } = require('firebase-functions/v2/https')
const { defineString } = require('firebase-functions/params')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')

admin.initializeApp()

const firestore = getFirestore()
const nodemailer = require('nodemailer')

const cors = require('cors')({
  origin: true,
})

//Create a User aka, store their name and phone number.

exports.postLead = onRequest((req, resp) => {
  cors(req, resp, () => {
    let name = req.body.name
    let phone = req.body.phone
    let email = req.body.email
    let address = req.body.address

    userExists(email)
      .then((leadExists) => {
        console.log('LeadExists: ', leadExists)
        // check if this user exists.

        if (leadExists) {
          resp.send(
            'Sorry, it looks like this user has already requested an appointment, please give us a call instead.',
          )
          resp.end()
        } else {
          const data = {
            name: name,
            phone: phone,
            email: email,
            address: address,
          }
          console.log(data)
          sendMail(data)
          createUser(data)
            .then((result) => {
              console.log(result)
              resp.send(
                "We've received your inquiry. Someone will be in touch with you shortly.",
              )
              resp.end()
            })
            .catch((error) => {
              console.log(error)
              resp.send(
                'Sorry, there has been and error. Please try again later.',
              )
              resp.end()
            })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  })
})

const userExists = async (documentId) => {
  const userRef = firestore.collection('leads').doc(documentId)
  const doc = await userRef.get()
  if (doc.exists) {
    return true
  }
  return false
}

const createUser = async (data) => {
  // Add a new document in collection "users" with the phoneNumber as the ID
  await firestore.collection('leads').doc(data.email).set(data)

  console.log(data)

  return 'Request was successful.'
}

/**
 * Here we're using Gmail to send
 */
const password = defineString('GMAIL_PASSWORD')
const email = defineString('GMAIL_EMAIL')

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: email.value(),
    pass: password.value(),
  },
})

const sendMail = async (data) => {
  try {
    const from = data.email
    const to = 'landon@runixhomes.com'

    const mailOptions = {
      from: from, // Something like: Jane Doe <janedoe@gmail.com>
      to: to,
      subject: 'New Lead: ' + from, // email subject
      text:
        "You've received a new lead. \n" +
        'Email: ' +
        data.email +
        '\n' +
        'Phone: ' +
        data.phone +
        '\n' +
        'Name: ' +
        data.name +
        '\n' +
        'Address: ' +
        data.address +
        '\n',
    }

    console.log(mailOptions)

    // returning result
    transporter.sendMail(mailOptions)
    console.log('Email Sent')
  } catch (error) {
    console.log('error: ', error)
  }
}

exports.sendMainToMe = onRequest((req, resp) => {
  cors(req, resp, () => {
    let data = {
      subject: req.body.subject,
      body: req.body.body,
      to: req.body.to,
    }

    sendEmailToMe(data)
  })
})

const sendEmailToMe = async (data) => {
  try {
    const from = 'landon@runixhomes.com'
    const me = 'landon@runixhomes.com'

    const mailOptions = {
      from: from, // Something like: Jane Doe <janedoe@gmail.com>
      to: data.to,
      bcc: me,
      subject: data.subject,
      html: data.body,
    }

    console.log(mailOptions)

    // returning result
    transporter.sendMail(mailOptions)
    console.log('Email Sent')
  } catch (error) {
    console.log('error: ', error)
  }
}
