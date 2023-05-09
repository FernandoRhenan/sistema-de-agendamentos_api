# sistema-de-agendamentos_api

Requisitos: Ter o Node.js instalado na máquina, uma conta no Mailtrap, para simular o envio de email para a confirmação de conta e troca de senha.

Atenção: Para rodar este projeto será necessário baixar o código fonte em sua maquina e então abrir-lo em um editor de código.

Tendo isso feito, será necessário navergar até a pasta raiz do projeto (pasta: /api) atravez de algum terminal de sua preferencia. (Terminal do VSCode, PowerShell, Cmd...).

1 - Então a partir disso você apenas precisará digitar no seu terminal já dentro da pasta /api o comando: npm install e aguardar as dependencias serem baixadas. 2 - Após a instalação das dependências será possivel digitar no terminal: npm run dev Esse comando executará o código na porta 3000. 
3 - Você precisará adicionar suas próprias variáveis de ambiente no seu código, um arquivo .env já estará disponível para ser editado, nele será possivel colocar a url do seu banco de dados, host do email (MailTrap), as assinaturas de JWT entre outras variáveis que são necessárias.

Dica: Você pode usar o RailWay como um banco de dados sql provisório, nele é possivel criar uma instancia temporária de um banco de dados e então testar a aplicação. É facil e rápido.

OBS: Lembrando que o projeto de só funcionará com o frontend rodando simultaneamente.

Link para o repositório da frontend: https://github.com/FernandoRhenan/sistema-de-agendamentos-front
