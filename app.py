import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

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

# ─── MODELOS DE BANCO DE DADOS ───

class Usuario(db.Model):
    __tablename__ = 'Usuario'
    id_usuario = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    perfil = db.Column(db.Enum('aluno', 'treinador', 'admin'), default='aluno')
    data_nascimento = db.Column(db.Date, nullable=False)
    genero = db.Column(db.String(20))   
    peso = db.Column(db.Float) 
    altura = db.Column(db.Float)     

class Aluno(db.Model):
    __tablename__ = 'Aluno'
    id_aluno = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('Usuario.id_usuario'), nullable=False)
    objetivo = db.Column(db.String(100))

class Treino(db.Model):
    __tablename__ = 'Treino'
    id_treino    = db.Column(db.Integer, primary_key=True)
    id_aluno     = db.Column(db.Integer, db.ForeignKey('Aluno.id_aluno'), nullable=False)
    nome_treino  = db.Column(db.String(50), nullable=False) # PUSH, PULL, LEGS
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

class ItemTreino(db.Model):
    __tablename__ = 'Item_Treino'
    id_item_treino = db.Column(db.Integer, primary_key=True)
    id_treino      = db.Column(db.Integer, db.ForeignKey('Treino.id_treino'), nullable=False)
    nome_exercicio = db.Column(db.String(100))
    series         = db.Column(db.Integer)
    repeticoes     = db.Column(db.Integer)
    carga          = db.Column(db.Float)


# ─── ROTAS DE PÁGINAS (FRONTEND) ───

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/estoque')
def estoque():
    return render_template('store.html')

@app.route('/programacao')
def programacao():
    return render_template('schedule.html')

@app.route('/perfil')
def perfil():
    if 'usuario_id' not in session:
        return redirect(url_for('login'))
    return render_template('perfil.html')

@app.route('/logbook')
def logbook():
    if 'usuario_id' not in session:
        return redirect(url_for('login'))
    return render_template('logbook.html')

@app.route('/professor')
def professor_painel():
    if session.get('perfil') != 'treinador':
        return redirect(url_for('index'))
    return render_template('painel_professor.html')


