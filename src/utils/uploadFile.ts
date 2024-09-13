import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const uploadFile = async (fie: File, pathString = '', encodeName = true) => {
    try {
        const extension = fie.name.split('.').pop();

        let fileNameToBeSaved;

        if(encodeName){
            fileNameToBeSaved = `${Buffer.from(fie.name + new Date().getDate()).toString('base64')}.${extension}`;
        } else {
            fileNameToBeSaved = `${fie.name}`;
        }

        const newPath = `${pathString}/${fileNameToBeSaved}`;
        const buffer = Buffer.from(await fie.arrayBuffer());

        if (
            process.env.S3_UPLOAD_REGION == undefined ||
            process.env.S3_UPLOAD_KEY == undefined ||
            process.env.S3_UPLOAD_SECRET == undefined ||
            process.env.S3_UPLOAD_BUCKET == undefined
        ) {
            return
        }

        const s3Client = new S3Client({
            region: process.env.S3_UPLOAD_REGION,
            credentials: {
                accessKeyId: process.env.S3_UPLOAD_KEY,
                secretAccessKey: process.env.S3_UPLOAD_SECRET,
            },
        })

        const params = {
            Bucket: process.env.S3_UPLOAD_BUCKET,
            Key: `uploads/${newPath}`,
            Body: buffer,
        }

        const command = new PutObjectCommand(params)
        await s3Client.send(command)

        return { fileName: `${fileNameToBeSaved}` };
    } catch (error) {
        console.error(error)
    }
}

export default uploadFile
