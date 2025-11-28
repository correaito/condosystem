# CondoSystem - Sistema de Gerenciamento de Condomínio

**CondoSystem** é uma aplicação web completa desenvolvida para facilitar a administração e gestão financeira de condomínios. O sistema permite o cadastro de moradores, controle de despesas, geração de faturas, gestão de caixinha e emissão de relatórios, tudo em uma interface moderna e amigável.

## 🚀 Funcionalidades

### 🔐 Autenticação e Usuários
- **Login e Registro:** Sistema seguro de autenticação com animação interativa de "flip" entre formulários.
- **Níveis de Acesso:** Diferenciação entre usuários comuns e administradores.
- **Gestão de Perfil:** Alteração de dados cadastrais e senhas.

### 🏢 Gestão Administrativa
- **Cadastro de Moradores:** Gerenciamento completo de inquilinos e proprietários.
- **Tipos de Despesas:** Classificação de despesas (Ordinárias, Extraordinárias, etc.).
- **Contas:** Geração e detalhamento de contas mensais por unidade/morador.

### 💰 Gestão Financeira
- **Despesas:** Lançamento e categorização de despesas.
- **Caixinha:** Controle de fluxo de caixa (entradas e saídas) para pequenas despesas.
- **Pagamentos:** Registro de pagamentos efetuados pelos moradores.
- **Saldos:** Acompanhamento de saldos e pendências.

### 📄 Relatórios e Documentos
- **Faturas em PDF:** Geração automática de faturas detalhadas para impressão.
- **Extratos:** Visualização de histórico financeiro.
- **Dashboard:** Visão geral da situação do condomínio.

### 🎨 Design & UX (Remodelado)
O sistema passou por uma reformulação visual completa baseada no **Google Material Design**, visando modernidade e usabilidade:
- **Interface Premium:** Visual limpo, com uso estratégico de cores, tipografia moderna e espaçamento consistente.
- **Material Design:** Componentes visuais (cards, botões, inputs) seguindo os padrões de profundidade, sombras e movimento do Material Design.
- **Experiência do Usuário (UX):** Fluxos de navegação otimizados e feedback visual claro para ações do usuário.
- **Responsividade:** Layout adaptável para desktops, tablets e smartphones.

## 🛠️ Tecnologias Utilizadas

- **Backend:** [Node.js](https://nodejs.org/) com [Express](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) com [Mongoose](https://mongoosejs.com/)
- **Frontend:** 
  - [Handlebars](https://handlebarsjs.com/) (Template Engine)
  - [Bootstrap 4](https://getbootstrap.com/) & [MDBootstrap](https://mdbootstrap.com/) (Material Design for Bootstrap)
  - CSS3 & HTML5
- **Autenticação:** [Passport.js](https://www.passportjs.org/)
- **Geração de PDF:** [PDFKit](https://pdfkit.org/)
- **Outras Libs:** Moment.js (Datas), BCrypt (Segurança), Connect-Flash (Mensagens).

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (v14 ou superior)
- [MongoDB](https://www.mongodb.com/try/download/community) (Rodando localmente ou via Docker)
- [Git](https://git-scm.com/)

## 🔧 Instalação e Configuração

1. **Clone o repositório**
   ```bash
   git clone https://github.com/correaito/condosystem.git
   cd condosystem
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Banco de Dados**
   - Certifique-se de que o serviço do MongoDB está rodando.
   - O sistema tentará conectar automaticamente em: `mongodb://localhost/condominioapp`
   - *Nota: Você pode alterar a string de conexão no arquivo `app.js` se necessário.*

4. **Inicie a Aplicação**
   ```bash
   npm start
   ```
   Ou para desenvolvimento (com nodemon se instalado):
   ```bash
   npm run dev
   ```

5. **Acesse o Sistema**
   - Abra o navegador e acesse: `http://localhost:8081`

### 👑 Configuração do Administrador
O sistema possui uma lógica automática para definição de administradores:
- **Primeiro Registro:** O **primeiro usuário** a se cadastrar no sistema será automaticamente definido como **Administrador**.
- **Demais Registros:** Todos os usuários subsequentes serão cadastrados com nível de acesso comum (Usuário).
- **Alteração de Nível:** O administrador pode alterar o nível de acesso de outros usuários através do painel administrativo.

## ⚠️ Regras de Negócio Importantes

### 🔗 Vínculo Usuário x Morador
Para que um usuário visualize suas informações financeiras (contas, saldo, etc.) no Dashboard, é necessário um vínculo com um cadastro de Morador:
1. **Cadastro de Usuário:** O usuário se registra no sistema (Login/Senha).
2. **Cadastro de Morador:** O Administrador deve cadastrar um Morador na área administrativa (`Cadastros > Moradores`).
3. **Vínculo Automático:** O sistema vincula automaticamente o Usuário ao Morador através do **NOME**.
   - **Importante:** O nome cadastrado no registro do usuário deve ser **EXATAMENTE IGUAL** ao nome cadastrado na ficha do Morador (respeitando maiúsculas, minúsculas e acentos). Caso contrário, o usuário verá um aviso de "não vinculado" em seu dashboard.

## 📂 Estrutura do Projeto

```
condominio-web/
├── config/             # Configurações de autenticação (Passport)
├── models/             # Modelos do Mongoose (Schema do BD)
├── public/             # Arquivos estáticos (CSS, JS, Imagens)
├── routes/             # Rotas da aplicação (Admin, Usuários)
├── views/              # Templates Handlebars
│   ├── admin/          # Views da área administrativa
│   ├── layouts/        # Layouts principais (main.handlebars)
│   ├── partials/       # Componentes reutilizáveis (navbar, msg)
│   └── usuarios/       # Views de login e dashboard
├── app.js              # Ponto de entrada da aplicação
└── package.json        # Dependências e scripts
```

## 🤝 Contribuindo

Contribuições são sempre bem-vindas!
1. Faça um **Fork** do projeto
2. Crie uma **Branch** para sua feature (`git checkout -b feature/NovaFeature`)
3. Faça o **Commit** (`git commit -m 'Adicionando NovaFeature'`)
4. Faça o **Push** (`git push origin feature/NovaFeature`)
5. Abra um **Pull Request**

## 📝 Licença

Este projeto está sob a licença GPL-3.0. Veja o arquivo `LICENSE` para mais detalhes.

---
Desenvolvido com ❤️ para fins de estudo e gestão condominial.
