import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import UserModel from './user.model.js'
import { createUserDTO, updateMeDTO, loginUserDTO } from './user.dto.js'
import AppError from '../../errors/AppError.js'

function assinarToken(user) {
    return jwt.sign({ id: user._id, tenantId: user.tenantId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

async function emitirSessao(user) {
    const accessToken = assinarToken(user)
    const refreshToken = assinarToken(user)
    user.tokenRefresh = refreshToken
    await user.save()
    return { accessToken, refreshToken, user: user.toJSON() }
}

export const UserService = {
    // Cadastro de uma conta nova: a pessoa vira a dona (admin) e o próprio _id é o tenantId.
    async createUser(body) {
        const userDTO = createUserDTO(body)
        userDTO.password = await argon2.hash(userDTO.password)

        const newId = new mongoose.Types.ObjectId()
        let user
        try {
            user = await UserModel.create({ ...userDTO, _id: newId, tenantId: newId, role: 'admin' })
        } catch (error) {
            if (error.code === 11000) {
                throw new AppError('Já existe uma conta com este e-mail', 409)
            }
            throw error
        }
        return await emitirSessao(user)
    },

    async loginUser(body) {
        const { email, password } = loginUserDTO(body)
        const user = await UserModel.findOne({ email })
        if (!user || !(await argon2.verify(user.password, password))) {
            throw new AppError('E-mail ou senha incorretos', 401)
        }
        return await emitirSessao(user)
    },

    async refresh(refreshToken) {
        let decoded
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
        } catch {
            throw new AppError('Refresh token inválido ou expirado', 401)
        }

        const user = await UserModel.findById(decoded.id)
        if (!user || user.tokenRefresh !== refreshToken) {
            throw new AppError('Refresh token inválido', 401)
        }
        return { accessToken: assinarToken(user) }
    },

    async logoutUser(id) {
        await UserModel.updateOne({ _id: id }, { $set: { tokenRefresh: null } })
        return null
    },

    async findMe(id) {
        const user = await UserModel.findById(id)
        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        }
        return user
    },

    async updateMe(id, tenantId, role, body) {
        const userDTO = updateMeDTO(body, role)

        let user
        try {
            user = await UserModel.findOneAndUpdate({ _id: id }, { $set: userDTO }, { new: true, runValidators: true })
        } catch (error) {
            if (error.code === 11000) {
                throw new AppError('Já existe uma conta com este e-mail', 409)
            }
            throw error
        }
        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        }

        if (userDTO.nomeEmpresa) {
            await UserModel.updateMany({ tenantId }, { $set: { nomeEmpresa: userDTO.nomeEmpresa } })
        }
        return user
    },

    async updateMyPassword(id, body) {
        const { currentPassword, newPassword } = body ?? {}
        if (!newPassword || newPassword.length < 6) {
            throw new AppError('A nova senha deve ter ao menos 6 caracteres', 400)
        }

        const user = await UserModel.findById(id)
        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        }
        if (!(await argon2.verify(user.password, currentPassword || ''))) {
            throw new AppError('Senha atual incorreta', 400)
        }

        user.password = await argon2.hash(newPassword)
        await user.save()
        return null
    },
}
