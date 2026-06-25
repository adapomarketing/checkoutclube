'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  checkoutFormSchema, 
  CheckoutFormValues, 
  creditCardSchema,
  creditCardHolderInfoSchema
} from '@/lib/validations';
import { PlanSelector } from './PlanSelector';
import { StepIndicator } from './StepIndicator';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { Plan, PaymentMethod } from '@/types';
import { ShieldCheck, Info, Loader2, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
  plans: Plan[];
}

export function CheckoutForm({ plans }: CheckoutFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // O plano Vento (50) é o sugerido por padrão
  const defaultPlan = plans.find(p => p.name === 'Aliado Vento') || plans[0];
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlan?.id || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      planId: defaultPlan?.id || '',
      paymentMethod: 'CREDIT_CARD',
    },
    mode: 'onTouched',
  });

  const [successData, setSuccessData] = useState<any>(null);

  const onSubmit: any = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Mesclar o estado local com os dados do form antes de enviar
      const submitData = {
        ...data,
        planId: selectedPlanId,
        paymentMethod: selectedPaymentMethod,
      };

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocorreu um erro ao processar sua assinatura.');
      }

      if (selectedPaymentMethod === 'PIX' || selectedPaymentMethod === 'BOLETO') {
        setSuccessData(result);
      } else {
        router.push('/obrigado');
      }
      
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      setError(err.message || 'Erro inesperado. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    if (step === 2) {
      // Validar dados pessoais antes de ir para o pagamento
      const isValid = await trigger(['name', 'email', 'cpf', 'phone']);
      if (isValid) setStep(3);
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (successData?.subscriptionId && (selectedPaymentMethod === 'PIX' || selectedPaymentMethod === 'BOLETO')) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/subscription/status?subscriptionId=${successData.subscriptionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'ACTIVE') {
              clearInterval(intervalId);
              router.push('/obrigado');
            }
          }
        } catch (err) {
          console.error('Erro ao verificar status:', err);
        }
      }, 5000); // Verifica a cada 5 segundos
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [successData, selectedPaymentMethod, router]);

  if (successData) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Aguardando Pagamento</h2>
        
        {selectedPaymentMethod === 'PIX' && successData.pixQrCode && (
          <div className="flex flex-col items-center mt-6">
            <p className="text-slate-600 mb-6">Escaneie o QR Code abaixo no app do seu banco ou copie o código Pix Copia e Cola.</p>
            
            <div className="bg-white p-4 rounded-2xl border-2 border-pipa-blue/30 shadow-sm mb-6">
              <img 
                src={`data:image/png;base64,${successData.pixQrCode.encodedImage}`} 
                alt="QR Code Pix" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <div className="w-full max-w-sm mb-8">
              <p className="text-sm font-semibold text-slate-700 mb-2">Pix Copia e Cola:</p>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={successData.pixQrCode.payload} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-l-xl text-xs text-slate-600 outline-none"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(successData.pixQrCode.payload)}
                  className="px-4 py-3 bg-pipa-orange text-white rounded-r-xl font-bold text-sm hover:bg-pipa-orange/90 transition-colors"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedPaymentMethod === 'BOLETO' && successData.boletoUrl && (
          <div className="flex flex-col items-center mt-6 mb-8">
            <p className="text-slate-600 mb-8">Seu boleto foi gerado com sucesso!</p>
            <a 
              href={successData.boletoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-pipa-orange hover:bg-pipa-orange/90 text-white font-bold rounded-xl transition-all shadow-md"
            >
              Visualizar Boleto
            </a>
          </div>
        )}

        <div className="mt-4 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-pipa-orange animate-spin" />
          <p className="text-slate-500 font-medium text-sm">
            Aguardando a confirmação do banco...
            <br />
            <span className="text-xs text-slate-400 font-normal">Esta página será redirecionada automaticamente após o pagamento.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de Política de Privacidade */}
      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setShowPolicy(false)}>
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Política de Privacidade</h3>
              <button
                type="button"
                onClick={() => setShowPolicy(false)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4">
              <p>Sua privacidade na internet é de extrema importância para nós. Esta política de privacidade define como Instituto Ádapo coleta, usa e armazena dados pessoais em nossos sistemas. Ao visitá-los você estará concordando com as práticas descritas nesta política.</p>
              <p>Nenhum dado pessoal é coletado sem que você informe pelo preenchimento de nossos formulários de cadastramento. Com este preenchimento você permite a coleta das informações e sua manutenção nos bancos de dados.</p>
              <p>As informações coletadas em hipótese alguma serão vendidas ou compartilhadas com quaisquer outras instituições, empresas ou pessoas sem seu consentimento. Para efeitos de pesquisa, seus dados são compartilhados em anonimato. Somente pessoas autorizadas têm acesso a essas informações.</p>
              <p>Qualquer informação fornecida por usuários ao Instituto Ádapo é tratada com o máximo de cuidado e segurança e não será utilizada para fins não definidos nesta política de privacidade, sempre sendo utilizada para fins expressamente consentidos.</p>
              <p>Não instalamos ou ativamos nenhum tipo de programa, script ou similares que possam de alguma forma comprometer sua segurança ou analisar suas informações sem sua autorização.</p>
              <p>Ao entrar em contato conosco, seja por nossas plataformas ou canais de contato, nós podemos coletar seu nome, e-mail, número de telefone fixo ou celular, endereço e outros dados solicitados pelo formulário. Ao se tornar um doador, além dos dados descritos anteriormente, precisaremos coletar seu CPF, dados de cartão de crédito, caso opte por este meio de pagamento, e a sua data de nascimento, para confirmar que você tem mais de 18 anos. Seus dados de cartão de crédito são tokenizados em nossas soluções para preservar sua segurança ao processar as doações.</p>
              <p>Nós usamos seus dados para lidar com suas dúvidas e solicitações, confirmar seu cadastro, enviar comunicações, processar e reconhecer suas doações, manter um registro de seu relacionamento, captar recursos e, de maneira anonimizada, realizar estudos e pesquisas.</p>
              <p>Em nosso site utilizamos cookies de forma anônima, portanto não armazenamos suas informações pessoais e dados de acesso.</p>
              <p>A qualquer momento você poderá solicitar cópia de qualquer informação pessoal que tenhamos a seu respeito, cancelar ou modificar suas informações entrando em contato com <a href="mailto:politica+institutoadapo@gmail.com" className="text-pipa-orange underline">politica+institutoadapo@gmail.com</a>.</p>
              <p>Caso não deseje mais receber nossas comunicações, você pode cancelar o cadastro de seu endereço de e-mail através de <a href="mailto:politica+institutoadapo@gmail.com" className="text-pipa-orange underline">politica+institutoadapo@gmail.com</a>. Assim, seu contato será retirado de nossa base.</p>
              <p>Quaisquer mudanças feitas a esta política de privacidade serão publicadas e estarão disponíveis nesta mesma página. Visite-a sempre que necessário.</p>
              <p>Se você tiver alguma dúvida, entre em contato conosco através de <a href="mailto:politica+institutoadapo@gmail.com" className="text-pipa-orange underline">politica+institutoadapo@gmail.com</a>.</p>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setPolicyAccepted(true); setShowPolicy(false); }}
                className="px-6 py-3 bg-pipa-orange text-white font-bold rounded-xl hover:bg-pipa-orange/90 transition-all"
              >
                Li e concordo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 animate-spring-up" style={{ animationDelay: '200ms' }}>
        <StepIndicator currentStep={step} />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start">
          <Info className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
        
        {/* STEP 1: Seleção de Plano */}
        <div className={`${step === 1 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <PlanSelector 
            plans={plans} 
            selectedPlanId={selectedPlanId} 
            onSelect={(id) => {
              setSelectedPlanId(id);
            }}
            actionSlot={
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-slate-300 text-pipa-orange focus:ring-pipa-orange accent-pipa-orange transition-all duration-200"
                  />
                  <span className="text-sm text-slate-600 leading-snug">
                    Li e concordo com a{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setShowPolicy(true); }}
                      className="text-pipa-orange underline underline-offset-2 hover:text-pipa-orange/80 font-bold"
                    >
                      Política de Privacidade
                    </button>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!policyAccepted}
                  className={`inline-flex items-center justify-center px-8 py-4 text-white font-bold rounded-xl transition-all shadow-md shrink-0 ${
                    policyAccepted
                      ? 'bg-pipa-orange hover:bg-pipa-orange/90 hover:shadow-lg active:scale-[0.98]'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Continuar <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            }
          />
        </div>



        {/* STEP 2: Dados Pessoais */}
        <div className={`${step === 2 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Seus dados</h2>
            
            <div className="space-y-5 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100">
              
              {/* Nome */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Como você gostaria de ser chamado"
                  className={`w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-pipa-orange focus:border-pipa-orange outline-none transition-all ${errors.name ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'}`}
                  {...register('name')}
                />
                {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>}
              </div>

              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  className={`w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-pipa-orange focus:border-pipa-orange outline-none transition-all ${errors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'}`}
                  {...register('email')}
                />
                {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* CPF e Telefone na mesma linha em telas maiores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="cpf" className="block text-sm font-semibold text-slate-700">
                      CPF
                    </label>
                    <div className="group relative cursor-help">
                      <Info className="w-4 h-4 text-slate-400" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                        Necessário para emitir seu recibo de doação.
                        <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                      </div>
                    </div>
                  </div>
                  <input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    className={`w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-pipa-orange focus:border-pipa-orange outline-none transition-all ${errors.cpf ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'}`}
                    {...register('cpf')}
                  />
                  {errors.cpf && <p className="mt-1.5 text-sm text-red-500">{errors.cpf.message}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className={`w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-pipa-orange focus:border-pipa-orange outline-none transition-all ${errors.phone ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'}`}
                    {...register('phone')}
                  />
                  {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>}
                </div>
              </div>

            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Ir para pagamento <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 3: Pagamento */}
        <div className={`${step === 3 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Finalizar apoio</h2>
            
            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100/50 animate-spring-up" style={{ animationDelay: '300ms' }}>
              <PaymentMethodSelector 
                selectedMethod={selectedPaymentMethod} 
                onSelect={setSelectedPaymentMethod} 
              />
              
              {/* Campos do cartão de crédito (Mockup inicial, tokenização será adicionada depois) */}
              {selectedPaymentMethod === 'CREDIT_CARD' && (
                <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300 space-y-5">
                   <p className="text-sm text-slate-500 mb-4 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-500" />
                    Ambiente seguro e criptografado
                  </p>
                  
                  {/* Campos simulados por enquanto */}
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-100 text-center text-slate-500">
                    Campos de cartão de crédito serão integrados via tokenização Asaas
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'PIX' && (
                <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300 text-center">
                   <p className="text-slate-700">
                    O código Pix será gerado na próxima tela.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    A aprovação é imediata e seu acesso liberado na hora.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'BOLETO' && (
                <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300 text-center">
                   <p className="text-slate-700">
                    O boleto será gerado na próxima tela e enviado por e-mail.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    O pagamento pode levar até 3 dias úteis para ser compensado.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Voltar
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  inline-flex items-center justify-center px-8 py-4 text-white font-bold rounded-xl transition-all shadow-md
                  ${isSubmitting ? 'bg-pipa-orange/70 cursor-not-allowed' : 'bg-pipa-orange hover:bg-pipa-orange/90 hover:shadow-lg active:scale-[0.98]'}
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Processando...' : `Confirmar Apoio de R$ ${selectedPlan?.amount?.toString().replace('.', ',') || '0'}`}
                  </>
                )}
              </button>
            </div>
            
            {/* TRUST SHIELD */}
            <div className="mt-6 flex flex-col items-center justify-center opacity-60">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                Processamento 100% Seguro
              </div>
              <div className="flex items-center gap-4 text-slate-400 grayscale">
                <div className="text-[10px] font-bold border border-slate-300 rounded px-2 py-0.5">PIX</div>
                <div className="text-[10px] font-bold border border-slate-300 rounded px-2 py-0.5">SSL</div>
                <div className="text-[10px] font-bold border border-slate-300 rounded px-2 py-0.5">ASAAS</div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 text-center max-w-xs">
                Garantimos a privacidade dos seus dados. As informações financeiras não são armazenadas em nossos servidores.
              </p>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center">
              Você pode cancelar a qualquer momento.
            </p>
          </div>
        </div>
      </form>
    </div>
  </>
);
}
