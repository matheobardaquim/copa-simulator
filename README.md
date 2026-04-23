# 🏆 App Web Sorteio Copa do Mundo

Aplicação web para sorteio de grupos da Copa do Mundo, desenvolvida com Python (FastAPI) e React.

## 📋 Estrutura do Projeto

```
AppWebSorteio/
├── backend/          # API em FastAPI (Python)
│   ├── app.py
│   ├── sorteio.py
│   ├── logger_sorteio.py
│   ├── requirements.txt
│   ├── logs/         (criado automaticamente)
│   └── .gitignore
├── frontend/         # Interface em React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── TeamList.jsx
│   │   ├── PotCustomizer.jsx
│   │   ├── GroupsDisplay.jsx
│   │   └── CSS files
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
├── data/
│   └── teams.json    (48 times com potes e confederações)
└── README.md
```

## 🚀 Como Executar

### Backend (Python - FastAPI)

1. Entre na pasta do backend:
```bash
cd backend
```

2. Crie um ambiente virtual:
```powershell
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Execute o servidor:
```bash
python app.py
```

O backend estará rodando em `http://localhost:8000`

Para acessar a documentação interativa: `http://localhost:8000/docs`

### Frontend (React + Vite)

1. Abra **UM NOVO TERMINAL** e entre na pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## ✨ Funcionalidades Implementadas

### ✅ Versão Atual

1. **Tela 1 - Lista de Times**
   - Exibe todos os 48 times da Copa
   - Filtro por confederação
   - Filtro por pote
   - Visualização em grid responsivo

2. **Tela 2 - Sorteio**
   - Seleção do país sede (EUA, México, Canadá)
   - Sorteio padrão (potes predefinidos no JSON)
   - Sorteia 12 grupos de 4 times cada

3. **Tela 3 - Personalizar Potes** ⭐ NOVO
   - Arraste times entre potes para customizar
   - Validação automática (deve ter 48 times)
   - Visualização dos potes em diferentes modos
   - Botão para resetar aos valores padrão

4. **Tela 4 - Resultado**
   - Visualização dos 12 grupos criados
   - Cores por confederação
   - Logs detalhados do sorteio (clique para expandir)
   - Botões para novo sorteio ou voltar

### 🔧 Sistema de Logs ⭐ NOVO

O backend agora possui um sistema completo de logging:
- Arquivo de log em `backend/logs/sorteio.log`
- Registra cada alocação de time
- Mostra conflitos de confederação
- Exibe redistribuições
- Logs visíveis na interface (abra e feche com o botão)

### 🎯 Algoritmo de Sorteio Melhorado ⭐ NOVO

- **Validação de grupos**: Garante que cada grupo tem exatamente 4 times
- **Restrição de confederação**:
  - UEFA: máximo 2 por grupo
  - Outras confederações: máximo 1 por grupo
- **Distribuição inteligente**: Preenche grupos menos lotados primeiro
- **Paises sede**: Automaticamente colocado no Grupo A

## 📡 API Endpoints

### GET `/api/times`
Retorna todos os 48 times da Copa

```json
{
  "success": true,
  "total": 48,
  "times": [...]
}
```

### GET `/api/times/potes`
Retorna times agrupados por pote

```json
{
  "success": true,
  "potes": {
    "1": [...],
    "2": [...],
    "3": [...],
    "4": [...]
  }
}
```

### POST `/api/sorteio`
Realiza o sorteio com ou sem potes customizados

**Sem customização:**
```json
{
  "pais_sede": "USA",
  "potes_customizados": null
}
```

**Com customização:**
```json
{
  "pais_sede": "USA",
  "potes_customizados": {
    "1": [time1, time2, ...],
    "2": [time3, time4, ...],
    "3": [...],
    "4": [...]
  }
}
```

### GET `/api/logs`
Retorna os logs do último sorteio realizado

### GET `/api/sandboxes/{pais_sede}`
Faz 5 sorteios de teste (útil para validação)

## 📏 Regras do Sorteio (Da FIFA)

1. **Separação por Potes**
   - Pote 1: 8 melhores + país-sede
   - Pote 2-4: Em ordem descendente de ranking

2. **Restrição Geográfica**
   - Nenhuma confederação (exceto UEFA) tem mais de 1 time por grupo
   - UEFA pode ter até 2 times por grupo

3. **Ordem do Sorteio**
   - Pote 1 → Pote 2 → Pote 3 → Pote 4
   - País-sede sempre no Grupo A

## 🔄 Fluxo da Aplicação

```
┌─────────────────────┐
│  Tela 1: Times      │
│  (Lista + Filtros)  │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────────┐  ┌──────────────────┐
│ Sorteio     │  │ Personalizar     │
│ Padrão      │  │ Potes (Arrastar) │
└──────┬──────┘  └──────┬───────────┘
       │                │
       └────────┬───────┘
                │
                ▼
       ┌─────────────────┐
       │ Tela 4: Grupos  │
       │ + Logs          │
       └─────────────────┘
```

## 🎨 Cores do Design

- **Purpura principal**: #667eea
- **Purpura secundária**: #764ba2
- **Ouro (Pote 1)**: #ffd700
- **Prata (Pote 2)**: #c0c0c0
- **Bronze (Pote 3)**: #cd7f32
- **Cinza (Pote 4)**: #728791

## ⚙️ Techs Utilizadas

**Backend:**
- FastAPI 0.104.1
- Python 3.x
- Uvicorn

**Frontend:**
- React 18.2
- Vite 5.0
- Axios 1.6
- CSS3 (Grid, Flexbox, Gradientes)

## 📝 Notas Importantes

- O backend DEVE estar rodando na porta 8000 antes do frontend
- Frontend em porta 3000
- CORS habilitado para comunicação local
- Logs persistentes em `backend/logs/sorteio.log`
- Suporta múltiplos sorteios simultâneos

## 🐛 Troubleshooting

**"Erro ao realizar o sorteio"**
- Verifique se o backend está rodando (`http://localhost:8000`)
- Olhe os logs do backend no terminal

**Times em grupos com menos de 4**
- Verifique os logs para entender o conflito
- Tente personalizar os potes manualmente

**Logs não aparecem**
- Click no botão "Mostrar Logs" após cada sorteio
- Verifique a pasta `backend/logs/`

---

**Pronto para sorteios! 🎉**

