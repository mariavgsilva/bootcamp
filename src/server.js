const express = require("express");
const app = express();
require("dotenv").config();
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const authMiddleware = require("./middleware/auth");
const { getUsers, saveUsers } = require("./db");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 3000; app.use(express.json()); // rotas públicas 
app.use('/auth', authRoutes); // middleware global de autenticação para rotas abaixo 
app.use('/users', authMiddleware, userRoutes); // health 
app.get('/', (req, res) => res.json({ message: 'API rodando' })); // seed admin: se não houver admin, cria um usando .env 
async function seedAdminIfNeeded() { 
    const users = getUsers(); 
    const adminExists = users.some(u => u.role === 'admin'); 
    if (!adminExists) { const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'; 
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123'; 
        const hashed = await bcrypt.hash(adminPass, 10); 
        const adminUser = { 
            id: 'admin-' + Date.now(), 
            name: 'Administrator', 
            email: adminEmail.toLowerCase(), 
            password: hashed, age: null, 
            role: 'admin', 
            createdAt: new Date().toISOString() 
        }; 
users.push(adminUser);
saveUsers(users); 
console.log('Admin criado automaticamente:'); 
console.log(` email: ${adminEmail}`); 
console.log(` password: ${adminPass}`); 
console.log('Altere ADMIN_PASSWORD e JWT_SECRET antes de usar em produção.'); 
 }
}

seedAdminIfNeeded().then(() => { 
    app.listen(PORT, () => { 
        console.log(`Servidor rodando na porta ${PORT}`); 
    }); 
});