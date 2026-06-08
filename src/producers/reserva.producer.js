const { getChannel } = require('../config/rabbitmq');

const enviarMensagem = async (dados) => {
    try {
        const channel = getChannel();
        
        if (!channel) {
            console.error("[Producer] Erro: Canal do RabbitMQ não encontrado.");
            return;
        }

        // MUDANÇA 1: Não usamos mais o nome de uma fila específica
        // Usamos o nome do Exchange que será configurado no rabbitmq.js
        const exchange = 'reserva_events';

        const mensagem = Buffer.from(JSON.stringify(dados));

        // MUDANÇA 2: Usamos 'publish' em vez de 'sendToQueue'
        // O primeiro argumento é o exchange, o segundo é a chave de roteamento (vazia para fanout)
        channel.publish(exchange, '', mensagem);

        console.log(`[Producer] 📤 Mensagem enviada para o Exchange '${exchange}': ${dados.evento}`);
        
    } catch (error) {
        console.error('[Producer] Falha ao enviar mensagem para o RabbitMQ:', error);
    }
};

module.exports = {
    enviarMensagem
};