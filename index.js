const express = require('express');
const app = express();

// Rota principal
app.get('/', (req, res) => {
    res.send('Olá, mundo! Este é meu primeiro deploy na Vercel!');
});

// Porta definida pelo ambiente ou 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
