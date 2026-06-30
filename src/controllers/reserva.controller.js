// Importa a instância do Prisma que configuramos na pasta config
const prisma = require('../config/prisma');

// Importa o produtor do RabbitMQ!
const { enviarMensagem } = require('../producers/reserva.producer');

// Importação dos serviços de comunicação com outros microsserviços (AXIOS)
const quartoService = require('../services/quarto.service');
const clienteService = require('../services/cliente.service');

// 1. Listar todas as reservas
// Admin vê todas; cliente vê só as próprias (filtrado pelo cliente_id do JWT)
const listar = async (req, res) => {
    try {
        const where = req.user.role !== 'Admin'
            ? { cliente_id: req.user.cliente_id }
            : {};
        const reservas = await prisma.reserva.findMany({ where });
        res.send(200, reservas);
    } catch (error) {
        console.error("Erro ao listar:", error);
        res.send(500, { erro: "Erro interno ao buscar as reservas." });
    }
};

// 2. Buscar uma reserva específica por ID
// Admin acessa qualquer; cliente só acessa a própria
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

        if (req.user.role !== 'Admin' && reserva.cliente_id !== req.user.cliente_id) {
            res.send(403, { erro: 'Acesso negado.' });
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
                await clienteService.validarCliente(cliente_id, req.headers.authorization);
            } catch (apiError) {
                console.error("[Controller] Erro na validação do cliente:", apiError.message);
                res.send(400, { erro: apiError.message });
                return; // Impede a criação da reserva
            }
        }

        // =========================================================
        // VALIDAÇÃO SÍNCRONA: QUARTO (AXIOS)
        // Garante que o quarto existe e está habilitado para reserva (status 1 = Disponível).
        // status 2 (Ocupado manual) ou 3 (Manutenção) bloqueiam a reserva.
        // =========================================================
        if (quarto_id && reserva_checkin && reserva_checkout) {
            try {
                const quartoDisponivel = await quartoService.verificarDisponibilidade(quarto_id, reserva_checkin, reserva_checkout, req.headers.authorization);

                if (!quartoDisponivel) {
                    res.send(400, { erro: "O quarto selecionado não está disponível para reserva." });
                    return; // Impede a criação no Prisma
                }
            } catch (apiError) {
                console.error("[Controller] Erro na validação do quarto:", apiError.message);
                res.send(400, { erro: apiError.message || "Erro ao validar a disponibilidade do quarto." });
                return;
            }
        }

        // =========================================================
        // VALIDAÇÃO: CONFLITO DE DATAS (sobreposição com reservas ativas)
        // Um quarto está ocupado em [checkin, checkout) se já houver reserva ativa
        // (status 1 = Pendente ou 2 = Confirmada) cujo intervalo se sobrepõe.
        // Regra de sobreposição: existente.checkin < novo.checkout  E  existente.checkout > novo.checkin
        // (checkout é exclusivo — o quarto liberado no dia do checkout pode ser reservado no mesmo dia)
        // =========================================================
        if (quarto_id && reserva_checkin && reserva_checkout) {
            const checkinDate = new Date(reserva_checkin);
            const checkoutDate = new Date(reserva_checkout);

            if (isNaN(checkinDate) || isNaN(checkoutDate) || checkoutDate <= checkinDate) {
                res.send(400, { erro: "Datas inválidas: o check-out deve ser posterior ao check-in." });
                return;
            }

            const conflito = await prisma.reserva.findFirst({
                where: {
                    quarto_id: parseInt(quarto_id),
                    reserva_status: { in: [1, 2] }, // pendente ou confirmada
                    reserva_checkin: { lt: checkoutDate },
                    reserva_checkout: { gt: checkinDate }
                }
            });

            if (conflito) {
                res.send(409, { erro: "Já existe uma reserva para este quarto no período selecionado." });
                return; // Impede o overbooking
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