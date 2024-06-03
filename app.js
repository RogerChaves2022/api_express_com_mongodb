const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Joi = require("@hapi/joi");
const cors = require("cors");

const app = express();
const port = 8080;

// Habilitar CORS
app.use(cors());

// Conectar ao MongoDB
mongoose.connect("mongodb://localhost:27017/local");

// Definir o esquema do modelo
const produtoSchema = new mongoose.Schema({
  nome: String,
  valor: Number,
  movimentos: [
    {
      quantidade: Number,
      data: { type: Date, default: Date.now },
    },
  ],
});

// Definir o esquema de validação Joi para produto
const produtoSchemaJoi = Joi.object({
  nome: Joi.string().required(),
  valor: Joi.number().required(),
  movimentos: Joi.array().items(
    Joi.object({
      quantidade: Joi.number().required(),
      data: Joi.date().default(new Date()),
    })
  ),
});

const movimentoSchemaJoi = Joi.object({
  quantidade: Joi.number().required(),
  data: Joi.date().default(new Date()),
});

// Middleware para validar os dados do produto
function validarDadosProduto(req, res, next) {
  const { error } = produtoSchemaJoi.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  next();
}

// Middleware para validar os dados do Movimento
function validarDadosMovimento(req, res, next) {
  const { error } = movimentoSchemaJoi.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  next();
}

// Criar o modelo
const Produto = mongoose.model("produtos", produtoSchema);

// Configurar o body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rotas CRUD
// Rota Create / Criacão de Produto/ Metodo POST
app.post("/produto", validarDadosProduto, (req, res) => {
  try {
    const novoProduto = new Produto(req.body);
    novoProduto.save();
    res.status(201).send({ mensagem: "Produto criado com sucesso" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rota Create / Criacão movimento / Metodo POST
app.post("/produto/:id/movimento", validarDadosMovimento, async (req, res) => {
  try {
    const produtoEncontrado = await Produto.findById(req.params.id);
    produtoEncontrado.movimentos.addToSet(req.body);
    produtoEncontrado.save();
    res.status(201).send({ mensagem: "Movimento criado com sucesso" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rota Read / Leitura / Metodo GET
app.get("/produto", async (req, res) => {
  try {
    const lista = await Produto.find({});
    res.status(200).send(lista);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rota Read / Leitura de apenas um Produto por id / Metodo GET
app.get("/produto/:id", async (req, res) => {
  try {
    const produtoEncontrado = await Produto.findById(req.params.id);
    if (!produtoEncontrado) {
      return res.status(404).send({ mensagem: "Produto não encontrado" });
    }
    res.status(200).send(produtoEncontrado);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rota Update / atualização / Metodo PUT
app.put("/produto/:id", validarDadosProduto, async (req, res) => {
  try {
    const produtoAtualizado = await Produto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!produtoAtualizado) {
      return res.status(404).send({ mensagem: "Usuário não encontrado" });
    }

    res.status(200).send(produtoAtualizado);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rota Delete / deletar Produto por id / Metodo DELET
app.delete("/produto/:id", async (req, res) => {
  try {
    const deletado = await Produto.findByIdAndDelete(req.params.id);

    if (!deletado) {
      return res.status(404).send({ mensagem: "Produto não encontrado" });
    }

    res.status(204).send({ mensagem: "Produto excluído com sucesso" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Rota para retornar dados para alimentar o dashboard
app.get("/api/dados", async (req, res) => {
  try {
    // Consulta ao banco de dados para obter os dados necessários
    const produtos = await Produto.find();

    // Preparar os dados para o gráfico
    const labels = produtos.map((produto) => produto.nome); // Use 'nome' como rótulos no gráfico
    const quantidades = produtos.map((produto) => {
      // Para cada produto, calcular a soma das quantidades de movimentos
      return produto.movimentos.reduce(
        (acc, movimento) => acc + movimento.quantidade,
        0
      );
    });

    res.json({ labels, quantidades });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter os dados" });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