# ─── ROTAS DE AUTENTICAÇÃO ───

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'usuario_id' in session:
        return redirect(url_for('index'))

    if request.method == 'POST':
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data.get('email')).first()
        
        if usuario and check_password_hash(usuario.senha, data.get('senha')):
            session['usuario_id'] = usuario.id_usuario
            session['perfil'] = usuario.perfil
            session['nome'] = usuario.nome
            session['email'] = usuario.email
            
            return jsonify({'sucesso': True, 'perfil': usuario.perfil, 'nome': usuario.nome, 'email': usuario.email})
            
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
        db.session.flush() # Gera o id_usuario para usar no Aluno

        novo_aluno = Aluno(id_usuario=novo_usuario.id_usuario)
        db.session.add(novo_aluno)
        
        db.session.commit()
        return jsonify({'sucesso': True})
        
    except ValueError:
        db.session.rollback()
        return jsonify({'sucesso': False, 'mensagem': 'FORMATO_DE_DATA_INVÁLIDO (Use DD/MM/AAAA)'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"ERRO DE CADASTRO: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'ERRO NO BANCO DE DADOS'}), 500


# ─── ROTAS DE API: PROFESSOR E TREINOS ───

@app.route('/api/professor/meus_alunos')
def meus_alunos():
    if session.get('perfil') != 'treinador':
        return jsonify([]), 403
    
    alunos = db.session.query(Usuario.nome, Aluno.id_aluno)\
            .join(Aluno, Usuario.id_usuario == Aluno.id_usuario).all()
    
    return jsonify([{"nome": a.nome, "id_aluno": a.id_aluno} for a in alunos])

@app.route('/api/professor/salvar_treino', methods=['POST'])
def salvar_treino():
    if session.get('perfil') != 'treinador':
        return jsonify({"erro": "Acesso negado."}), 403

    data = request.get_json()
    
    novo_treino = Treino(
        id_aluno=data.get('id_aluno'),
        nome_treino=data.get('categoria')
    )
    db.session.add(novo_treino)
    db.session.flush() 

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
    return jsonify({"sucesso": True, "mensagem": "Treino atribuído ao aluno com sucesso!"})

@app.route('/api/aluno/meu_treino/<categoria>', methods=['GET'])
def meu_treino(categoria):
    if 'usuario_id' not in session:
        return jsonify({"erro": "Acesso negado."}), 403
        
    aluno = Aluno.query.filter_by(id_usuario=session.get('usuario_id')).first()
    if not aluno:
        return jsonify({"erro": "Registro de aluno não encontrado."}), 404
        
    treino = Treino.query.filter_by(id_aluno=aluno.id_aluno, nome_treino=categoria.upper()).first()
    if not treino:
        return jsonify({"mensagem": "Nenhum treino encontrado para esta categoria."}), 404
        
    itens = ItemTreino.query.filter_by(id_treino=treino.id_treino).all()
    exercicios = [{"nome": e.nome_exercicio, "series": e.series, "reps": e.repeticoes, "carga": e.carga} for e in itens]
    
    return jsonify({
        "treino_id": treino.id_treino,
        "categoria": treino.nome_treino,
        "exercicios": exercicios
    })

@app.route('/admin/promover/<int:usuario_id>', methods=['POST'])
def promover_para_professor(usuario_id):
    if session.get('perfil') != 'admin':
        return "Acesso negado", 403
        
    usuario = Usuario.query.get(usuario_id)
    if usuario:
        usuario.perfil = 'treinador'
        db.session.commit()
        return f"Usuário {usuario.nome} agora é Professor!"
    return "Usuário não encontrado", 404


# ─── ROTAS DE API: PERFIL ───

@app.route('/api/usuario/perfil', methods=['GET'])
def buscar_perfil():
    if 'usuario_id' not in session:
        return jsonify({"erro": "Não autorizado"}), 401
    
    usuario = Usuario.query.get(session['usuario_id'])
    aluno = Aluno.query.filter_by(id_usuario=usuario.id_usuario).first()
            
    return jsonify({
        "nome": usuario.nome,
        "email": usuario.email,
        "cpf": usuario.cpf,
        "genero": usuario.genero,
        "peso": float(usuario.peso) if usuario.peso else 0,
        "altura": float(usuario.altura) if usuario.altura else 0,
        "data_nascimento": usuario.data_nascimento.strftime('%Y-%m-%d') if usuario.data_nascimento else "",
        "objetivo": aluno.objetivo if aluno else ""
    })

@app.route('/api/usuario/atualizar', methods=['POST'])
def atualizar_perfil():
    if 'usuario_id' not in session:
        return jsonify({"sucesso": False, "mensagem": "Não autorizado"}), 401
    
    data = request.get_json()
    usuario = Usuario.query.get(session['usuario_id'])
    
    if not usuario:
        return jsonify({"sucesso": False, "mensagem": "Usuário não encontrado"}), 404

    senha_confirmacao = data.get('senha_confirmacao')
    if not senha_confirmacao or not check_password_hash(usuario.senha, senha_confirmacao):
        return jsonify({"sucesso": False, "mensagem": "Senha incorreta. Alteração bloqueada."}), 403
    
    try:
        usuario.nome = data.get('nome')
        usuario.email = data.get('email')
        usuario.cpf = data.get('cpf')
        
        if data.get('genero'): usuario.genero = data.get('genero')
        if data.get('peso'): usuario.peso = data.get('peso')
        if data.get('altura'): usuario.altura = data.get('altura')
        
        if data.get('data_nascimento'):
            usuario.data_nascimento = datetime.strptime(data.get('data_nascimento'), '%Y-%m-%d').date()
                
        aluno = Aluno.query.filter_by(id_usuario=usuario.id_usuario).first()
        if aluno and 'objetivo' in data:
            aluno.objetivo = data.get('objetivo')
                
        db.session.commit()
        session['nome'] = usuario.nome 
        session['email'] = usuario.email
        return jsonify({"sucesso": True, "mensagem": "Perfil atualizado!"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"sucesso": False, "mensagem": "Erro: CPF ou Email já estão em uso."}), 400

@app.route('/api/usuario/excluir', methods=['POST'])
def excluir_conta():
    if 'usuario_id' not in session:
        return jsonify({"sucesso": False}), 401
    
    id_alvo = session['usuario_id']
    usuario = Usuario.query.get(id_alvo)
    
    if usuario:
        try:
            aluno = Aluno.query.filter_by(id_usuario=id_alvo).first()
            if aluno:
                treinos = Treino.query.filter_by(id_aluno=aluno.id_aluno).all()
                for t in treinos:
                    ItemTreino.query.filter_by(id_treino=t.id_treino).delete()
                    db.session.delete(t)
                db.session.delete(aluno)
                
            db.session.delete(usuario)
            db.session.commit()
            
            session.clear()
            return jsonify({"sucesso": True})
        except Exception as e:
            db.session.rollback()
            return jsonify({"sucesso": False, "erro": str(e)}), 500
            
    return jsonify({"sucesso": False}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)