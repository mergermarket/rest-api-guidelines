const AWS = require("aws-sdk");
const querystring = require("querystring");

const dynamodb = new AWS.DynamoDB({
  endpoint: "http://localhost:4569",
  region: "eu-west-1"
});
const docClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  endpoint: "http://localhost:4569",
  region: "eu-west-1"
});

const getById = async (id = false) => {
  if (!id) {
    throw new Error("no review id provided");
  }
  const params = {
    KeyConditionExpression: "id = :hkey",
    ExpressionAttributeValues: {
      ":hkey": id
    },
    TableName: "Wine"
  };

  const { Items: items } = await docClient.query(params).promise();

  if (items.length !== 1) {
    throw new Error("get by id returned more than one item");
  }

  return items[0];
};

const getApproximateItemCount = async () =>
  await dynamodb.describeTable({ TableName: "Wine" }).promise();

const search = async ({ country = false, size = 10, after } = {}) => {
  if (!country) {
    throw new Error("Country not passed");
  }

  const params = {
    TableName: "Wine",
    IndexName: "ArticlesByKind",
    KeyConditionExpression: "country = :hkey",
    ExpressionAttributeValues: {
      ":hkey": country
    },
    Limit: size
  };

  if (after) {
    const ExclusiveStartKey = JSON.parse(Buffer.from(after, "base64"));
    params.ExclusiveStartKey = ExclusiveStartKey;
  }

  const { Items: results, LastEvaluatedKey } = await docClient
    .query(params)
    .promise();

  const response = { results };

  if (LastEvaluatedKey) {
    const nextCursor = LastEvaluatedKey;
    const responseParams = { size: size, country: country };
    responseParams.after = buildCursor(nextCursor);
    response.after = buildUrl("reviews/search", responseParams);
  }

  return response;
};

const buildCursor = key => Buffer.from(JSON.stringify(key)).toString("base64");

const getResultKeys = result => ({
  geography: result.geography,
  id: result.id
});

const buildUrl = (path, params) =>
  `http://localhost:10010/${path}?${querystring.encode(params)}`;

const list = async ({ after, size, country }) => {
  let geography = null;
  if (country) {
    geography = country;
  }
  const params = {
    TableName: "Wine",
    IndexName: "ArticlesByKind",
    KeyConditionExpression: `kind = :hkey ${geography &&
      "and begins_with(geography, :rkey)"}`,
    ExpressionAttributeValues: {
      ":hkey": "review",
      ":rkey": geography
    },
    Limit: size
  };

  if (after) {
    const ExclusiveStartKey = JSON.parse(Buffer.from(after, "base64"));
    params.ExclusiveStartKey = ExclusiveStartKey;
  }

  const { Items: results, LastEvaluatedKey } = await docClient
    .query(params)
    .promise();

  const {
    Table: { ItemCount }
  } = await getApproximateItemCount();

  const response = { approximateTotalCount: ItemCount, results };

  if (LastEvaluatedKey) {
    const nextCursor = getResultKeys(results[results.length - 1]);
    const responseParams = { size: size };
    responseParams.after = buildCursor(nextCursor);
    response.after = buildUrl("reviews", responseParams);
  }

  return response;
};

module.exports = {
  getById,
  list,
  search
};
