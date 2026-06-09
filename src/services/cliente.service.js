// src/services/cliente.service.js
const axios = require('axios');

// O Jenkins vai puxar esta variável do Infisical para o servidor
const URL_MS_CLIENTE = process.env.CLIENTE_API_URL || 'http://ip_do_colega:porta/clientes';

const validarCliente = async (cliente_id) => {
    try {
        console.log(`[AXIOS] Vai perguntar à API Cliente se o ID ${cliente_id} existe...`);
        console.log(`[AXIOS] URL chamada: ${URL_MS_CLIENTE}/${cliente_id}`);

        // Faz a requisição GET à API do colega para buscar o cliente pelo ID
        const resposta = await axios.get(`${URL_MS_CLIENTE}/${cliente_id}`);
        
        console.log(`[AXIOS] Sucesso! A API do colega respondeu com os dados:`, resposta.data);
        // Se a API responder com sucesso (200 OK), o cliente existe.
        return resposta.data; 

    } catch (error) {
        
        console.log(`[AXIOS] Falhou! A API respondeu com status:`, error.response?.status);
        console.error(`[Serviço Cliente] Erro ao validar cliente ${cliente_id}:`, error.message);
        // Se der erro 404 (Não Encontrado) ou a API estiver fora do ar
        throw new Error("Cliente não encontrado na base de dados ou Microsserviço de Cliente indisponível.");
    }
};

module.exports = {
    validarCliente
};