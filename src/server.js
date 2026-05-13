const restify = require("restify");
const ReservaController = require("./controllers/reserva.contoller");

const server = restify.createServer({ 
  name: "api-reserva-hotel" 
});

server.use(restify.plugins.queryParser()); 
server.use(restify.plugins.bodyParser()); 

server.get("/reserva", ReservaController.listar); 
server.post("/reserva", ReservaController.criar); 

const PORT = 3000; 
server.listen(PORT, () => { 
    console.log(`${server.name} rodando em ${server.url}`); 
}); 