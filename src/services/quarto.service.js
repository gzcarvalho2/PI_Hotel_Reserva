const axios = require('axios');

const URL_MS_QUARTO = process.env.QUARTO_API_URL || 'http://academico3.rj.senac.br/20261prj5/hotel/quarto/api/quartos';

const verificarDisponibilidade = async (quarto_id) => {
    try {
        const resposta = await axios.get(`${URL_MS_QUARTO}/${quarto_id}`);
        // status 1 = Disponível no MS Quarto
        return resposta.data.status === 1;
    } catch (error) {
        console.error(`[Serviço Quarto] Erro ao verificar disponibilidade:`, error.message);
        throw new Error("Falha ao comunicar com o Microsserviço de Quarto ou Quarto inexistente.");
    }
};

const buscarDetalhesQuarto = async (quarto_id) => {
    try {
        const resposta = await axios.get(`${URL_MS_QUARTO}/${quarto_id}`);
        return resposta.data;
    } catch (error) {
        console.log(`[Serviço Quarto] Quarto ${quarto_id} não encontrado.`);
        return null;
    }
};

module.exports = { verificarDisponibilidade, buscarDetalhesQuarto };
