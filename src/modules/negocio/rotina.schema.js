import mongoose from 'mongoose'

// Rotina de um negócio ou de um modelo: blocos (com cor) e linhas (ver modelos.padrao.js).
const blocoSchema = new mongoose.Schema({
    id: { type: String, required: true },
    nome: { type: String, required: true },
    cor: { type: String, default: '#2a7de1' },
}, { _id: false })

const linhaSchema = new mongoose.Schema({
    id: { type: String, required: true },
    bloco: { type: String, required: true },
    tipo: { type: String, enum: ['tarefa', 'opcional', 'automatico'], default: 'tarefa' },
    titulo: { type: String, required: true },
    meta: { type: Number, default: null },
    auto: { type: String, default: '' },
    contagem: { type: String, default: '' },
    dias: { type: [Number], default: [] },
}, { _id: false })

export const rotinaSchema = new mongoose.Schema({
    blocos: { type: [blocoSchema], default: [] },
    linhas: { type: [linhaSchema], default: [] },
}, { _id: false })

const itemSchema = new mongoose.Schema({
    grupo: { type: String, default: '' },
    tarefa: { type: String, required: true },
    detalhe: { type: String, default: '' },
}, { _id: false })

export const listasSchema = new mongoose.Schema({
    preparacao: { type: [itemSchema], default: [] },
    anuncios: { type: [itemSchema], default: [] },
}, { _id: false })
