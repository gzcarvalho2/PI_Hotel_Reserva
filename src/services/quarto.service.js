const axios = require('axios');
const jwt = require('jsonwebtoken');

const URL_MS_QUARTO = (process.env.QUARTO_API_URL || 'http://academico3.rj.senac.br/20261prj5/hotel/quarto/api/quartos').replace(/\/$/, '');

const gerarTokenServico = () => {
    return jwt.sign(
        { id: 0, login: 'reserva-service', role: 'Service' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const verificarDisponibilidade = async (quarto_id) => {
    try {
        const token = gerarTokenServico();
        const resposta = await axios.get(`${URL_MS_QUARTO}/${quarto_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // status 1 = Disponível no MS Quarto
        return resposta.data.status === 1;
    } catch (error) {
        console.error(`[Serviço Quarto] Erro ao verificar disponibilidade:`, error.message);
        throw new Error("Falha ao comunicar com o Microsserviço de Quarto ou Quarto inexistente.");
    }
};

const buscarDetalhesQuarto = async (quarto_id) => {
    try {
        const token = gerarTokenServico();
        const resposta = await axios.get(`${URL_MS_QUARTO}/${quarto_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return resposta.data;
    } catch (error) {
        console.log(`[Serviço Quarto] Quarto ${quarto_id} não encontrado.`);
        return null;
    }
};

module.exports = { verificarDisponibilidade, buscarDetalhesQuarto };
