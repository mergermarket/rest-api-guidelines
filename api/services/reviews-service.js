const AWS = require('aws-sdk')

const dynamodb = new AWS.DynamoDB({endpoint:'http://localhost:4569', region: 'eu-west-1'});
const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10', endpoint:'http://localhost:4569', region: 'eu-west-1'});

const getById = async (id = false) => {
  if(!id) {
    throw new Error('no review id provided')
  }
  const params = {
    KeyConditionExpression: 'id = :hkey',
    ExpressionAttributeValues: {
      ':hkey': id
    },
    TableName: 'WineReviews'
  }
  
  const {Items:items} = await docClient.query(params).promise()
  
  if(items.length !== 1) {
    throw new Error('get by id returned more than one item')
  }

  return items[0]

}

const getApproximateItemCount = async () => await dynamodb.describeTable({TableName: 'WineReviews'}).promise()

const search = async ({country = false} = {}) => {
  if(!country) {
    throw new Error('Country not passed')
  }
  const params = {
    TableName: 'WineReviews',
    KeyConditionExpression: 'begins_with(geography, :country)',
    ExpressionAttributeValues: {
       ':country': country    
    }
  }

  console.log(await docClient.query(params).promise())
}

const list = async ({cursor = false} = {}) => {
  const params = {
    TableName: 'WineReviews'
  }

  if(cursor) {
    const ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64'));
    params.ExclusiveStartKey = ExclusiveStartKey
  }
  const {Items:results, Count, LastEvaluatedKey} = await docClient.scan(params).promise()

  const {Table: {ItemCount}} = await getApproximateItemCount()
  
  const response = {approximateTotalCount: ItemCount, results}

  if(LastEvaluatedKey) {
    response.cursor = Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64')
  }
  
  return response
}

module.exports = {
  getById,
  list,
  search
}