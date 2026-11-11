# Xadrez Online — versão com servidor próprio

Com esta versão, **qualquer pessoa** joga online só abrindo o link do site, sem precisar de conta no Claude.

## O que tem aqui

- `server.js`: o servidor. Ele mostra o jogo e conecta os jogadores nas salas. Não precisa instalar nada além do Node.js.
- `public/index.html`: o jogo, com bots, modo online, peças e sons.
- `package.json`: diz ao serviço de hospedagem como ligar o servidor.

## Opção 1: colocar na internet de graça (Render)

1. Crie uma conta em **github.com** e crie um repositório novo, por exemplo `xadrez-online`.
2. No repositório, clique em **Add file → Upload files** e envie os 3 itens desta pasta: `server.js`, `package.json` e a pasta `public` com o `index.html` dentro.
3. Crie uma conta em **render.com**, entrando com o GitHub.
4. Clique em **New → Web Service** e escolha o repositório `xadrez-online`.
5. Preencha:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
6. Clique em **Create Web Service**. Em 1 ou 2 minutos aparece um endereço tipo `https://xadrez-online-xxxx.onrender.com`. Esse é o link do seu jogo.

> No plano gratuito do Render, o servidor "dorme" depois de uns 15 minutos sem ninguém jogando. Quando alguém abre o site de novo, ele demora cerca de 1 minuto para acordar. Depois disso fica rápido.

Outros serviços parecidos também funcionam (Railway, Fly.io, Koyeb): basta dizer que o comando de início é `node server.js`.

## Opção 2: jogar no seu computador ou na mesma rede Wi-Fi

1. Instale o Node.js (versão 18 ou mais nova) em **nodejs.org**.
2. Abra o terminal nesta pasta e rode `node server.js`.
3. Abra `http://localhost:3000` no navegador.
4. Para alguém na mesma rede Wi-Fi jogar, essa pessoa abre `http://SEU-IP:3000`. O seu IP aparece no Windows com o comando `ipconfig` (procure "Endereço IPv4").

## Como jogar com um amigo

- **Sala privada:** em "Contra pessoas", clique em **Criar sala** e depois em **Copiar link de convite**. Mande o link para seu amigo: quando ele abrir, entra direto na sua sala.
- **Partida rápida:** clique em **Procurar oponente** para entrar numa sala aberta, ou criar uma e esperar alguém.
- Se a página for recarregada no meio da partida, é só abrir "Contra pessoas" e clicar em **Voltar à partida**.

## Créditos

Os conjuntos de sons "Efeitos", "Piano", "NES" e "Futurista" são de Enigmahack, do projeto Lichess (github.com/lichess-org/lila), com licença AGPLv3 ou posterior. Por isso, este projeto também é distribuído sob a AGPLv3 ou posterior.

## App Android (APK)

A pasta `android/` tem o app Android com o jogo inteiro dentro:
**contra os bots funciona sem internet**; o modo online usa o servidor do Render.

A cada atualização enviada para o GitHub, o APK é gerado sozinho e publicado na página
**Releases** do repositório (arquivo `XadrezOnline.apk`).

**Assinatura:** sem configuração, o APK é assinado com a chave de teste `android/keystore/teste.jks`
(pública, só para testes). Para assinar com a sua chave privada, cadastre em
*Settings → Secrets and variables → Actions*:
- `KEYSTORE_BASE64`: o arquivo `.jks` convertido em base64;
- `KEYSTORE_PASSWORD`: a senha da chave.
