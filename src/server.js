require('dotenv').config();
const restify = require('restify');
const { connectRabbitMQ } = require('./config/rabbitmq'); 
const { iniciarConsumidorPagamento } = require('./consumers/pagamento.consumer');
const { iniciarConsumidorQuarto } = require('./consumers/quarto.consumer');
const { iniciarConsumidorCliente } = require('./consumers/cliente.consumer');

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// ==========================================
// IMPORTAR E INICIAR AS ROTAS
// ==========================================
require('./routes/reserva.routes')(server);

const PORT = 9532;

// ADICIONE O '0.0.0.0' AQUI:
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