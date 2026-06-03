const { getChannel } = require('../config/rabbitmq');

const enviarMensagem = async (dados) => {
    try {
        const channel = getChannel();
        
        if (!channel) {
            console.error("[Producer] Erro: Canal do RabbitMQ não encontrado.");
            return;
        }

        // A fila onde vamos jogar os eventos de Reserva (que já está configurada no seu rabbitmq.js)
        const fila = 'reserva_status';

        // O RabbitMQ só entende mensagens em formato Buffer (bytes), por isso convertemos o JSON
        const mensagem = Buffer.from(JSON.stringify(dados));

        // Dispara a mensagem para a fila
        channel.sendToQueue(fila, mensagem);

        console.log(`[Producer] 📤 Mensagem enviada: ${dados.evento} (Reserva ID: ${dados.reserva_id})`);
        
    } catch (error) {
        console.error('[Producer] Falha ao enviar mensagem para o RabbitMQ:', error);
    }
};

// Exporta a função para que o controller a consiga usar
module.exports = {
    enviarMensagem
};