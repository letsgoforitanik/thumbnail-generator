const AWS = require('aws-sdk');


async function getImagesMetadata() {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const tableName = process.env.DYNAMODB_TABLE;

    const response = await dynamoClient.scan({ TableName: tableName }).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(response.Items)
    }
}

async function getImageMetadataById(event) {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const tableName = process.env.DYNAMODB_TABLE;

    const itemId = event.pathParameters.id;

    const response = await dynamoClient.get({ TableName: tableName, Key: { id: itemId } }).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(response.Item)
    }

}

module.exports = { getImagesMetadata, getImageMetadataById };