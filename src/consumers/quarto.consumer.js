const { getChannel } = require('../config/rabbitmq');

async function consumirMensagens() {

    const channel = getChannel();

    channel.consume('quarto_status', (msg) => {

        const dados = JSON.parse(msg.content.toString());

        console.log('Mensagem recebida:', dados);

        channel.ack(msg);
    });
}

module.exports = consumirMensagens;