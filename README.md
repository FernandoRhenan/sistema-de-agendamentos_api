# sistema-de-agendamentos_api

Requisitos: Ter o Node.js instalado na máquina, uma conta no Mailtrap, para simular o envio de email para a confirmação de conta e troca de senha.

Atenção: Para rodar este projeto será necessário baixar o código fonte em sua maquina e então abrir-lo em um editor de código.

Tendo isso feito, será necessário navergar até a pasta raiz do projeto (pasta: /api) atravez de algum terminal de sua preferencia. (Terminal do VSCode, PowerShell, Cmd...).

1 - Então a partir disso você apenas precisará digitar no seu terminal já dentro da pasta /api o comando: npm install e aguardar as dependencias serem baixadas. 

2 - Você precisará adicionar suas próprias variáveis de ambiente no seu código, um arquivo .env já estará disponível para ser editado, nele será possivel colocar a url do seu banco de dados, host do email (MailTrap), as assinaturas de JWT entre outras variáveis que são necessárias.
 
3 - Depois das configurações .env, você poderá fazer a conexão com o banco de dados. Para executar as migrations do prisma você deverá digitar no terminal: npx prisma migrate dev. Isso criará a conexão e também criará as tabelas e colunas necessárias para a API funcionar.

* Dica: Você pode usar o RailWay como um banco de dados sql provisório, nele é possivel criar uma instancia temporária de um banco de dados e então testar a aplicação. É facil e rápido.

4 - Após essas configurações será possivel digitar no terminal: npm run dev. Esse comando executará o servidor local na porta 3000.

OBS: O banco de dados padrão da aplicação é o MySQL, caso deseje trocar para o MariaDB, PostgreSQL ou outro semelhante, você deverá atualizar o provider que está dentro do arquivo schema.prisma.

Link para o repositório da frontend: https://github.com/FernandoRhenan/sistema-de-agendamentos-front
