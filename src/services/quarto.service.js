// src/services/quarto.service.js
const axios = require('axios');

// Idealmente, isto ficará no seu Infisical/ .env no futuro
// Por agora, coloque o IP e porta que o seu colega do MS de Quarto está a usar
const URL_MS_QUARTO = process.env.QUARTO_API_URL || 'http://ip_do_colega:porta/quartos';

const verificarDisponibilidade = async (quarto_id, data_checkin, data_checkout) => {
    try {
        // Faz uma requisição GET ao colega perguntando se está livre
        // A rota exata (/disponibilidade) depende de como o seu colega programou!
        const resposta = await axios.get(`${URL_MS_QUARTO}/${quarto_id}/disponibilidade`, {
            params: { checkin: data_checkin, checkout: data_checkout }
        });
        
        // Retorna o que o colega responder (ex: true ou false)
        return resposta.data; 

    } catch (error) {
        console.error(`[Serviço Quarto] Erro ao verificar disponibilidade:`, error.message);
        // Se a API do colega estiver fora do ar ou der erro (ex: 404 Quarto não existe)
        throw new Error("Falha ao comunicar com o Microsserviço de Quarto ou Quarto inexistente.");
    }
};

const buscarDetalhesQuarto = async (quarto_id) => {
    try {
        const resposta = await axios.get(`${URL_MS_QUARTO}/${quarto_id}`);
        return resposta.data;
    } catch (error) {
        console.log(`[Serviço Quarto] Quarto ${quarto_id} não encontrado.`);
        return null; // Retorna null para não quebrar a sua listagem se falhar
    }
};

module.exports = {
    verificarDisponibilidade,
    buscarDetalhesQuarto
};