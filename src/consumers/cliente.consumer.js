const { getChannel } = require('../config/rabbitmq');
const prisma = require('../config/prisma');

const iniciarConsumidorCliente = async () => {
    try {
        const channel = getChannel();
        
        const fila = 'cliente_status'; 

        await channel.assertQueue(fila);
        console.log(`[Consumer] 🎧 Reserva aguardando eventos na fila '${fila}'...`);

        channel.consume(fila, async (msg) => {
            if (msg !== null) {
                const dadosEvento = JSON.parse(msg.content.toString());
                console.log(`[Consumer] 📥 Evento de Cliente recebido:`, dadosEvento.evento);

                try {
                    // Se o cliente excluir a conta
                    if (dadosEvento.evento === 'CLIENTE_REMOVIDO') {
                        // Como o Prisma permite que cliente_id seja null, nós apenas removemos a referência
                        await prisma.reserva.updateMany({
                            where: { cliente_id: dadosEvento.id },
                            data: { cliente_id: null }
                        });
                        console.log(`🗑️ Cliente ${dadosEvento.id} removido. Reservas anonimizadas com sucesso.`);
                    }

                    channel.ack(msg);

                } catch (dbError) {
                    console.error("Erro ao atualizar o banco de dados (Cliente):", dbError);
                }
            }
        });
    } catch (error) {
        console.error('[Consumer] Erro ao iniciar o consumidor de Cliente:', error);
    }
};

module.exports = {
    iniciarConsumidorCliente
};