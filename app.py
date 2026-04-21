from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'cyberforce_2026_key')

# Configuração da Conexão
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─── MODELOS QUE REFLETEM O SEU BANCO DE DADOS ───

class Usuario(db.Model):
    __tablename__ = 'Usuario'
    id_usuario      = db.Column(db.Integer, primary_key=True)
    nome            = db.Column(db.String(100), nullable=False)
    email           = db.Column(db.String(100), unique=True, nullable=False)
    senha           = db.Column(db.String(255), nullable=False)
    perfil          = db.Column(db.Enum('aluno', 'treinador', 'admin'), default='aluno')
    cpf             = db.Column(db.String(14), unique=True, nullable=False)
    data_nascimento = db.Column(db.Date) 
class Aluno(db.Model):
    __tablename__ = 'Aluno'
    id_aluno        = db.Column(db.Integer, primary_key=True)
    id_usuario      = db.Column(db.Integer, db.ForeignKey('Usuario.id_usuario'), nullable=False)
    id_treinador    = db.Column(db.Integer, nullable=True)
    objetivo        = db.Column(db.String(100))

# ─── ROTAS ───

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # 1. TRAVA DE SEGURANÇA: Se já tem id na sessão, joga de volta pra Home!
    if 'usuario_id' in session:
        return redirect(url_for('index'))

    if request.method == 'POST':
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data.get('email')).first()
        
        if usuario and check_password_hash(usuario.senha, data.get('senha')):
            # 2. SALVA TUDO NA SESSÃO DO SERVIDOR (Mais seguro que localStorage)
            session['usuario_id'] = usuario.id_usuario
            session['perfil'] = usuario.perfil
            session['nome'] = usuario.nome
            session['email'] = usuario.email
            
            # Não precisamos mais mandar os dados pro JS, o Flask vai cuidar disso.
            return jsonify({'sucesso': True})
            
        return jsonify({'sucesso': False, 'mensagem': 'CREDENCIAIS_INVÁLIDAS'}), 401
        
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear() 
    return redirect(url_for('index'))

