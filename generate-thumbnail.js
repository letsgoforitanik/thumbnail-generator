const AWS = require('aws-sdk');
const sharp = require('sharp');


async function fetchImage(bucketName, fileName) {
    const s3Client = new AWS.S3();
    const response = await s3Client.getObject({ Bucket: bucketName, Key: fileName }).promise();
    return response.Body;
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

    const response = await s3Client.putObject(params).promise();

    return response;
}

async function generateThumbnail(event, context) {

    try {
        for (let record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const fileName = record.s3.object.key;
            const originalImage = await fetchImage(bucketName, fileName);
            const compressedJpeg = await compressImage(originalImage, 70);
            const destinationBucket = process.env.BUCKET_NAME;
            await saveImage(destinationBucket, fileName, compressedJpeg);
            console.log('Thumbnail created successfully for image :', fileName);
        }
    }
    catch (error) {
        console.log('Error ->', error);
    }

}

module.exports.handler = generateThumbnail;