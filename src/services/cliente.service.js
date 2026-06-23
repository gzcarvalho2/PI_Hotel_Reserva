// src/services/cliente.service.js
const axios = require('axios');

// Remove barra final para evitar double-slash na URL montada
const URL_MS_CLIENTE = (process.env.CLIENTE_API_URL || 'http://ip_do_colega:porta/clientes').replace(/\/$/, '');

// Repassa o JWT do usuário que originou a requisição — assim o check de "dono" no MS Cliente passa
const validarCliente = async (cliente_id, authHeader) => {
    try {
        console.log(`[AXIOS] Vai perguntar à API Cliente se o ID ${cliente_id} existe...`);
        console.log(`[AXIOS] URL chamada: ${URL_MS_CLIENTE}/${cliente_id}`);

        const resposta = await axios.get(`${URL_MS_CLIENTE}/${cliente_id}`, {
            headers: { Authorization: authHeader }
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