@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.get_json()
    
    # 1. Verificação de campos preenchidos
    campos_obrigatorios = ['nome', 'email', 'senha', 'cpf', 'data_nascimento']
    if not all(data.get(c) for c in campos_obrigatorios):
        return jsonify({'sucesso': False, 'mensagem': 'DADOS_INCOMPLETOS'}), 400

    # 2. Verifica se o email ou CPF já existem
    if Usuario.query.filter_by(email=data.get('email')).first():
        return jsonify({'sucesso': False, 'mensagem': 'EMAIL_JÁ_REGISTRADO'}), 400
    if Usuario.query.filter_by(cpf=data.get('cpf')).first():
        return jsonify({'sucesso': False, 'mensagem': 'CPF_JÁ_REGISTRADO'}), 400
    
    try:
        # 3. Converter a data de DD/MM/AAAA (Frontend) para AAAA-MM-DD (MySQL)
        data_nasc_texto = data.get('data_nascimento')
        data_nasc_mysql = datetime.strptime(data_nasc_texto, '%d/%m/%Y').date()

        # 4. Criar o Usuário (Acesso)
        novo_usuario = Usuario(
            nome=data.get('nome'),
            email=data.get('email'),
            senha=generate_password_hash(data.get('senha')),
            cpf=data.get('cpf'),
            perfil='aluno',
            data_nascimento=data_nasc_mysql # <--- A DATA ENTRA AQUI AGORA
        )
        db.session.add(novo_usuario)
        db.session.flush() # Salva temporariamente para gerar o id_usuario

        # 5. Criar o Perfil de Aluno vinculado ao Usuário
        novo_aluno = Aluno(
            id_usuario=novo_usuario.id_usuario
        )
        db.session.add(novo_aluno)
        
        # Confirma tudo no banco
        db.session.commit()
        return jsonify({'sucesso': True})
        
    except ValueError:
        db.session.rollback()
        return jsonify({'sucesso': False, 'mensagem': 'FORMATO_DE_DATA_INVÁLIDO (Use DD/MM/AAAA)'}), 400
    except Exception as e:
        db.session.rollback()
        # ISSO AQUI VAI MOSTRAR O ERRO REAL NO SEU TERMINAL DO VSCODE/PROMPT:
        print(f"=============================")
        print(f"ERRO REAL DO MYSQL: {e}")
        print(f"=============================")
        
        # E vai enviar um pedaço do erro para a tela vermelha do site pra facilitar
        return jsonify({'sucesso': False, 'mensagem': f'ERRO NO BANCO: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
    
# ROTA PARA O PROFESSOR VER SEUS ALUNOS E CRIAR TREINOS
@app.route('/api/professor/alunos', methods=['GET'])
def listar_alunos_do_professor():
    # Verifica se quem está logado é professor (tipo 2)
    if session.get('tipo_conta') != 2:
        return jsonify({"erro": "Acesso negado. Apenas professores."}), 403
        
    professor_id = session.get('usuario_id')
    alunos = Usuario.query.filter_by(professor_id=professor_id).all()
    
    resultado = [{"id": a.id, "nome": a.nome, "email": a.email} for a in alunos]
    return jsonify(resultado)

@app.route('/api/professor/criar_treino', methods=['POST'])
def criar_treino():
    if session.get('tipo_conta') != 2:
        return jsonify({"erro": "Acesso negado."}), 403
        
    dados = request.json
    aluno_id = dados.get('aluno_id')
    # Cria o "Cabeçalho" do Treino (Ex: PUSH)
    novo_treino = Treino(nome_treino=dados.get('nome_treino'), aluno_id=aluno_id)
    db.session.add(novo_treino)
    db.session.commit()
    
    # Adiciona os exercícios dentro desse treino
    for ex in dados.get('exercicios'):
        novo_ex = ExercicioTreino(
            treino_id=novo_treino.id,
            nome_exercicio=ex['nome'],
            series=ex['series'],
            reps=ex['reps'],
            carga_recomendada=ex['carga']
        )
        db.session.add(novo_ex)
    
    db.session.commit()
    return jsonify({"mensagem": "Treino atribuído ao aluno com sucesso!"})

# ROTA PARA O ALUNO VER SEU PRÓPRIO TREINO
@app.route('/api/aluno/meu_treino/<categoria>', methods=['GET'])
def meu_treino(categoria):
    # Verifica se é aluno (tipo 3)
    if session.get('tipo_conta') != 3:
        return jsonify({"erro": "Acesso negado."}), 403
        
    aluno_id = session.get('usuario_id')
    # Busca o treino do aluno pela categoria (PUSH, PULL, LEGS)
    treino = Treino.query.filter_by(aluno_id=aluno_id, nome_treino=categoria.upper()).first()
    
    if not treino:
        return jsonify({"mensagem": "Nenhum treino encontrado para esta categoria."}), 404
        
    exercicios = [{"nome": e.nome_exercicio, "series": e.series, "reps": e.reps, "carga": e.carga_recomendada} for e in treino.exercicios]
    
    return jsonify({
        "treino_id": treino.id,
        "categoria": treino.nome_treino,
        "exercicios": exercicios
    })

@app.route('/admin/promover/<int:usuario_id>', methods=['POST'])
def promover_para_professor(usuario_id):
    # Verifica se quem está logado é ADMIN (tipo 1)
    if session.get('tipo_conta') != 1:
        return "Acesso negado", 403
        
    usuario = Usuario.query.get(usuario_id)
    if usuario:
        usuario.tipo_conta = 2
        db.session.commit()
        return f"Usuário {usuario.nome} agora é Professor!"
    return "Usuário não encontrado", 404

# Novos Modelos baseados no teu DER
class Treino(db.Model):
    __tablename__ = 'Treino'
    id_treino    = db.Column(db.Integer, primary_key=True)
    id_aluno     = db.Column(db.Integer, db.ForeignKey('Aluno.id_aluno'), nullable=False)
    nome_treino  = db.Column(db.String(50), nullable=False) # PUSH, PULL, etc
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

class ItemTreino(db.Model):
    __tablename__ = 'Item_Treino'
    id_item_treino = db.Column(db.Integer, primary_key=True)
    id_treino      = db.Column(db.Integer, db.ForeignKey('Treino.id_treino'), nullable=False)
    nome_exercicio = db.Column(db.String(100)) # Simplificado para o MVP
    series         = db.Column(db.Integer)
    repeticoes     = db.Column(db.Integer)
    carga          = db.Column(db.Float)

# ROTA: Lista apenas os alunos que estão sem treinador ou vinculados a este prof
@app.route('/api/professor/meus_alunos')
def meus_alunos():
    if session.get('perfil') != 'treinador':
        return jsonify([]), 403
    
    # Busca todos os alunos no sistema
    alunos = db.session.query(Usuario.nome, Aluno.id_aluno)\
             .join(Aluno, Usuario.id_usuario == Aluno.id_usuario).all()
    
    return jsonify([{"nome": a.nome, "id_aluno": a.id_aluno} for a in alunos])

# ROTA: Salva o treino montado
@app.route('/api/professor/salvar_treino', methods=['POST'])
def salvar_treino():
    data = request.get_json()
    
    # 1. Cria o cabeçalho do treino
    novo_treino = Treino(
        id_aluno=data.get('id_aluno'),
        nome_treino=data.get('categoria')
    )
    db.session.add(novo_treino)
    db.session.flush() 

    # 2. Adiciona os itens (exercícios)
    for ex in data.get('exercicios'):
        item = ItemTreino(
            id_treino=novo_treino.id_treino,
            nome_exercicio=ex['nome'],
            series=ex['series'],
            repeticoes=ex['reps'],
            carga=ex['carga']
        )
        db.session.add(item)
    
    db.session.commit()
    return jsonify({"sucesso": True})