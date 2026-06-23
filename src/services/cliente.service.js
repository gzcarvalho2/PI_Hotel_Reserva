// src/services/cliente.service.js
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Remove barra final para evitar double-slash na URL montada
const URL_MS_CLIENTE = (process.env.CLIENTE_API_URL || 'http://ip_do_colega:porta/clientes').replace(/\/$/, '');

// Gera token de serviço usando o mesmo JWT_SECRET compartilhado entre os microsserviços
const gerarTokenServico = () => {
    return jwt.sign(
        { id: 0, login: 'reserva-service', role: 'Admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const validarCliente = async (cliente_id) => {
    try {
        console.log(`[AXIOS] Vai perguntar à API Cliente se o ID ${cliente_id} existe...`);
        console.log(`[AXIOS] URL chamada: ${URL_MS_CLIENTE}/${cliente_id}`);

        const token = gerarTokenServico();

        const resposta = await axios.get(`${URL_MS_CLIENTE}/${cliente_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`[AXIOS] Sucesso! A API do colega respondeu com os dados:`, resposta.data);
        return resposta.data;

    } catch (error) {
        console.log(`[AXIOS] Falhou! A API respondeu com status:`, error.response?.status);
        console.error(`[Serviço Cliente] Erro ao validar cliente ${cliente_id}:`, error.message);
        throw new Error("Cliente não encontrado na base de dados ou Microsserviço de Cliente indisponível.");
    }
};

module.exports = {
    validarCliente
};