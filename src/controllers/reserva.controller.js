// Importa a instância do Prisma que configuramos na pasta config
const prisma = require('../config/prisma');

// NOVO: Importa o produtor do RabbitMQ!
const { enviarMensagem } = require('../producers/reserva.producer');

// 1. Listar todas as reservas
const listar = async (req, res) => {
    try {
        const reservas = await prisma.reserva.findMany();
        res.send(200, reservas);
    } catch (error) {
        console.error("Erro ao listar:", error);
        res.send(500, { erro: "Erro interno ao buscar as reservas." });
    }
};

// 2. Buscar uma reserva específica por ID
const buscarPorId = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const reserva = await prisma.reserva.findUnique({
            where: { reserva_id: id }
        });

        if (!reserva) {
            res.send(404, { erro: "Reserva não encontrada." });
            return; 
        }

        res.send(200, reserva);
    } catch (error) {
        console.error("Erro ao buscar:", error);
        res.send(500, { erro: "Erro interno ao buscar a reserva." });
    }
};

// 3. Criar uma nova reserva
const criar = async (req, res) => {
    try {
        const {
            reserva_checkin,
            reserva_checkout,
            reserva_status,
            cliente_id,
            quarto_id,
            status_pagamento,
            tipo_quarto_id
        } = req.body;

        const novaReserva = await prisma.reserva.create({
            data: {
                reserva_checkin: new Date(reserva_checkin),
                reserva_checkout: new Date(reserva_checkout),
                reserva_status: parseInt(reserva_status),
                cliente_id: cliente_id ? parseInt(cliente_id) : null,
                quarto_id: quarto_id ? parseInt(quarto_id) : null,
                status_pagamento: status_pagamento ? parseInt(status_pagamento) : null,
                tipo_quarto_id: parseInt(tipo_quarto_id)
            }
        });

        // =========================================================
        // NOVO: AVISA A REDE QUE A RESERVA FOI CRIADA
        // =========================================================
        await enviarMensagem({
            evento: 'RESERVA_CRIADA',
            reserva_id: novaReserva.reserva_id,
            cliente_id: novaReserva.cliente_id,
            quarto_id: novaReserva.quarto_id,
            status: novaReserva.reserva_status
        });
        // =========================================================

        res.send(201, novaReserva);
    } catch (error) {
        console.error("Erro ao criar:", error);
        res.send(500, { erro: "Erro interno ao criar a reserva. Verifique os dados enviados." });
    }
};

// 4. Atualizar uma reserva existente
const atualizar = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dados = req.body;

        if (dados.reserva_checkin) dados.reserva_checkin = new Date(dados.reserva_checkin);
        if (dados.reserva_checkout) dados.reserva_checkout = new Date(dados.reserva_checkout);

        const reservaAtualizada = await prisma.reserva.update({
            where: { reserva_id: id },
            data: dados
        });

        // NOVO: Pode avisar a rede que a reserva foi atualizada (Opcional, mas recomendado)
        await enviarMensagem({
            evento: 'RESERVA_ATUALIZADA',
            reserva_id: reservaAtualizada.reserva_id,
            status: reservaAtualizada.reserva_status
        });

        res.send(200, reservaAtualizada);
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        res.send(500, { erro: "Erro interno ao atualizar a reserva ou reserva não encontrada." });
    }
};

// 5. Deletar uma reserva
const deletar = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        await prisma.reserva.delete({
            where: { reserva_id: id }
        });

        // NOVO: Pode avisar a rede que a reserva foi cancelada/removida (Opcional)
        await enviarMensagem({
            evento: 'RESERVA_REMOVIDA',
            reserva_id: id
        });

        res.send(204); 
    } catch (error) {
        console.error("Erro ao deletar:", error);
        res.send(500, { erro: "Erro interno ao deletar a reserva." });
    }
};

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};