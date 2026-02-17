# GB - Aplicativo React Native

Aplicativo mobile desenvolvido com React Native e Expo, focado em gestão de benefícios, consultas e atendimento.

> 🎓 **Projeto de TCC** - Trabalho de Conclusão de Curso desenvolvido no SENAI

## 📋 Funcionalidades

- **Autenticação de usuários** - Login e gerenciamento de sessão
- **Agendamento de consultas** - Visualização e agendamento de consultas
- **Chat** - Sistema de mensagens
- **Gestão de benefícios** - Solicitação e detalhamento de benefícios
- **Histórico** - Visualização de histórico de atividades
- **Parcelamentos** - Gestão de parcelamentos abertos
- **Documentos** - Upload e gerenciamento de documentos
- **Assinaturas** - Controle de assinaturas pendentes

## 🚀 Tecnologias

- [React Native](https://reactnative.dev/) - Framework mobile
- [Expo](https://expo.dev/) - Plataforma de desenvolvimento
- [React Navigation](https://reactnavigation.org/) - Navegação entre telas
- [Axios](https://axios-http.com/) - Cliente HTTP
- [React Native Paper](https://callstack.github.io/react-native-paper/) - Componentes UI
- [Lottie](https://airbnb.design/lottie/) - Animações
- [React Native Calendars](https://github.com/wix/react-native-calendars) - Componentes de calendário

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Para iOS: [Xcode](https://developer.apple.com/xcode/)
- Para Android: [Android Studio](https://developer.android.com/studio)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd GB
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente necessárias (se aplicável)

## 📱 Executando o projeto

### Modo de desenvolvimento

```bash
npm start
# ou
yarn start
```

### Android
```bash
npm run android
# ou
yarn android
```

### iOS
```bash
npm run ios
# ou
yarn ios
```

### Web
```bash
npm run web
# ou
yarn web
```

## 📂 Estrutura do Projeto

```
GB/
├── assets/              # Recursos estáticos (imagens, ícones, etc.)
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── availableTimeButton.js
│   │   ├── buttonTextIcon.js
│   │   ├── calendarioSemanal.js
│   │   ├── cardConsultasAgendadas.js
│   │   ├── input.js
│   │   ├── submitButton.js
│   │   └── ...
│   ├── pages/          # Telas do aplicativo
│   │   ├── login.js
│   │   ├── home.js
│   │   ├── agendarConsulta.js
│   │   ├── chat.js
│   │   ├── historico.js
│   │   └── ...
│   ├── routes/         # Configuração de rotas
│   │   └── routes.js
│   └── service/        # Serviços e APIs
│       ├── authService.js
│       └── httpClient.js
├── App.js              # Componente principal
├── app.json            # Configuração do Expo
├── eas.json            # Configuração do EAS Build
└── package.json        # Dependências do projeto
```

## 🛠️ Build

Para gerar builds de produção:

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

