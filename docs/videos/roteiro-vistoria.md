# Vídeo: como fazer uma vistoria

Arquivo: `docs/videos/como-fazer-vistoria.mp4`. Duração de 4 min 03 s, em pé, do tamanho de um celular (720 × 1460). Imagem em H.264 e som em AAC, num MP4 comum que toca no celular, no computador e no WhatsApp.

Gravado em 03/11/2026 com uma oficina de TESTE ("Oficina Exemplo"), um cliente inventado (João da Silva, placa BRA2E19) e fotos de exemplo desenhadas, sem nenhum dado real. A voz é a "Maria" (português do Brasil) que já vem no Windows.

## Narração

| Tempo | Fala |
|---|---|
| 0:00 | Olá! Veja como fazer uma vistoria no Vistoria Rápida. É fácil e rápido. |
| 0:09 | Quando um carro chegar na oficina, toque no botão azul: Chegou carro. |
| 0:16 | Escolha o tipo de veículo. Aqui, vamos tocar em carro. |
| 0:22 | Passo um: carro e cliente. Digite a placa. Se o carro já veio antes, o resto aparece sozinho. |
| 0:33 | Toque na marca, escreva o modelo e toque na cor do carro. |
| 0:39 | Agora, digite os quilômetros do painel e toque em quanto tem de combustível. |
| 0:46 | Escreva o nome do cliente e o WhatsApp dele. Depois, toque em Próximo. |
| 0:59 | Passo dois: fotos. O desenho mostra onde você deve ficar. Toque em Tirar foto. |
| 1:11 | O sistema passa sozinho para a próxima foto: a traseira, os dois lados, o painel e o motor, com o capô aberto. |
| 1:26 | Com as seis fotos prontas, toque em Próximo. |
| 1:31 | Passo três: riscos e amassados. Toque no desenho, bem no lugar do problema. |
| 1:40 | Escolha o que é, por exemplo, amassado. Se quiser, escreva um detalhe. Depois, toque em Salvar. |
| 1:51 | Nas abas de cima, estão os outros lados do carro. Sem nenhum risco, é só tocar em Nenhum risco. |
| 2:01 | Passo quatro: pneus. Marque bom ou ruim em cada um. Se todos estão bons, toque em Todos bons. Depois, Próximo. |
| 2:15 | Passo cinco: itens do carro. Marque o que tem e o que não tem. Se tiver tudo, toque em Tem tudo. |
| 2:26 | Embaixo, em observações, anote o que o cliente deixou no carro. Pode usar o microfone do teclado. Toque em Próximo. |
| 2:38 | Passo seis: o cliente confere tudo. Se algo estiver errado, toque em Corrigir. |
| 2:47 | Estando tudo certo, o cliente assina com o dedo, aqui na tela. Toque em Próximo. |
| 2:56 | Passo sete: agora é a sua vez. Assine com o dedo e toque em Concluir vistoria. |
| 3:05 | Confirme. Depois de concluída, a vistoria fica travada e serve como prova. |
| 3:15 | Pronto! Vistoria concluída. O termo de vistoria, em PDF, já foi criado. |
| 3:25 | Toque em Enviar para o cliente. O WhatsApp abre com a mensagem e o link pronto. É só enviar. |
| 3:35 | Em Ver como o cliente vê, estão as fotos, as marcações, as assinaturas e o termo em PDF. |
| 3:48 | Na hora de devolver o carro, faça igual, pelo botão Entregar carro. Em cada passo, o botão Ajuda mostra uma dica. Boas vistorias! |

## Como foi feito (para refazer quando as telas mudarem)

1. O app rodou no computador (`npm run dev`). Um robô (Playwright, usando o Chrome instalado) fez a vistoria numa tela de 375 px, no ritmo de cada fala. Um círculo azul mostra cada toque.
2. Cada frase virou um arquivo de áudio com a voz Maria do Windows (SAPI).
3. O próprio Chrome codificou o vídeo quadro a quadro (WebCodecs, 30 quadros por segundo), e um script juntou imagem e voz num MP4 comum. Não precisou de ffmpeg. Na montagem, foram cortadas duas esperas sem fala: a criação do PDF e a abertura da página do cliente.
4. Dados de teste no banco: a oficina "Oficina Exemplo" foi inativada, a senha trocada e o login bloqueado. Rascunhos, veículos, clientes e fotos foram apagados. Fica só 1 vistoria de teste concluída (código VF-CGTP-BTCD), porque o banco não deixa apagar vistoria concluída.
