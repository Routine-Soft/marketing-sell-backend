import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    nomeCompleto: { type: String, required: true },
    // Sempre sem espaços e em minúsculas, para o login não depender de como a pessoa digitou.
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        set: (valor) => (typeof valor === 'string' ? valor.replace(/\s+/g, '') : valor),
    },
    password: { type: String, required: true },
    telefone: { type: String, default: '' },
    nomeEmpresa: { type: String, required: true },

    role: {
        type: String,
        enum: ['super_admin', 'admin', 'membro'],
        default: 'admin',
    },

    // Páginas de busca no Google por mês (só vale no dono da conta). null = padrão do .env (GOOGLE_COTA_MENSAL).
    cotaGoogleMensal: { type: Number, default: null },

    // tenantId aponta pra si mesmo quando o usuário é o dono da conta (admin).
    // Usuários criados depois dentro da mesma conta herdam esse mesmo tenantId.
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },

    tokenRefresh: { type: String, required: false },
}, { timestamps: true })

userSchema.methods.toJSON = function () {
    const obj = this.toObject()
    delete obj.password
    delete obj.tokenRefresh
    return obj
}

const UserModel = mongoose.models.users || mongoose.model('users', userSchema)

export default UserModel
