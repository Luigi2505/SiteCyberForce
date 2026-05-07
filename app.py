from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
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
    id_usuario = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    perfil = db.Column(db.String(20), nullable=False)
    data_nascimento = db.Column(db.Date, nullable=False)
    genero = db.Column(db.String(1))   
    peso = db.Column(db.Numeric(5, 2)) 
    altura = db.Column(db.Integer)    
    foto_perfil = db.Column(db.String(255), default='default_avatar.png') 

class Aluno(db.Model):
    __tablename__ = 'Aluno'
    id_aluno = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('Usuario.id_usuario'), nullable=False)
    objetivo = db.Column(db.String(100))

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
    
    campos_obrigatorios = ['nome', 'email', 'senha', 'cpf', 'data_nascimento']
    if not all(data.get(c) for c in campos_obrigatorios):
        return jsonify({'sucesso': False, 'mensagem': 'DADOS_INCOMPLETOS'}), 400

    try:
        # Consultas movidas para dentro do try
        if Usuario.query.filter_by(email=data.get('email')).first():
            return jsonify({'sucesso': False, 'mensagem': 'EMAIL_JÁ_REGISTRADO'}), 400
        if Usuario.query.filter_by(cpf=data.get('cpf')).first():
            return jsonify({'sucesso': False, 'mensagem': 'CPF_JÁ_REGISTRADO'}), 400
        
        data_nasc_texto = data.get('data_nascimento')
        data_nasc_mysql = datetime.strptime(data_nasc_texto, '%d/%m/%Y').date()

        novo_usuario = Usuario(
            nome=data.get('nome'),
            email=data.get('email'),
            senha=generate_password_hash(data.get('senha')),
            cpf=data.get('cpf'),
            perfil='aluno',
            data_nascimento=data_nasc_mysql,
            genero=data.get('genero'),
            peso=data.get('peso'),
            altura=data.get('altura')
            
        )
        db.session.add(novo_usuario)
        db.session.flush()

        novo_aluno = Aluno(
            id_usuario=novo_usuario.id_usuario
        )
        db.session.add(novo_aluno)
        
        db.session.commit()
        return jsonify({'sucesso': True})
        
    except ValueError:
        db.session.rollback()
        return jsonify({'sucesso': False, 'mensagem': 'FORMATO_DE_DATA_INVÁLIDO (Use DD/MM/AAAA)'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"=============================")
        print(f"ERRO REAL DO MYSQL: {e}")
        print(f"=============================")
        return jsonify({'sucesso': False, 'mensagem': f'ERRO NO BANCO: {str(e)}'}), 500
    
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

# ─── CRUD DE USUÁRIO: BUSCAR, ATUALIZAR E EXCLUIR ───

# 1. READ: Buscar os dados para preencher a tela
@app.route('/api/usuario/perfil', methods=['GET'])
def buscar_perfil():
    if 'usuario_id' not in session:
        return jsonify({"erro": "Não autorizado"}), 401
    
    usuario = Usuario.query.get(session['usuario_id'])
    
    # Busca o aluno (se existir) para pegar o objetivo
    aluno = Aluno.query.filter_by(id_usuario=usuario.id_usuario).first()
            
    return jsonify({
        "nome": usuario.nome,
        "email": usuario.email,
        "cpf": usuario.cpf,
        "data_nascimento": usuario.data_nascimento.strftime('%Y-%m-%d') if usuario.data_nascimento else "",
        "genero": usuario.genero,
        "peso": float(usuario.peso) if usuario.peso else 0,
        "altura": usuario.altura,
        "objetivo": aluno.objetivo if aluno else "",
        "foto_url": f"/static/uploads/perfil/{usuario.foto_perfil}"
    })

# 2. UPDATE: Atualizar Nome e Objetivo
@app.route('/api/usuario/atualizar_completo', methods=['POST'])
def atualizar_perfil_completo():
    if 'usuario_id' not in session:
        return jsonify({"sucesso": False, "mensagem": "Não autorizado"}), 401
    
    usuario = Usuario.query.get(session['usuario_id'])
    
    senha_confirmacao = request.form.get('senha_confirmacao')
    if not senha_confirmacao or not check_password_hash(usuario.senha, senha_confirmacao):
        return jsonify({"sucesso": False, "mensagem": "Senha incorreta."}), 403

    try:
        # Tratamento da Foto
        if 'foto' in request.files:
            file = request.files['foto']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(f"{usuario.id_usuario}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if usuario.foto_perfil and usuario.foto_perfil != 'default_avatar.png':
                    old_path = os.path.join(app.config['UPLOAD_FOLDER'], usuario.foto_perfil)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                file.save(file_path)
                usuario.foto_perfil = filename

        # Salvando os textos simples
        usuario.nome = request.form.get('nome')
        usuario.cpf = request.form.get('cpf')
        usuario.email = request.form.get('email')
        usuario.genero = request.form.get('genero')
        
        # Salvando a DATA DE NASCIMENTO
        data_nasc_str = request.form.get('data_nascimento')
        if data_nasc_str:
            usuario.data_nascimento = datetime.strptime(data_nasc_str, '%Y-%m-%d').date()

        # Salvando o PESO
        peso_str = request.form.get('peso')
        usuario.peso = float(peso_str) if peso_str and peso_str != 'None' else None

        # Salvando a ALTURA
        altura_str = request.form.get('altura')
        usuario.altura = int(altura_str) if altura_str and altura_str != 'None' else None
        
        # Salvando o OBJETIVO (caso seja aluno)
        objetivo_str = request.form.get('objetivo')
        aluno = Aluno.query.filter_by(id_usuario=usuario.id_usuario).first()
        if aluno and objetivo_str:
            aluno.objetivo = objetivo_str

        db.session.commit()
        session['nome'] = usuario.nome
        return jsonify({"sucesso": True, "mensagem": "Perfil atualizado!"})

    except Exception as e:
        db.session.rollback()
        print(f"Erro no Python ao salvar perfil: {e}") # Vai mostrar o erro real no terminal!
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor ao salvar."}), 500
    
# 3. DELETE: Apagar a conta do sistema com segurança
@app.route('/api/usuario/excluir', methods=['POST'])
def excluir_conta():
    if 'usuario_id' not in session:
        return jsonify({"sucesso": False}), 401
    
    id_alvo = session['usuario_id']
    usuario = Usuario.query.get(id_alvo)
    
    if usuario:
        try:
            # 1º PASSO: Lidar com o Aluno e seus Treinos
            aluno = Aluno.query.filter_by(id_usuario=id_alvo).first()
            if aluno:
                # TRAVA DE SEGURANÇA: Apaga os treinos e exercícios do aluno antes
                treinos = Treino.query.filter_by(id_aluno=aluno.id_aluno).all()
                for t in treinos:
                    ItemTreino.query.filter_by(id_treino=t.id_treino).delete()
                    db.session.delete(t)
                
                # Agora sim pode apagar o Aluno
                db.session.delete(aluno)
                
            # 2º PASSO: Apagar o Usuário principal
            db.session.delete(usuario)
            db.session.commit()
            
            # Limpa a sessão para deslogar a pessoa automaticamente
            session.clear()
            return jsonify({"sucesso": True})
            
        except Exception as e:
            # Se der qualquer erro no banco, ele desfaz tudo para não corromper os dados
            db.session.rollback()
            return jsonify({"sucesso": False, "erro": str(e)}), 500
            
    return jsonify({"sucesso": False}), 404



# Configurações de Upload de Imagem
UPLOAD_FOLDER = os.path.join('static', 'uploads', 'perfil') # Onde salvar
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'} # Tipos permitidos
MAX_CONTENT_LENGTH = 2 * 1024 * 1024 # Limite de tamanho (2MB)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Cria as pastas automaticamente se não existirem
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Função auxiliar para verificar extensão
def allowed_file(filename):
    return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS 



if __name__ == '__main__':
    app.run(debug=True)

