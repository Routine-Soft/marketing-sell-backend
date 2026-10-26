// Mensagens da API em inglês. A chave é a mensagem em português, como está no código; {0}, {1}... marcam as
// partes que mudam (vêm de template literals). Partes que também são texto em português (ex.: "o Google")
// são traduzidas pelo mesmo dicionário.
export const MENSAGENS_EN = {
    // Login e conta
    'Token não fornecido': 'Token not provided',
    'Token inválido': 'Invalid token',
    'Acesso negado': 'Access denied',
    'Usuário não encontrado': 'User not found',
    'Refresh token inválido': 'Invalid refresh token',
    'Refresh token inválido ou expirado': 'Invalid or expired refresh token',
    'E-mail ou senha incorretos': 'Incorrect email or password',
    'Login realizado com sucesso': 'Logged in successfully',
    'Conta criada com sucesso': 'Account created successfully',
    'Já existe uma conta com este e-mail': 'An account with this email already exists',
    'Informe nome, e-mail e nome da empresa': 'Enter name, email and company name',
    'A senha precisa ter pelo menos 6 caracteres': 'The password must be at least 6 characters',
    'A nova senha deve ter ao menos 6 caracteres': 'The new password must be at least 6 characters',
    'Senha atual incorreta': 'Current password is incorrect',
    'Senha alterada com sucesso': 'Password changed successfully',
    'Dados atualizados com sucesso': 'Details updated successfully',

    // Super admin
    'Conta não encontrada': 'Account not found',
    'Conta excluída': 'Account deleted',
    'Cota atualizada': 'Quota updated',
    'Informe um número de páginas válido': 'Enter a valid number of pages',

    // Captação
    'Escolha uma fonte de dados': 'Choose a data source',
    'Escolha a especialidade': 'Choose the specialty',
    'Escolha um estado válido': 'Choose a valid state',
    'Escolha um dos estados disponíveis': 'Choose one of the available states',
    'Escolha o tipo de prestador': 'Choose the type of provider',
    'Informe o que procurar e a cidade': 'Enter what to search for and the city',
    'A busca no Google não está configurada. Fale com o suporte.': 'Google search is not configured. Contact support.',
    'A cota de buscas no Google deste mês acabou. Fale com o suporte para aumentar.': "This month's Google search quota is used up. Contact support to increase it.",
    'Busca concluída: {0} encontrados, {1} novos': 'Search complete: {0} found, {1} new',
    'Não foi possível falar com {0} agora. Tente de novo em alguns minutos.': 'Could not reach {0} right now. Try again in a few minutes.',
    '{0} recusou a busca agora. Tente de novo em alguns minutos.': '{0} rejected the search right now. Try again in a few minutes.',
    'O NPI Registry recusou a busca: {0}': 'The NPI Registry rejected the search: {0}',
    'o NPI Registry': 'the NPI Registry',
    'o Google': 'Google',
    'o portal de dados de {0}': 'the {0} open data portal',
    'o portal de licenças de {0}': 'the {0} licensing portal',

    // Leads
    'Lead atualizado': 'Lead updated',
    'Lead excluído': 'Lead deleted',
    'Lead não encontrado': 'Lead not found',
    '{0} leads excluídos': '{0} leads deleted',
    'Selecione pelo menos um lead': 'Select at least one lead',
    'Situação inválida': 'Invalid status',
    'Informe um e-mail válido': 'Enter a valid email',
    '{0} sites na fila de busca de e-mail': '{0} websites queued for email search',
    'Nenhum dos leads selecionados tem site para procurar e-mail': 'None of the selected leads has a website to search for an email',

    // Remetentes de e-mail
    'Informe o nome do negócio': 'Enter the business name',
    'Informe o e-mail do Gmail': 'Enter the Gmail address',
    'Informe a senha de app do Gmail': 'Enter the Gmail app password',
    'Já existe um remetente com esse nome de negócio': 'A sender with this business name already exists',
    'Remetente não encontrado': 'Sender not found',
    'Remetente criado com sucesso': 'Sender created successfully',
    'Remetente atualizado com sucesso': 'Sender updated successfully',
    'Remetente excluído com sucesso': 'Sender deleted successfully',
    'Não foi possível enviar o e-mail. Confira a senha de app do Gmail': 'Could not send the email. Check the Gmail app password',
    'E-mail de teste enviado para {0}': 'Test email sent to {0}',
    'Limite diário de {0} e-mails do Gmail atingido para {1}': 'Daily limit of {0} Gmail emails reached for {1}',

    // Envio de e-mail para leads
    'Escolha o remetente': 'Choose the sender',
    'Informe o assunto do e-mail': 'Enter the email subject',
    'Escreva o texto do e-mail': 'Write the email text',
    'Este remetente está desativado': 'This sender is turned off',
    'Nenhum dos leads selecionados tem e-mail': 'None of the selected leads has an email',
    'Todos os leads selecionados já receberam e-mail deste negócio': 'All selected leads have already received an email from this business',
    '1 e-mail na fila de envio': '1 email queued to send',
    '{0} e-mails na fila de envio': '{0} emails queued to send',
    '1 e-mail tirado da fila': '1 email removed from the queue',
    '{0} e-mails tirados da fila': '{0} emails removed from the queue',

    // Geral
    'Erro interno do servidor': 'Internal server error',
    'Registro não encontrado': 'Record not found',
}
