const AWS = require('aws-sdk');
const sharp = require('sharp');
const crypto = require('crypto');

function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

async function fetchImage(bucketName, fileName) {
    const s3Client = new AWS.S3();
    return await s3Client.getObject({ Bucket: bucketName, Key: fileName }).promise();
}

async function compressImage(image, quality) {
    const compressed = await sharp(image).jpeg({ quality }).toBuffer();
    return compressed;
}

async function saveImage(bucketName, fileName, image) {

    const s3Client = new AWS.S3();

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: image,
        ContentType: 'image/jpeg'
    };

    return await s3Client.putObject(params).promise();

}

async function getMetadata(bucket, key) {
    const s3Client = new AWS.S3();
    return await s3Client.headObject({ Bucket: bucket, Key: key }).promise();
}

async function saveToTable({ dynamoTable, ...params }) {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    return await dynamoClient.put({ TableName: params.dynamoTable, Item: params }).promise();
}

async function generateThumbnail(event, context) {

    try {
        for (let record of event.records) {
            const bucketName = record.s3.bucket.name;
            const fileName = record.s3.object.key;

            const originalImageResponse = await fetchImage(bucketName, fileName);
            const compressedJpeg = await compressImage(originalImageResponse.Body, 70);

            const destinationBucket = process.env.BUCKET_NAME;
            const dynamoTable = process.env.DYNAMODB_TABLE;

            await saveImage(destinationBucket, fileName, compressedJpeg);
            const thumbnailMetadata = await getMetadata(destinationBucket, fileName);

            const saveParams = {
                id: generateId(),
                fileName: fileName,
                sourceBucket: bucketName,
                destinationBucket: destinationBucket,
                originalSize: originalImageResponse.ContentLength,
                compressedSize: thumbnailMetadata.ContentLength,
                creationDateTime: new Date().toISOString(),
                dynamoTable: dynamoTable
            };

            await saveToTable(saveParams);

            console.log('Thumbnail created successfully for image :', fileName);
        }
    }
    catch (error) {
        console.log('Error ->', error);
    }

}

module.exports.handler = generateThumbnail;