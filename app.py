from flask import Flask, render_template, request, session, jsonify
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
    id_usuario = db.Column(db.Integer, primary_key=True)
    nome       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(100), unique=True, nullable=False)
    senha      = db.Column(db.String(255), nullable=False)
    perfil     = db.Column(db.Enum('aluno', 'treinador', 'admin'), default='aluno')
    cpf        = db.Column(db.String(14), unique=True, nullable=False)

class Aluno(db.Model):
    __tablename__ = 'Aluno'
    id_aluno        = db.Column(db.Integer, primary_key=True)
    id_usuario      = db.Column(db.Integer, db.ForeignKey('Usuario.id_usuario'), nullable=False)
    id_treinador    = db.Column(db.Integer, nullable=True)
    data_nascimento = db.Column(db.Date)
    objetivo        = db.Column(db.String(100))

# ─── ROTAS ───

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data.get('email')).first()
        
        if usuario and check_password_hash(usuario.senha, data.get('senha')):
            session['usuario_id'] = usuario.id_usuario
            session['perfil'] = usuario.perfil
            return jsonify({'sucesso': True})
            
        return jsonify({'sucesso': False, 'mensagem': 'CREDENCIAIS_INVÁLIDAS'}), 401
    return render_template('login.html')

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
            perfil='aluno'
        )
        db.session.add(novo_usuario)
        db.session.flush() # Salva temporariamente para gerar o id_usuario

        # 5. Criar o Perfil de Aluno vinculado ao Usuário
        novo_aluno = Aluno(
            id_usuario=novo_usuario.id_usuario,
            data_nascimento=data_nasc_mysql
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
        return jsonify({'sucesso': False, 'mensagem': 'ERRO_INTERNO_NO_BANCO'}), 500

if __name__ == '__main__':
    app.run(debug=True)