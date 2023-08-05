/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')
const Airtable = require('airtable')

admin.initializeApp()

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true })
  response.send('Hello from Firebase!')
})

const cors = require('cors')({
  origin: true,
})

var base = new Airtable({
  apiKey:
    'patga5iuOccFYalQc.f702221a0a75e65e12e42e723fd13779981745c12308b9e1a790b97f12a8d9de',
}).base('apptmhGhY4vIHpHbb')

let propertyTaskIds = []

const getProperty = async (propertyRecordID) => {
  const response = await base('Property').find(propertyRecordID)
  return response
}

const airtablePropertyTasks = async (propertyRecordID) => {
  try {
    const response = await base('PropertyItemDetail')
      .select({
        filterByFormula: `{PropertyRecordId}="${propertyRecordID}"`,
        fields: [
          'Task',
          'PlanName',
          'QuarterEffective',
          'FrequencyNumber',
          'Qty',
          'TotalDuration',
          'Individual Service Price (with materials)',
        ],
        sort: [
          { field: 'PlanName', direction: 'asc' },
          { field: 'ID', direction: 'asc' },
        ],
      })
      .all()
    propertyTaskIds.push(response)
    return response
  } catch (error) {
    console.log(error)
    return error
  }
}

const airtableTasks = async (propertyRecordID) => {
  try {
    const response = await base('Tasks')
      .select({
        // filterByFormula: `{PropertyRecordId}="${propertyRecordID}"`,
        fields: [
          'Task',
          'PlanName',
          'Quarter',
          'TotalDuration',
          'Individual Service Price (with materials)',
        ],
      })
      .all()
    propertyTaskIds.push(response)
    return response
  } catch (error) {
    console.log(error)
    return error
  }
}

const airtableList = async (base) => {
  try {
    const response = await base(base).select().all()
    return response
  } catch (error) {
    console.log(error)
  }
}

const airtablePhoto = async (recordId) => {
  try {
    const response = await base('Photos').find(recordId)
    return response
  } catch (error) {
    console.log(error)
  }
}

const airtableTask = async (taskId) => {
  try {
    const response = await base('Tasks').find(taskId)
    return response
  } catch (error) {
    console.log(error)
  }
}

const getPhotos = async (task) => {
  let photoObjects = []

  for (const x of task.get('photos')) {
    let photoObject = await airtablePhoto(x)
    photoObjects.push(photoObject)
  }

  return photoObjects
}

const createFullTaskObject = async (taskId) => {
  let task = await airtableTask(taskId)
  let photoObjects = await getPhotos(task)

  task.fields.photoObjects = photoObjects
  console.log('Photo Objects: ', task.photoObjects)

  return task
}

const getDatesFromAirtable = async () => {
  const res = await base('Schedule')
    .select({
      view: 'Available Times',
      fields: ['Schedule'],
    })
    .all()

  return res
}

exports.getPropertyTasks = onRequest((req, resp) => {
  cors(req, resp, () => {
    airtablePropertyTasks(req.query.propertyRecordID).then((response) =>
      resp.send(response),
    )
  })
})

exports.getAvailableDates = onRequest((req, resp) => {
  cors(req, resp, () => {
    getDatesFromAirtable().then((response) => {
      const array = []
      response.map((record) => {
        array.push(record.fields)
      })
      console.log(array)
      resp.send(array)
    })
  })
})

exports.getPropertyFunction = onRequest((req, resp) => {
  cors(req, resp, () => {
    console.log('Query Params:', req.query)
    getProperty(req.query.recordId)
      .then((property) => {
        resp.send(property)
      })
      .catch((error) => {
        console.log(error)
      })
    // resp.send(`The redcord Id is: ${req.query.recordId}`);
  })
})

exports.getTask = onRequest((req, resp) => {
  cors(req, resp, () => {
    console.log('Query Params:', req.query)
    // airtableTask(req.query.recordId)
    createFullTaskObject(req.query.recordId)
      .then((task) => {
        resp.send(task)
      })
      .catch((error) => {
        console.log(error)
      })
    // resp.send(`The redcord Id is: ${req.query.recordId}`);
  })
})
