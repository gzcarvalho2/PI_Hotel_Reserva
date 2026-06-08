const amqp = require('amqplib');

let channel;

async function connectRabbitMQ() {

    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    channel = await connection.createChannel();

    await channel.assertExchange('reserva_events', 'fanout', { durable: false });

    console.log('RabbitMQ conectado e Exchange configurado');
}

function getChannel() {
    return channel;
}

module.exports = {
    connectRabbitMQ,
    getChannel
};