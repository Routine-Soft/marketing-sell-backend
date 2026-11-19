import AppError from '../../errors/AppError.js'
import WhatsappModel, { TEXTO_PADRAO } from './whatsapp.model.js'
import WhatsappEnvioModel from './whatsapp-envio.model.js'
import NegocioModel from '../negocio/negocio.model.js'
import { Evolution, evolutionConfigurada } from './evolution.client.js'
import { montarTexto, telefoneDoLead } from './whatsapp.texto.js'
import { enviadosHoje, quantosNaRegra } from './whatsapp.regra.js'
import { regraDTO } from './whatsapp.dto.js'

// Lead de exemplo do teste e da prévia.
export const LEAD_EXEMPLO = { nome: 'Clínica Bem Estar', contato: 'Maria Souza', cidade: 'São Paulo' }
const ULTIMOS_ENVIOS = 30

// Nome da conexão do negócio na Evolution (o Sonelia usa "sonelia-...": os nomes não se misturam).
const instanciaDo = (tenantId) => `marketingsell-${tenantId}`

async function configDo(tenantId) {
    return await WhatsappModel.findOne({ tenantId })
        ?? await WhatsappModel.create({ tenantId, instancia: instanciaDo(tenantId) })
}

// Quando a conexão abre, guarda o número e o nome do perfil (aparecem na tela).
async function registrarConexao(config) {
    if (config.conectadoEm && config.numero) return config
    const { numero, nome } = await Evolution.perfil(config.instancia)
    config.numero = numero
    config.nomePerfil = nome
    config.conectadoEm = new Date()
    return await config.save()
}

async function paraDTO(config, estado, qrcode = null) {
    const [hoje, naRegra, ultimos] = await Promise.all([
        enviadosHoje(config.tenantId),
        quantosNaRegra(config),
        WhatsappEnvioModel.find({ tenantId: config.tenantId }).sort({ createdAt: -1 }).limit(ULTIMOS_ENVIOS).lean(),
    ])
    return {
        disponivel: evolutionConfigurada(),
        conectado: estado === 'open',
        estado: estado ?? 'desconectado',
        numero: estado === 'open' ? config.numero : null,
        nomePerfil: estado === 'open' ? config.nomePerfil : null,
        qrcode,
        regra: {
            ativo: config.ativo,
            texto: config.texto,
            situacoes: config.situacoes,
            fontes: config.fontes,
            limiteDiario: config.limiteDiario,
            horaInicio: config.horaInicio,
            horaFim: config.horaFim,
            dias: config.dias,
        },
        textoPadrao: TEXTO_PADRAO,
        enviadosHoje: hoje,
        naRegra,
        proximoEnvioEm: config.proximoEnvioEm,
        ultimoErro: config.ultimoErro,
        ultimoErroEm: config.ultimoErroEm,
        ultimos: ultimos.map((envio) => ({
            _id: envio._id,
            leadId: envio.leadId,
            nome: envio.nome,
            numero: envio.numero,
            status: envio.status,
            erro: envio.erro,
            teste: envio.teste,
            em: envio.createdAt,
        })),
    }
}

async function estadoDa(config) {
    if (!evolutionConfigurada()) return null
    return await Evolution.estado(config.instancia).catch(() => null)
}

export const WhatsappService = {
    async situacao(tenantId) {
        const config = await configDo(tenantId)
        const estado = await estadoDa(config)
        if (estado === 'open') await registrarConexao(config)
        return await paraDTO(config, estado)
    },

    // Começa (ou continua) a conexão e devolve o QR Code. A tela chama de novo a cada poucos segundos:
    // o QR Code muda sozinho até o celular ler.
    async conectar(tenantId) {
        const config = await configDo(tenantId)
        let estado = await Evolution.estado(config.instancia)
        if (estado === 'open') return await paraDTO(await registrarConexao(config), estado)
        if (estado === null) {
            await Evolution.criar(config.instancia)
            estado = 'connecting'
        }
        const qrcode = await Evolution.qrCode(config.instancia)
        return await paraDTO(config, estado === 'close' ? 'connecting' : estado, qrcode)
    },

    async desconectar(tenantId) {
        const config = await configDo(tenantId)
        await Evolution.apagar(config.instancia)
        config.numero = null
        config.nomePerfil = null
        config.conectadoEm = null
        await config.save()
        return await paraDTO(config, null)
    },

    async salvarRegra(tenantId, body) {
        const config = await configDo(tenantId)
        const dados = regraDTO(body)
        const horaInicio = dados.horaInicio ?? config.horaInicio
        const horaFim = dados.horaFim ?? config.horaFim
        if (horaInicio >= horaFim) throw new AppError('O horário de início precisa ser antes do horário de fim', 400)
        Object.assign(config, dados)
        // Regra ligada agora: pode começar já (dentro da janela).
        if (dados.ativo) config.proximoEnvioEm = null
        await config.save()
        return await this.situacao(tenantId)
    },

    // Mensagem com o lead de exemplo para um número escolhido.
    async enviarTeste(tenantId, telefone) {
        const config = await configDo(tenantId)
        if ((await estadoDa(config)) !== 'open') throw new AppError('Conecte o WhatsApp antes de enviar o teste', 400)
        const numero = telefoneDoLead(telefone, 'manual')
        if (!numero) throw new AppError('Telefone inválido. Use DDD + número (ou + e o código do país).', 400)
        const negocio = await NegocioModel.findById(tenantId, 'nome').lean()
        const texto = montarTexto(config.texto, LEAD_EXEMPLO, negocio?.nome ?? '')
        try {
            await Evolution.enviarTexto(config.instancia, numero, texto)
        } catch (erro) {
            await WhatsappEnvioModel.create({ tenantId, nome: 'Teste', numero, texto, status: 'erro', erro: erro.message, teste: true })
            throw new AppError(erro.message, 400)
        }
        await WhatsappEnvioModel.create({ tenantId, nome: 'Teste', numero, texto, status: 'enviado', teste: true })
        return await paraDTO(config, 'open')
    },
}

// Ao excluir negócio ou conta: desconecta o WhatsApp de cada negócio na Evolution (o banco é limpo por quem chamou).
export async function apagarConexoesWhatsapp(tenantIds) {
    if (!evolutionConfigurada()) return
    const configs = await WhatsappModel.find({ tenantId: { $in: tenantIds } }, 'instancia').lean()
    for (const config of configs) await Evolution.apagar(config.instancia).catch(() => {})
}
