# Vídeo: como cadastrar a oficina

Arquivo: `docs/videos/como-cadastrar-oficina.mp4`. Duração de 1 min 48 s, em pé, do tamanho de um celular (720 × 1460), H.264 + AAC. Mesmo estilo do vídeo da vistoria: voz "Maria" do Windows mais rápida e alegre, com música de fundo que abaixa quando a voz fala.

Mostra: site → Criar minha conta → e-mail e senha → passo 1 (seu nome, WhatsApp, nome da oficina, aceite) → passo 2 (logo) → Tudo pronto → Pagar pelo Pix (Meu plano) → Continuar para o sistema → Início.

Gravado em 03/11/2026 com uma conta de TESTE (carlos.cadastro@example.com, oficina "Auto Center Exemplo", WhatsApp inventado, logo desenhada). O QR Code do Pix aparece borrado de propósito, para ninguém pagar lendo o vídeo. Depois da gravação, a conta, a oficina, a logo, os aceites e o registro de auditoria foram apagados do banco.

## Narração

| Tempo | Fala |
|---|---|
| 0:00 | Olá! Bora colocar a sua oficina no Vistoria Rápida? Leva só dois minutinhos! |
| 0:07 | No celular, abra o site: vistoria rápida ponto digital. |
| 0:12 | Agora, toque no botão verde: Criar minha conta! |
| 0:17 | Digite o seu e-mail. Depois, crie uma senha, com pelo menos seis letras ou números. |
| 0:26 | Toque em Criar conta, e espere um pouquinho. |
| 0:30 | Conta criada! Passo um: você e a oficina. Escreva seu nome e seu WhatsApp. |
| 0:38 | Agora, o nome da oficina, do jeito que os clientes conhecem. |
| 0:43 | Leia os termos, marque que você aceita, e toque em Continuar! |
| 0:50 | Passo dois: a logo! Não tem agora? Pode pular. Aqui, vamos tocar em Logo da empresa. |
| 0:59 | Escolha a foto da logo. Olha só como fica: no sistema e no termo de vistoria em PDF! Toque em Continuar. |
| 1:10 | Tudo pronto! A sua oficina já está no sistema. Agora, toque em Pagar pelo Pix. |
| 1:18 | Aqui está a sua mensalidade. Abra o app do banco e leia o QR Code, ou toque em Copiar código Pix. |
| 1:27 | Atenção: pague até o dia seguinte ao cadastro. Assim que o pagamento cair, o acesso fica liberado! |
| 1:36 | Depois, toque em Continuar para o sistema, e já faça a sua primeira vistoria. Bem-vindo ao Vistoria Rápida! |

## Como foi feito

Igual ao vídeo da vistoria (veja `roteiro-vistoria.md`): um robô (Playwright + Chrome) fez o cadastro numa tela de 375 px no ritmo de cada fala, o Chrome codificou o vídeo (WebCodecs) e um script juntou imagem, voz e música. Foram cortados cerca de 8 s de espera em "Carregando..." depois de tocar em Criar conta.
