const { getChannel } = require('../config/rabbitmq');
const prisma = require('../config/prisma');

const iniciarConsumidorQuarto = async () => {
    try {
        const channel = getChannel();
        
        // Fila exata que o microsserviço de Quarto utiliza
        const fila = 'quarto_status'; 

        await channel.assertQueue(fila);
        console.log(`[Consumer] 🎧 Reserva aguardando eventos na fila '${fila}'...`);

        channel.consume(fila, async (msg) => {
            if (msg !== null) {
                const dadosEvento = JSON.parse(msg.content.toString());
                console.log(`[Consumer] 📥 Evento de Quarto recebido:`, dadosEvento.evento);

                try {
                    // Se o quarto for removido do sistema, cancelamos as reservas futuras vinculadas a ele
                    if (dadosEvento.evento === 'QUARTO_REMOVIDO') {
                        await prisma.reserva.updateMany({
                            where: { 
                                quarto_id: dadosEvento.id,
                                reserva_status: { in: [1, 2] } // Ex: 1 = Pendente, 2 = Confirmada
                            },
                            data: { 
                                reserva_status: 3 // Ex: 3 = Cancelada (Quarto Inexistente)
                            }
                        });
                        console.log(`⚠️ Reservas para o Quarto ${dadosEvento.id} foram canceladas pois o quarto foi removido.`);
                    } 
                    // Se o quarto for atualizado (ex: entrou em manutenção e ficou indisponível)
                    else if (dadosEvento.evento === 'QUARTO_ATUALIZADO' && dadosEvento.status === 0) { // Supondo 0 = Indisponível
                        await prisma.reserva.updateMany({
                            where: { 
                                quarto_id: dadosEvento.id,
                                reserva_status: { in: [1, 2] }
                            },
                            data: { 
                                reserva_status: 4 // Ex: 4 = Requer Realocação
                            }
                        });
                        console.log(`⚠️ Atenção: Quarto ${dadosEvento.id} ficou indisponível. Reservas marcadas para realocação.`);
                    }

                    channel.ack(msg);

                } catch (dbError) {
                    console.error("Erro ao atualizar o banco de dados (Quarto):", dbError);
                }
            }
        });
    } catch (error) {
        console.error('[Consumer] Erro ao iniciar o consumidor de Quarto:', error);
    }
};

module.exports = {
    iniciarConsumidorQuarto
};