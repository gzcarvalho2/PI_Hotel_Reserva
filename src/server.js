require('dotenv').config();
const restify = require('restify');
// Importe a função de conexão que você já tem configurada
const { connectRabbitMQ } = require('./config/rabbitmq'); 
const { iniciarConsumidorPagamento } = require('./consumers/pagamento.consumer');
const { iniciarConsumidorQuarto } = require('./consumers/quarto.consumer');
const { iniciarConsumidorCliente } = require('./consumers/cliente.consumer');

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

require('./routes/auth.routes')(server);
require('./routes/quarto.routes')(server);
require('./routes/tipoQuarto.routes')(server);
require('./routes/foto.routes')(server);

// Altere para uma função async para poder usar o await no RabbitMQ
const PORT = 9532;

server.listen(PORT, async () => { 
    try {
        console.log(`${server.name} rodando em ${server.url}`); 
        
        // 1. Abre a conexão com o broker do RabbitMQ
        await connectRabbitMQ();
        
        // 2. LIGA TODOS OS CONSUMIDORES SIMULTANEAMENTE!
        await iniciarConsumidorPagamento();
        await iniciarConsumidorQuarto();
        await iniciarConsumidorCliente();
        
        console.log(`🚀 Todos os serviços de mensageria estão ativos!`);
        
    } catch (error) {
        console.error("Falha ao iniciar dependências:", error);
    }
});