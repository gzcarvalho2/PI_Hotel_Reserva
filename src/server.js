require('dotenv').config();
const restify = require('restify');
const corsMiddleware = require("restify-cors-middleware2"); // NOVO IMPORT
const { connectRabbitMQ } = require('./config/rabbitmq'); 
const { iniciarConsumidorPagamento } = require('./consumers/pagamento.consumer');
const { iniciarConsumidorQuarto } = require('./consumers/quarto.consumer');
const { iniciarConsumidorCliente } = require('./consumers/cliente.consumer');

const server = restify.createServer();

// ==========================================
// CONFIGURAÇÃO DO CORS
// ==========================================
const cors = corsMiddleware({
  origins: ['*'],           // Permite qualquer origem (Frontend, Postman, outros MS)
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['Authorization'],
});

// A aplicação do CORS deve acontecer ANTES dos parsers e das rotas
server.pre(cors.preflight);
server.use(cors.actual);

// ==========================================
// MIDDLEWARES PADRÃO
// ==========================================
server.use(restify.plugins.queryParser()); // Útil para pegar variáveis na URL (ex: ?id=1)
server.use(restify.plugins.bodyParser());

// ==========================================
// IMPORTAR E INICIAR AS ROTAS
// ==========================================
require('./routes/reserva.routes')(server);

const PORT = 9532;

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR (com 0.0.0.0 para Docker)
// ==========================================
server.listen(PORT, '0.0.0.0', async () => { 
    try {
        console.log(`${server.name} a correr em ${server.url}`); 
        
        await connectRabbitMQ();
        await iniciarConsumidorPagamento();
        await iniciarConsumidorQuarto();
        await iniciarConsumidorCliente();
        
        console.log(`🚀 Todos os serviços de mensageria estão ativos!`);
        
    } catch (error) {
        console.error("Falha ao iniciar dependências:", error);
    }
});