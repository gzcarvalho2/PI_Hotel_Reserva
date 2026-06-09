// Importa a instância do Prisma que configuramos na pasta config
const prisma = require('../config/prisma');

// Importa o produtor do RabbitMQ!
const { enviarMensagem } = require('../producers/reserva.producer');

// Importação dos serviços de comunicação com outros microsserviços (AXIOS)
const quartoService = require('../services/quarto.service');
const clienteService = require('../services/cliente.service');

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
            pagamento_status,
            tipo_quarto_id
        } = req.body;

        // =========================================================
        // VALIDAÇÃO SÍNCRONA: CLIENTE (AXIOS)
        // =========================================================
        if (cliente_id) {
            try {
                await clienteService.validarCliente(cliente_id);
            } catch (apiError) {
                console.error("[Controller] Erro na validação do cliente:", apiError.message);
                res.send(400, { erro: apiError.message });
                return; // Impede a criação da reserva
            }
        }

        // =========================================================
        // VALIDAÇÃO SÍNCRONA: QUARTO (AXIOS)
        // =========================================================
        if (quarto_id && reserva_checkin && reserva_checkout) {
            try {
                const quartoDisponivel = await quartoService.verificarDisponibilidade(quarto_id, reserva_checkin, reserva_checkout);
                
                if (!quartoDisponivel) {
                    res.send(400, { erro: "O quarto selecionado não está disponível nestas datas." });
                    return; // Impede a criação no Prisma
                }
            } catch (apiError) {
                console.error("[Controller] Erro na validação do quarto:", apiError.message);
                res.send(400, { erro: apiError.message || "Erro ao validar a disponibilidade do quarto." });
                return;
            }
        }
        // =========================================================

        const novaReserva = await prisma.reserva.create({
            data: {
                reserva_checkin: new Date(reserva_checkin),
                reserva_checkout: new Date(reserva_checkout),
                reserva_status: parseInt(reserva_status),
                cliente_id: cliente_id ? parseInt(cliente_id) : null,
                quarto_id: quarto_id ? parseInt(quarto_id) : null,
                pagamento_status: pagamento_status ? parseInt(pagamento_status) : null,
                tipo_quarto_id: parseInt(tipo_quarto_id)
            }
        });

        // =========================================================
        // AVISA A REDE QUE A RESERVA FOI CRIADA (RabbitMQ)
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

        // Avisar a rede que a reserva foi atualizada
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

        // Avisar a rede que a reserva foi cancelada/removida
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