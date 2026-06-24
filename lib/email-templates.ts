export function getWelcomeEmailHtml(name: string, planName: string, amount: string) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo(a) à Aliança dos Ventos!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin: 0 auto; max-width: 600px;">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #4f46e5; padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Aliança dos Ventos</h1>
                  <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Clube das Pipas &bull; Instituto Ádapo</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Olá, ${name}! 🎉</h2>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                    É com muita alegria que confirmamos a sua assinatura como <strong style="color: #4f46e5;">${planName}</strong> (${amount}/mês). O seu pagamento já foi processado com sucesso!
                  </p>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 30px 0;">
                    Graças a você, poderemos continuar transformando a vida de crianças e adolescentes da Vila Sapo. Seu apoio mensal garante a estrutura e a estabilidade que o nosso projeto precisa.
                  </p>
                  
                  <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">Sua Área Exclusiva</h3>
                    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
                      Preparamos uma área especial para você acompanhar o impacto da sua doação, ver relatórios financeiros e acessar conteúdos exclusivos do projeto.
                    </p>
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/minha-alianca" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 8px;">Acessar meu painel</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                    Você está recebendo este e-mail porque se tornou um aliado do Clube das Pipas.
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    Se precisar de ajuda, responda a este e-mail ou acesse o seu painel.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
