import CnaeModel from './cnae.model.js'
import { importarCnaes, importarCnpjs } from './cnpj.importar.js'
import { horaAgora } from '../../shared/utils/dia.js'

const A_CADA_HORA = 60 * 60 * 1000
// De madrugada, para o download pesado não disputar com o uso do dia.
const HORAS_PERMITIDAS = [2, 3, 4]

// Sobe com o servidor: a lista de atividades (pequena) vem logo, se ainda não existe. A importação dos CNPJs só roda
// com CNPJ_IMPORTACAO=ligada (desligada desde 2026-11-16, enquanto o Stanley testa com a base que já está no banco):
// aí, uma vez por hora, confere se a Receita publicou mês novo ou se algum negócio escolheu atividade nova e, de
// madrugada, importa.
export function iniciarImportacaoDeCnpjs(log) {
    CnaeModel.estimatedDocumentCount()
        .then((total) => (total ? null : importarCnaes().then((n) => log.info(`CNPJ: ${n} atividades (CNAE) importadas`))))
        .catch((erro) => log.error(`CNPJ: lista de atividades falhou: ${erro.message}`))
    if (process.env.CNPJ_IMPORTACAO !== 'ligada') {
        log.info('CNPJ: importação da Receita desligada (CNPJ_IMPORTACAO)')
        return
    }

    let rodando = false
    const tentar = async () => {
        if (rodando || !HORAS_PERMITIDAS.includes(horaAgora())) return
        rodando = true
        try {
            await importarCnpjs(log)
        } catch (erro) {
            log.error(`CNPJ: importação falhou: ${erro.message}`)
        } finally {
            rodando = false
        }
    }
    setInterval(tentar, A_CADA_HORA)
}
