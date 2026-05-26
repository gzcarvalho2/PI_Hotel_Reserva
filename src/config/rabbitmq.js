const amqp = require('amqplib');

let channel;

async function connectRabbitMQ() {

    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    channel = await connection.createChannel();

    await channel.assertQueue('reserva_status');

    console.log('RabbitMQ conectado');
}

function getChannel() {
    return channel;
}

module.exports = {
    connectRabbitMQ,
    getChannel
};