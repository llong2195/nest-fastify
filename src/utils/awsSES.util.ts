import * as AWS from 'aws-sdk';

const singletonEnforcer = Symbol();

class AwsSesSever {
    awsSesServer: any;
    static awsSesServerInstance: any;

    constructor(enforcer: any) {
        if (enforcer !== singletonEnforcer) {
            throw new Error('Cannot initialize AWS SES server single instance');
        }
    }

    static get instance() {
        if (!this.awsSesServerInstance) {
            this.awsSesServerInstance = new AwsSesSever(singletonEnforcer);
        }

        return this.awsSesServerInstance;
    }

    config() {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        this.awsSesServer = new AWS.SES();
    }

    sendEmail(params) {
        return this.awsSesServer.sendEmail(params).promise();
    }
}

export default AwsSesSever.instance;
