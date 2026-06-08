const { getChannel } = require('../config/rabbitmq');
const prisma = require('../config/prisma');

const iniciarConsumidorPagamento = async () => {
    try {
        const channel = getChannel();
        
        // Esta é a fila onde o microsserviço de Pagamento vai jogar as respostas
        const fila = 'pagamento_queue'; 

        // Garante que a fila existe no RabbitMQ
        await channel.assertQueue(fila);

        console.log(`[Consumer] 🎧 Reserva aguardando eventos na fila '${fila}'...`);

        // Fica escutando as mensagens chegarem
        channel.consume(fila, async (msg) => {
            if (msg !== null) {
                const dadosEvento = JSON.parse(msg.content.toString());
                
                // MUDAR AQUI: Imprime o JSON inteiro para você inspecionar!
                console.log(`[Consumer] 🕵️ DADOS COMPLETOS DO CLIENTE:`, dadosEvento);

                try {
                    // Se o pagamento foi aprovado, atualiza a reserva no Prisma!
                    if (dadosEvento.evento === 'PAGAMENTO_APROVADO') {
                        await prisma.reserva.update({
                            where: { reserva_id: dadosEvento.reserva_id },
                            data: { 
                                status_pagamento: 1, // Ex: 1 = Pago
                                reserva_status: 2    // Ex: 2 = Confirmada
                            }
                        });
                        console.log(`✅ Reserva ${dadosEvento.reserva_id} atualizada para Paga!`);
                    } 
                    // Se o pagamento foi recusado (sem limite, etc)
                    else if (dadosEvento.evento === 'PAGAMENTO_RECUSADO') {
                        await prisma.reserva.update({
                            where: { reserva_id: dadosEvento.reserva_id },
                            data: { 
                                status_pagamento: 2, // Ex: 2 = Recusado
                                reserva_status: 3    // Ex: 3 = Cancelada
                            }
                        });
                        console.log(`❌ Reserva ${dadosEvento.reserva_id} cancelada por falta de pagamento.`);
                    }

                    // AVISA O RABBITMQ QUE DEU TUDO CERTO E ELE PODE APAGAR A MENSAGEM
                    channel.ack(msg);

                } catch (dbError) {
                    console.error("Erro ao atualizar o banco de dados:", dbError);
                    // Não damos o ACK aqui, assim o RabbitMQ tenta enviar de novo depois
                }
            }
        });
    } catch (error) {
        console.error('[Consumer] Erro ao iniciar o consumidor de Pagamento:', error);
    }
};

module.exports = {
    iniciarConsumidorPagamento
};