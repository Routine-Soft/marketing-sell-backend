import LeadModel from '../lead/lead.model.js'
import BuscaModel from '../captacao/busca.model.js'
import RemetenteModel from '../remetente/remetente.model.js'
import EnvioModel from '../envio/envio.model.js'
import ContatoModel from '../lead/contato.model.js'
import RotinaDiaModel from '../rotina/rotina-dia.model.js'
import AvisoModel from '../follow-up/aviso.model.js'
import ParceiroModel from '../parceiro/parceiro.model.js'
import ComunidadeModel from '../comunidade/comunidade.model.js'
import ChecklistModel from '../checklist/checklist.model.js'

// Tudo o que pertence a um negócio (tenantId = _id do negócio). Coleção nova com tenantId entra aqui:
// é o que some ao excluir um negócio ou uma conta.
export const DADOS_DO_NEGOCIO = [
    LeadModel, BuscaModel, RemetenteModel, EnvioModel, ContatoModel, RotinaDiaModel, AvisoModel, ParceiroModel, ComunidadeModel, ChecklistModel,
]
