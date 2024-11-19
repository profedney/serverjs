const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Configurar o middleware para analisar o corpo das requisições
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos

// Caminho do arquivo para armazenar as mensagens
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Rota principal para exibir o fórum
app.get('/', (req, res) => {
    res.send(`
        <h1>Fórum Simples</h1>
        <form id="messageForm">
            <input type="text" name="name" placeholder="Seu nome" required />
            <textarea name="message" placeholder="Sua mensagem" required></textarea>
            <button type="submit">Enviar</button>
        </form>
        <div id="messages"></div>
        <script>
            // Exibir mensagens
            async function loadMessages() {
                const res = await fetch('/messages');
                const data = await res.json();
                const messagesDiv = document.getElementById('messages');
                messagesDiv.innerHTML = data.map(msg => 
                    \`<p><strong>\${msg.name}:</strong> \${msg.message}</p>\`
                ).join('');
            }
            
            // Enviar mensagens
            document.getElementById('messageForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);
                await fetch('/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                e.target.reset();
                loadMessages();
            });

            loadMessages();
        </script>
    `);
});

// Rota para obter mensagens
app.get('/messages', (req, res) => {
    fs.readFile(MESSAGES_FILE, 'utf8', (err, data) => {
        if (err) {
            // Caso o arquivo não exista, retorna uma lista vazia
            if (err.code === 'ENOENT') return res.json([]);
            return res.status(500).json({ error: 'Erro ao ler as mensagens' });
        }
        res.json(JSON.parse(data));
    });
});

// Rota para salvar mensagens
app.post('/messages', (req, res) => {
    const { name, message } = req.body;
    if (!name || !message) {
        return res.status(400).json({ error: 'Nome e mensagem são obrigatórios' });
    }

    const newMessage = { name, message };

    // Ler mensagens existentes e adicionar a nova
    fs.readFile(MESSAGES_FILE, 'utf8', (err, data) => {
        const messages = err && err.code === 'ENOENT' ? [] : JSON.parse(data || '[]');
        messages.push(newMessage);

        fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Erro ao salvar a mensagem' });
            }
            res.status(201).json(newMessage);
        });
    });
});

// Porta do servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
