const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Rota principal para exibir o fórum
app.get('/', (req, res) => {
    // Ler as mensagens do arquivo
    fs.readFile(MESSAGES_FILE, 'utf8', (err, data) => {
        const messages = err && err.code === 'ENOENT' ? [] : JSON.parse(data || '[]');

        // Gerar a página HTML com as mensagens
        const messageHTML = messages.map(msg => 
            `<p><strong>${msg.name}:</strong> ${msg.message}</p>`
        ).join('');

        res.send(`
            <h1>Fórum Simples</h1>
            <form id="messageForm">
                <input type="text" name="name" placeholder="Seu nome" required />
                <textarea name="message" placeholder="Sua mensagem" required></textarea>
                <button type="submit">Enviar</button>
            </form>
            <div id="messages">${messageHTML}</div>
            <script>
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
                    // Atualizar mensagens sem recarregar a página
                    const res = await fetch('/messages');
                    const messages = await res.json();
                    document.getElementById('messages').innerHTML = messages.map(msg => 
                        \`<p><strong>\${msg.name}:</strong> \${msg.message}</p>\`
                    ).join('');
                });
            </script>
        `);
    });
});

// Rota para obter mensagens (ainda pode ser útil para o script)
app.get('/messages', (req, res) => {
    fs.readFile(MESSAGES_FILE, 'utf8', (err, data) => {
        if (err) {
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
