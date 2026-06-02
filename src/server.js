require('dotenv').config();
const restify = require('restify');
// Importe a função de conexão que você já tem configurada
const { connectRabbitMQ } = require('./config/rabbitmq'); 
const { iniciarConsumidorPagamento } = require('./consumers/pagamento.consumer');
const { iniciarConsumidorQuarto } = require('./consumers/quarto.consumer');
const { iniciarConsumidorCliente } = require('./consumers/cliente.consumer');
const ReservaController = require('./controllers/reserva.controller');
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.get("/reserva", ReservaController.listar); 
server.post("/reserva", ReservaController.criar); 
server.get("/reserva/:id", ReservaController.buscarPorId); 
server.put("/reserva/:id", ReservaController.atualizar); 
server.del("/reserva/:id", ReservaController.deletar);

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